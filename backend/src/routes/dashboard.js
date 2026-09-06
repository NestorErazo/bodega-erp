import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

function startOfDay(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - Math.abs(offsetDays));
  d.setHours(0, 0, 0, 0);
  return d;
}

async function salesInRange(gte, lt) {
  const agg = await prisma.sale.aggregate({
    where: { status: 'vigente', date: { gte, ...(lt ? { lt } : {}) } },
    _sum: { total: true },
    _count: true,
  });
  return { total: agg._sum.total || 0, count: agg._count };
}

router.get('/', async (_req, res, next) => {
  try {
    const now = new Date();
    const today = startOfDay(0);
    const yesterday = startOfDay(1);
    const startWeek = new Date(now); startWeek.setDate(now.getDate() - now.getDay()); startWeek.setHours(0, 0, 0, 0);
    const startQuincena = new Date(now.getFullYear(), now.getMonth(), now.getDate() < 15 ? 1 : 16);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startSemestre = new Date(now); startSemestre.setMonth(now.getMonth() - (now.getMonth() % 6)); startSemestre.setDate(1); startSemestre.setHours(0, 0, 0, 0);
    const startYear = new Date(now.getFullYear(), 0, 1);

    const [hoy, ayer, semana, quincena, mes, semestre, anio] = await Promise.all([
      salesInRange(today, null), salesInRange(yesterday, today), salesInRange(startWeek, null),
      salesInRange(startQuincena, null), salesInRange(startMonth, null), salesInRange(startSemestre, null),
      salesInRange(startYear, null),
    ]);

    // Costo de mercancía vendida del mes (suma de costos de ítems de ventas vigentes)
    const mesItems = await prisma.saleItem.findMany({
      where: { sale: { date: { gte: startMonth }, status: 'vigente' } },
      select: { cost: true, quantity: true },
    });
    const costoMercancia = mesItems.reduce((s, i) => s + i.cost * i.quantity, 0);

    // Gastos del mes
    const gastosAg = await prisma.expense.aggregate({ where: { date: { gte: startMonth } }, _sum: { amount: true } });
    const gastos = gastosAg._sum.amount || 0;

    // Inventario
    const products = await prisma.product.findMany({ include: { variants: true } });
    let totalStock = 0, inventoryValueCost = 0, inventoryValueSale = 0, agotados = 0, stockBajo = 0, sinMovimiento = 0, inventarioPorCategoría = {};
    for (const p of products) {
      const stock = p.variants.reduce((s, v) => s + v.stock, 0);
      totalStock += stock;
      inventoryValueCost += stock * p.avgCost;
      inventoryValueSale += stock * (p.salePrice || 0);
      if (stock <= 0) agotados++;
      else if (stock <= p.stockMin) stockBajo++;
    }

    // Cartera
    const cxc = await prisma.accountReceivable.aggregate({ where: { status: { in: ['pendiente', 'parcial'] } }, _sum: { amount: true, paid: true } });
    const cxp = await prisma.accountPayable.aggregate({ where: { status: { in: ['pendiente', 'parcial'] } }, _sum: { amount: true, paid: true } });

    // Caja y bancos
    const cashMovesSum = await prisma.cashMovement.findMany({ select: { amount: true } });
    const caja = cashMovesSum.reduce((s, m) => s + m.amount, 0);
    const banks = await prisma.bankAccount.findMany({ include: { movements: true } });
    const bancos = banks.reduce((s, b) => s + b.initialBalance + b.movements.reduce((x, m) => x + m.amount, 0), 0);

    const utilidadBruta = hoy.total - costoMercancia; // del mes
    const cxcSaldo = (cxc._sum.amount || 0) - (cxc._sum.paid || 0);
    const cxpSaldo = (cxp._sum.amount || 0) - (cxp._sum.paid || 0);

    const lastMovements = await prisma.inventoryMovement.findMany({
      take: 8, orderBy: { date: 'desc' },
      include: { product: { select: { name: true } }, user: { select: { name: true } } },
    });

    res.json({
      generatedAt: now.toISOString(),
      ventas: { hoy: hoy.total, ayer: ayer.total, semana: semana.total, quincena: quincena.total, mes: mes.total, semestre: semestre.total, anio: anio.total, ticketsHoy: hoy.count },
      finanzas: {
        costoMercancia, utilidadBruta: mes.total - costoMercancia,
        margenBruto: mes.total > 0 ? ((mes.total - costoMercancia) / mes.total) * 100 : 0,
        gastos, utilidadNeta: mes.total - costoMercancia - gastos,
        inventarioValor: inventoryValueCost, cuentasPorCobrar: cxcSaldo, cuentasPorPagar: cxpSaldo,
        caja, bancos,
      },
      inventory: {
        totalProducts: products.length, totalStock, agotados, stockBajo, sinMovimiento,
        valoreCosto: inventoryValueCost, valorVenta: inventoryValueSale,
      },
      movimientos: lastMovements.map((m) => ({ id: m.id, date: m.date, type: m.type, quantity: m.quantity, product: m.product.name, user: m.user.name, reason: m.reason })),
    });
  } catch (e) { next(e); }
});

