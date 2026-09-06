import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { logAudit } from '../utils/audit.js';

const router = Router();
router.use(authRequired);

const saleInclude = {
  user: { select: { name: true } },
  customer: true,
  items: { include: { product: { select: { name: true, reference: true } }, variant: { include: { size: true, color: true } } } },
  payments: true,
};

function serializeSale(s) {
  return {
    ...s,
    cliente: s.customer?.name || 'Cliente mostrador',
    vendedor: s.user?.name,
    fecha: s.date,
    metodo: s.payments[0]?.method || '—',
    items: s.items.map((i) => ({
      producto: i.product.name,
      talla: i.variant?.size?.name || 'U',
      color: i.variant?.color?.name || '—',
      cantidad: i.quantity,
      precio: i.price,
      descuento: i.discount,
      total: i.total,
    })),
    detalle: s.items.map((i) => `${i.quantity} × ${i.product.name}`).join(', '),
  };
}

// ---------- LISTADO / FILTROS ----------
router.get('/', requirePermission(['sales.view', 'pos.sell', 'sales.manage']), async (req, res, next) => {
  try {
    const { q, method, fechaDesde, fechaHasta, limit = 200 } = req.query;
    const where = {};
    if (q) where.OR = [{ number: { contains: q } }, { customer: { name: { contains: q } } }];
    if (fechaDesde || fechaHasta) {
      where.date = {};
      if (fechaDesde) where.date.gte = new Date(fechaDesde);
      if (fechaHasta) where.date.lte = new Date(fechaHasta + 'T23:59:59');
    }
    const sales = await prisma.sale.findMany({ where, take: Number(limit), orderBy: { date: 'desc' }, include: saleInclude });
    let result = sales.map(serializeSale);
    if (method) result = result.filter((s) => s.metodo === method);
    res.json(result);
  } catch (e) { next(e); }
});

// ---------- DETALLE ----------
router.get('/:id', async (req, res, next) => {
  try {
    const s = await prisma.sale.findUnique({ where: { id: Number(req.params.id) }, include: saleInclude });
    if (!s) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(serializeSale(s));
  } catch (e) { next(e); }
});

