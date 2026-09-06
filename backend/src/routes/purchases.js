import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { logAudit } from '../utils/audit.js';

const router = Router();
router.use(authRequired);

export const purchaseInclude = {
  supplier: true,
  items: { include: { product: { select: { name: true, reference: true } }, variant: { include: { size: true, color: true } } } },
  user: { select: { name: true } },
};

// Transacción de compra: aumenta inventario, actualiza costo promedio,
// genera cuenta por pagar (crédito) o movimiento financiero (contado).
export async function executePurchase(tx, req, data) {
  const { supplierId, items, paymentType = 'contado', discount = 0, tax = 0, freight = 0 } = data;
  let subtotal = 0;
  const prepared = [];

  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: Number(item.productId) } });
    if (!product) throw new Error(`Producto ${item.productId} no existe`);
    const variant = item.variantId
      ? await tx.productVariant.findUnique({ where: { id: Number(item.variantId) } })
      : await tx.productVariant.findFirst({ where: { productId: product.id } });

    const qty = Number(item.quantity) || 0;
    const cost = Number(item.cost) || 0;
    const lineTotal = qty * cost;
    subtotal += lineTotal;
    prepared.push({ product, variant, qty, cost, lineTotal });
  }

  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0) + (Number(freight) || 0));

  // Numeración de orden de compra
  const lastPurchase = await tx.purchase.findFirst({ orderBy: { id: 'desc' } });
  const nextNum = lastPurchase ? Number(lastPurchase.number.split('-').pop()) + 1 : 1;
  const number = `OC-${String(nextNum).padStart(3, '0')}`;

  const purchase = await tx.purchase.create({
    data: {
      number, supplierId: Number(supplierId), userId: req.user.id, paymentType,
      status: paymentType === 'credito' ? 'recibida' : 'pagada',
      subtotal, discount: Number(discount) || 0, tax: Number(tax) || 0, freight: Number(freight) || 0, total,
      items: {
        create: prepared.map((p) => ({
          productId: p.product.id, variantId: p.variant?.id || null, quantity: p.qty, cost: p.cost, taxRate: 0, total: p.lineTotal,
        })),
      },
    },
  });

  // Aumentar inventario + actualizar costo promedio (ponderado) + kardex
  for (const p of prepared) {
    if (p.variant) {
      const newStock = p.variant.stock + p.qty;
      const oldValue = p.variant.stock * p.variant.cost;
      const newCost = newStock > 0 ? (oldValue + p.lineTotal) / newStock : p.cost;
      await tx.productVariant.update({ where: { id: p.variant.id }, data: { stock: newStock, cost: newCost } });
      await tx.product.update({ where: { id: p.product.id }, data: { avgCost: newCost, purchasePrice: p.cost } });
      await tx.inventoryMovement.create({
        data: { userId: req.user.id, productId: p.product.id, variantId: p.variant.id, type: 'ENTRADA', quantity: p.qty, cost: p.cost, documentRef: number, reason: 'Compra a proveedor' },
      });
    } else {
      await tx.inventoryMovement.create({
        data: { userId: req.user.id, productId: p.product.id, type: 'ENTRADA', quantity: p.qty, cost: p.cost, documentRef: number, reason: 'Compra a proveedor' },
      });
    }
  }

  // Cuenta por pagar si es crédito
  if (paymentType === 'credito') {
    const supplier = await tx.supplier.findUnique({ where: { id: Number(supplierId) } });
    const due = new Date(); due.setDate(due.getDate() + (supplier?.creditDays || 30));
    await tx.accountPayable.create({
      data: { supplierId: Number(supplierId), purchaseId: purchase.id, dueDate: due, amount: total, paid: 0, status: 'pendiente' },
    });
  }

  await logAudit(req.user.id, 'CREATE', 'purchase', purchase.id, { number, total });
  return purchase;
}

router.get('/', requirePermission(['purchases.view', 'purchases.manage']), async (req, res, next) => {
  try {
    const { q, limit = 100 } = req.query;
    const where = q ? { OR: [{ number: { contains: q } }, { supplier: { name: { contains: q } } }] } : {};
    const purchases = await prisma.purchase.findMany({ where, take: Number(limit), orderBy: { date: 'desc' }, include: purchaseInclude });
    res.json(purchases.map((p) => ({
      id: p.id, numero: p.number, proveedor: p.supplier.name, fecha: p.date, estado: p.status,
      items: p.items.map((i) => `${i.product.name} ×${i.quantity}`).join(' · '),
      total: p.total,
    })));
  } catch (e) { next(e); }
});

router.post('/', requirePermission(['purchases.manage']), async (req, res, next) => {
  try {
    const purchase = await prisma.$transaction((tx) => executePurchase(tx, req, req.body));
    const full = await prisma.purchase.findUnique({ where: { id: purchase.id }, include: purchaseInclude });
    res.status(201).json(full);
  } catch (e) {
    if (e.message.includes('no existe')) return res.status(400).json({ error: e.message });
    next(e);
  }
});

router.put('/:id/status', requirePermission(['purchases.manage']), async (req, res, next) => {
  try {
    const p = await prisma.purchase.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status } });
    await logAudit(req.user.id, 'UPDATE', 'purchase', p.id, { status: req.body.status });
    res.json(p);
  } catch (e) { next(e); }
});

export default router;