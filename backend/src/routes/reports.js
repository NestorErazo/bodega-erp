import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

// Parámetro de periodo: day|week|biweek|month|quarter|semester|year|custom
function rangeFor(period, { desde, hasta } = {}) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (period === 'custom' && desde && hasta) {
    start.setHours(0, 0, 0, 0);
    start.setDate(0); // reset
    const s = new Date(desde); s.setHours(0, 0, 0, 0);
    const h = new Date(hasta); h.setHours(23, 59, 59, 999);
    return { start: s, end: h };
  }
  switch (period) {
    case 'day': start.setHours(0, 0, 0, 0); break;
    case 'week': start.setHours(0, 0, 0, 0); start.setDate(now.getDate() - now.getDay()); break;
    case 'biweek': start.setHours(0, 0, 0, 0); start.setDate(now.getDate() < 15 ? 1 : 16); break;
    case 'month': start.setHours(0, 0, 0, 0); start.setDate(1); break;
    case 'quarter': start.setHours(0, 0, 0, 0); start.setMonth(now.getMonth() - (now.getMonth() % 3)); start.setDate(1); break;
    case 'semester': start.setHours(0, 0, 0, 0); start.setMonth(now.getMonth() - (now.getMonth() % 6)); start.setDate(1); break;
    case 'year': start.setHours(0, 0, 0, 0); start.setMonth(0); start.setDate(1); break;
    default: start.setHours(0, 0, 0, 0); start.setDate(1);
  }
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