// ---------- CREAR VENTA (POS) ----------
// Transacción atómica: valida stock, descuenta inventario, registra kardex,
// venta + items + pagos, afecta caja, y crea cuenta por cobrar si es crédito.
router.post('/', requirePermission(['pos.sell', 'sales.manage']), async (req, res, next) => {
  try {
    const { customerId, items, payments, cashRegisterId, discount = 0, tax = 0, notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'La venta requiere al menos un ítem' });
    if (!payments || payments.length === 0) return res.status(400).json({ error: 'La venta requiere al menos un medio de pago' });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validar y preparar ítems contra inventario
      const prepared = [];
      let subtotal = 0;
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: Number(item.productId) } });
        if (!product) throw new Error(`Producto ${item.productId} no existe`);
        const variant = item.variantId
          ? await tx.productVariant.findUnique({ where: { id: Number(item.variantId) } })
          : await tx.productVariant.findFirst({ where: { productId: product.id } });
        if (!variant) throw new Error(`Sin variante para ${product.name}`);

        const qty = Number(item.quantity) || 1;
        if (variant.stock < qty) {
          throw new Error(`Stock insuficiente de ${product.name} (disponible: ${variant.stock})`);
        }
        const price = Number(item.price) || variant.price || product.salePrice;
        const itemTotal = price * qty;
        subtotal += itemTotal;
        prepared.push({ product, variant, qty, price, total: itemTotal, cost: variant.cost || product.avgCost });
      }

      const discountVal = Number(discount) || 0;
      const taxVal = Number(tax) || 0;
      const total = Math.max(0, subtotal - discountVal + taxVal);
      const payTotal = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      if (payTotal < total - 0.01) throw new Error(`Los pagos ($${payTotal}) no cubren el total ($${total})`);

      // 2. Numeración y creación de la venta
      const settings = await tx.setting.findFirst({ where: { key: 'document.factura' } });
      const lastSale = await tx.sale.findFirst({ orderBy: { id: 'desc' }, select: { number: true } });
      let nextNum = 1001;
      if (settings) {
        const n = Number(String(settings.value).split('-').pop());
        nextNum = (n || 1000) + 1;
      }
      if (lastSale) {
        const lastNum = Number(String(lastSale.number).split('-').pop());
        if (lastNum >= nextNum) nextNum = lastNum + 1;
      }
      const number = `FAC-${nextNum}`;
      if (settings) await tx.setting.update({ where: { id: settings.id }, data: { value: number } });

      const sale = await tx.sale.create({
        data: {
          number,
          userId: req.user.id,
          customerId: customerId ? Number(customerId) : null,
          subtotal, discount: discountVal, tax: taxVal, total,
          items: {
            create: prepared.map((p) => ({
              productId: p.product.id, variantId: p.variant.id, quantity: p.qty,
              price: p.price, discount: 0, cost: p.cost, total: p.total,
            })),
          },
          payments: {
            create: payments.map((p) => ({
              method: p.method, amount: Number(p.amount),
              cashRegisterId: p.method === 'credit' || p.method === 'credito' ? null : (cashRegisterId ? Number(cashRegisterId) : null),
            })),
          },
        },
      });

      // 3. Descontar inventario + kardex
      for (const p of prepared) {
        await tx.productVariant.update({
          where: { id: p.variant.id },
          data: { stock: p.variant.stock - p.qty },
        });
        await tx.inventoryMovement.create({
          data: { userId: req.user.id, productId: p.product.id, variantId: p.variant.id, type: 'SALIDA', quantity: p.qty, cost: p.cost, documentRef: number, reason: 'Venta POS' },
        });
      }

      // 4. Movimientos de caja para pagos no crédito
      if (cashRegisterId) {
        for (const pay of payments) {
          if (pay.method === 'credito' || pay.method === 'credit') continue;
          await tx.cashMovement.create({
            data: { cashRegisterId: Number(cashRegisterId), userId: req.user.id, type: 'venta', concept: `Venta ${number}`, amount: Number(pay.amount), method: pay.method, documentRef: number },
          });
        }
      }

      // 5. Cuenta por cobrar si hay crédito
      const creditPay = payments.find((p) => p.method === 'credito' || p.method === 'credit');
      if (creditPay && customerId) {
        const due = new Date(); due.setDate(due.getDate() + 15);
        await tx.accountReceivable.create({
          data: { customerId: Number(customerId), saleId: sale.id, dueDate: due, amount: Number(creditPay.amount) || 0, paid: 0, status: 'pendiente' },
        });
      }

      return { sale };
    }, { timeout: 20000 });

    await logAudit(req.user.id, 'CREATE', 'sale', result.sale.id, { number: result.sale.number, total: result.sale.total });

    const full = await prisma.sale.findUnique({ where: { id: result.sale.id }, include: saleInclude });
    res.status(201).json(serializeSale(full));
  } catch (e) {
    if (e.message.startsWith('Stock insuficiente') || e.message.includes('no existe') || e.message.includes('no cubren')) {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

// ---------- ANULAR VENTA ----------
router.delete('/:id', requirePermission(['sales.manage']), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const sale = await prisma.sale.findUnique({ where: { id }, include: { items: { include: { variant: true } } } });
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
    if (sale.status !== 'vigente') return res.status(400).json({ error: 'Venta ya anulada o devuelta' });

    const result = await prisma.$transaction(async (tx) => {
      // Reintegrar inventario
      for (const item of sale.items) {
        if (item.variant) {
          await tx.productVariant.update({ where: { id: item.variant.id }, data: { stock: item.variant.stock + item.quantity } });
        }
        await tx.inventoryMovement.create({
          data: { userId: req.user.id, productId: item.productId, variantId: item.variantId, type: 'DEVOLUCION', quantity: item.quantity, cost: item.cost, documentRef: sale.number, reason: 'Anulación de venta' },
        });
      }
      return tx.sale.update({ where: { id }, data: { status: 'anulada' } });
    }, { timeout: 20000 });
    await logAudit(req.user.id, 'DELETE/ANULAR', 'sale', id, { number: sale.number });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;