// Alertas de inventario + cartera vencida + cuentas por pagar próximas
router.get('/alerts', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({ include: { variants: true, _count: { select: { inventoryMovements: true } } } });
    const alerts = [];
    for (const p of products) {
      const stock = p.variants.reduce((s, v) => s + v.stock, 0);
      if (stock <= 0) alerts.push({ type: 'agotado', severity: 'critical', productId: p.id, product: p.name, code: p.code, stock });
      else if (stock <= p.stockMin) alerts.push({ type: 'stock_bajo', severity: 'warning', productId: p.id, product: p.name, code: p.code, stock, min: p.stockMin });
      if (stock > p.stockMax) alerts.push({ type: 'inventario_excesivo', severity: 'info', productId: p.id, product: p.name, code: p.code, stock });
    }
    const carteraVencida = await prisma.accountReceivable.findMany({ where: { status: 'pendiente', dueDate: { lt: new Date() } }, include: { customer: true } });
    for (const c of carteraVencida) {
      alerts.push({ type: 'cartera_vencida', severity: 'warning', product: c.customer.name, code: `CXC-${c.id}`, stock: c.amount - c.paid, min: 0, extra: `Vence ${c.dueDate.toLocaleDateString('es-CO')}` });
    }
    res.json(alerts);
  } catch (e) { next(e); }
});

// Gráficos
router.get('/charts', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ include: { products: { include: { variants: true } } } });
    const byCategory = categories.map((c) => ({
      category: c.name,
      products: c.products.length,
      stock: c.products.reduce((s, p) => s + p.variants.reduce((x, v) => x + v.stock, 0), 0),
      value: c.products.reduce((s, p) => s + p.variants.reduce((x, v) => x + v.stock * v.cost, 0), 0),
    }));

    // Ventas de los últimos 7 días y últimos 30
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const start = startOfDay(i);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const agg = await prisma.sale.aggregate({ where: { status: 'vigente', date: { gte: start, lt: end } }, _sum: { total: true } });
      weekly.push({ date: start.toISOString().slice(0, 10), ventas: agg._sum.total || 0 });
    }

    // Ventas por método de pago (últimos 30 días)
    const desde = startOfDay(30);
    const payments = await prisma.salePayment.findMany({ where: { sale: { status: 'vigente', date: { gte: desde } } } });
    const byMethod = {};
    for (const p of payments) byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
    const metodosPago = Object.entries(byMethod).map(([metodo, valor]) => ({ metodo, valor }));

    // Top productos (por ventas, últimos 30 días)
    const desdeItems = startOfDay(30);
    const items = await prisma.saleItem.findMany({ where: { sale: { status: 'vigente', date: { gte: desdeItems } } }, include: { product: true } });
    const topMap = {};
    for (const i of items) {
      if (!topMap[i.product.name]) topMap[i.product.name] = { producto: i.product.name, unidades: 0, ventas: 0, utilidad: 0 };
      topMap[i.product.name].unidades += i.quantity;
      topMap[i.product.name].ventas += i.total;
      topMap[i.product.name].utilidad += (i.price - i.cost) * i.quantity;
    }
    const productosTop = Object.values(topMap).sort((a, b) => b.ventas - a.ventas).slice(0, 10);

    res.json({ byCategory, weekly, metodosPago, productosTop });
  } catch (e) { next(e); }
});

export default router;