router.get('/resumen', async (req, res, next) => {
  try {
    const { period = 'month', desde, hasta } = req.query;
    const { start, end } = rangeFor(period, { desde, hasta });
    const where = { status: 'vigente', date: { gte: start, lte: end } };

    const [ventas, items, compras, gastos, cxc, cxp, devoluciones] = await Promise.all([
      prisma.sale.findMany({ where, include: { payments: true } }),
      prisma.saleItem.findMany({ where: { sale: { is: where } }, include: { product: true } }),
      prisma.purchase.aggregate({ where: { status: { not: 'anulada' }, date: { gte: start, lte: end } }, _sum: { total: true }, _count: true }),
      prisma.expense.aggregate({ where: { date: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
      prisma.accountReceivable.aggregate({ where: { status: { in: ['pendiente', 'parcial'] } }, _sum: { amount: true, paid: true } }),
      prisma.accountPayable.aggregate({ where: { status: { in: ['pendiente', 'parcial'] } }, _sum: { amount: true, paid: true } }),
      prisma.return.count({ where: { date: { gte: start, lte: end } } }),
    ]);

    const ingresos = ventas.reduce((s, v) => s + v.total, 0);
    const costo = items.reduce((s, i) => s + i.cost * i.quantity, 0);
    const gastoTotal = gastos._sum.amount || 0;
    const comprasTotal = compras._sum.total || 0;
    const metodos = {};
    for (const v of ventas) for (const p of v.payments) metodos[p.method] = (metodos[p.method] || 0) + p.amount;

    res.json({
      periodo: { inicio: start, fin: end },
      ventas: { brutas: ingresos, tickets: ventas.length, promedioTicket: ventas.length ? ingresos / ventas.length : 0, unidades: items.reduce((s, i) => s + i.quantity, 0) },
      costos: { mercancia: costo, compras: comprasTotal, gastosOperativos: gastoTotal, total: costo + gastoTotal },
      utilidad: {
        bruta: ingresos - costo,
        margenBruto: ingresos > 0 ? ((ingresos - costo) / ingresos) * 100 : 0,
        neta: ingresos - costo - gastoTotal,
        margenNeto: ingresos > 0 ? ((ingresos - costo - gastoTotal) / ingresos) * 100 : 0,
      },
      metodosPago: Object.entries(metodos).map(([metodo, valor]) => ({ metodo, valor })),
      devoluciones,
      cartera: { porCobrar: (cxc._sum.amount || 0) - (cxc._sum.paid || 0), porPagar: (cxp._sum.amount || 0) - (cxp._sum.paid || 0) },
    });
  } catch (e) { next(e); }
});

router.get('/serie', async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const { start, end } = rangeFor(period);
    const sales = await prisma.sale.findMany({
      where: { status: 'vigente', date: { gte: start, lte: end } },
      include: { items: true },
    });

    const buildKey = (d) => {
      if (period === 'day') return d.toISOString().slice(0, 10);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const map = {};
    for (const s of sales) {
      const k = buildKey(new Date(s.date));
      if (!map[k]) map[k] = { fecha: k, ventas: 0, unidades: 0, utilidad: 0, facturas: 0 };
      map[k].ventas += s.total;
      map[k].facturas += 1;
      for (const i of s.items) {
        map[k].unidades += i.quantity;
        map[k].utilidad += (i.price - i.cost) * i.quantity;
      }
    }
    const entries = Object.values(map).sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (period === 'day') return res.json(entries.slice(-30));
    res.json(entries);
  } catch (e) { next(e); }
});

router.get('/top', async (req, res, next) => {
  try {
    const { period = 'month', limit = 10 } = req.query;
    const { start, end } = rangeFor(period);
    const items = await prisma.saleItem.findMany({
      where: { sale: { is: { status: 'vigente', date: { gte: start, lte: end } } } },
      include: { product: true },
      orderBy: { total: 'desc' },
    });
    const map = {};
    for (const i of items) {
      const name = i.product.name;
      if (!map[name]) map[name] = { producto: name, unidades: 0, ventas: 0, utilidad: 0, costo: 0 };
      map[name].unidades += i.quantity;
      map[name].ventas += i.total;
      map[name].costo += i.cost * i.quantity;
      map[name].utilidad += (i.price - i.cost) * i.quantity;
    }
    const ranked = Object.values(map).sort((a, b) => b.ventas - a.ventas).slice(0, Number(limit));
    res.json(ranked.map((r) => ({ ...r, margen: r.ventas > 0 ? (r.utilidad / r.ventas) * 100 : 0 })));
  } catch (e) { next(e); }
});

// Rentabilidad por categoría
router.get('/categories', async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const { start, end } = rangeFor(period);
    const items = await prisma.saleItem.findMany({
      where: { sale: { is: { status: 'vigente', date: { gte: start, lte: end } } } },
      include: { product: { include: { category: true } } },
    });
    const map = {};
    for (const i of items) {
      const cat = i.product.category?.name || 'Sin categoría';
      if (!map[cat]) map[cat] = { categoria: cat, ventas: 0, ganancia: 0, unidades: 0 };
      map[cat].ventas += i.total;
      map[cat].unidades += i.quantity;
      map[cat].ganancia += (i.price - i.cost) * i.quantity;
    }
    res.json({ porCategoria: Object.values(map).sort((a, b) => b.ventas - a.ventas) });
  } catch (e) { next(e); }
});

// Metas globales simples (basadas en ventas del período actual)
router.get('/goals', async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [daySales, monthSales, yearSales] = await Promise.all([
      prisma.sale.findMany({ where: { status: 'vigente', date: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), lte: now } }, select: { total: true } }),
      prisma.sale.findMany({ where: { status: 'vigente', date: { gte: monthStart, lte: monthEnd } }, select: { total: true } }),
      prisma.sale.findMany({ where: { status: 'vigente', date: { gte: yearStart, lte: now } }, select: { total: true } }),
    ]);

    const sum = (arr) => arr.reduce((s, x) => s + x.total, 0);
    // Metas por defecto basadas en histórico: mensual = 30M, diaria = 1.2M, anual = 360M
    const metaMensual = 30000000;
    const metaDiaria = 1200000;
    const metaAnual = 360000000;

    res.json({
      diaria: { meta: metaDiaria, vendido: sum(daySales) },
      mensual: { meta: metaMensual, vendido: sum(monthSales) },
      anual: { meta: metaAnual, vendido: sum(yearSales) },
    });
  } catch (e) { next(e); }
});

export default router;