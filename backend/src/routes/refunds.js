import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { logAudit } from '../utils/audit.js';

const router = Router();
router.use(authRequired);

function nextNumber(prefix, last) {
  let next = 1001;
  if (last?.number) {
    const n = Number(String(last.number).split('-').pop());
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}-${next}`;
}

// ---------- CREAR DEVOLUCIÓN ----------
// Body: {
//   saleId: number,
//   motivo: string,
//   reingresar: boolean,
//   items: [{ productId?, variantId?, cantidad: number, total?: number }]
// }
router.post('/', requirePermission(['sales.manage']), async (req, res, next) => {
  try {
    const { saleId, motivo = '', reingresar = true, items = [] } = req.body;
    if (!saleId) return res.status(400).json({ error: 'saleId es obligatorio' });
    if (!items.length) return res.status(400).json({ error: 'Debe indicar al menos un ítem a devolver' });

    const sale = await prisma.sale.findUnique({
      where: { id: Number(saleId) },
      include: { items: { include: { product: true, variant: true } }, payments: true, customer: true },
    });
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
    if (sale.status === 'anulada') return res.status(400).json({ error: 'No se puede devolver una venta anulada' });

    const totalQtyRequested = items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0);
    if (totalQtyRequested <= 0) return res.status(400).json({ error: 'La cantidad a devolver debe ser mayor a cero' });

    // Si el front no envía productId/variantId, distribuimos proporcionalmente
    // sobre los ítems de la venta respetando el orden y stock disponible.
    let preparedItems = [];
    if (items.every((i) => !i.productId && !i.variantId)) {
      let remaining = totalQtyRequested;
      for (const si of sale.items) {
        if (remaining <= 0) break;
        const qty = Math.min(remaining, si.quantity);
        preparedItems.push({
          productId: si.productId,
          variantId: si.variantId,
          quantity: qty,
          price: si.price,
          total: qty * si.price,
        });
        remaining -= qty;
      }
      if (remaining > 0) return res.status(400).json({ error: 'La cantidad a devolver excede lo vendido' });
    } else {
      preparedItems = items.map((i) => ({
        productId: Number(i.productId),
        variantId: i.variantId ? Number(i.variantId) : null,
        quantity: Number(i.cantidad) || 0,
        price: Number(i.total) / Number(i.cantidad) || 0,
        total: Number(i.total) || 0,
      }));
    }

    const totalReturn = preparedItems.reduce((s, i) => s + i.total, 0);
    const number = nextNumber('NOT', await prisma.return.findFirst({ orderBy: { id: 'desc' }, select: { number: true } }));

    const result = await prisma.$transaction(async (tx) => {
      const ret = await tx.return.create({
        data: {
          number,
          saleId: sale.id,
          customerId: sale.customerId,
          reason: motivo,
          total: totalReturn,
          status: 'registrada',
          items: {
            create: preparedItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              price: i.price,
              total: i.total,
              backToStock: Boolean(reingresar),
            })),
          },
        },
      });

      // Reingreso a inventario
      if (reingresar) {
        for (const i of preparedItems) {
          if (i.variantId) {
            await tx.productVariant.update({
              where: { id: i.variantId },
              data: { stock: { increment: i.quantity } },
            });
          }
          await tx.inventoryMovement.create({
            data: {
              userId: req.user.id,
              productId: i.productId,
              variantId: i.variantId,
              type: 'DEVOLUCION',
              quantity: i.quantity,
              cost: i.price,
              documentRef: number,
              reason: `Devolución venta ${sale.number}${motivo ? ` - ${motivo}` : ''}`,
            },
          });
        }
      }

      // Ajuste de caja: reintegro en efectivo si hay caja abierta y el pago original fue efectivo
      const effectivePayments = sale.payments.filter((p) => p.method === 'efectivo' && p.cashRegisterId);
      const cashRegister = await tx.cashRegister.findFirst({ where: { status: 'abierta' }, orderBy: { id: 'desc' } });
      if (effectivePayments.length && cashRegister) {
        const refundAmount = Math.min(
          totalReturn,
          effectivePayments.reduce((s, p) => s + p.amount, 0)
        );
        if (refundAmount > 0) {
          await tx.cashMovement.create({
            data: {
              cashRegisterId: cashRegister.id,
              userId: req.user.id,
              type: 'devolucion',
              concept: `Devolución ${number} de ${sale.number}`,
              amount: -refundAmount,
              method: 'efectivo',
              documentRef: number,
            },
          });
        }
      }

      // Ajuste de cuenta por cobrar si la venta tenía crédito
      if (sale.customerId) {
        const receivable = await tx.accountReceivable.findFirst({
          where: { saleId: sale.id, status: { not: 'pagado' } },
        });
        if (receivable) {
          const newPaid = Math.min(receivable.amount, receivable.paid + totalReturn);
          const newStatus = newPaid >= receivable.amount - 0.01 ? 'pagado' : (newPaid > 0 ? 'parcial' : 'pendiente');
          await tx.accountReceivable.update({
            where: { id: receivable.id },
            data: { paid: newPaid, status: newStatus },
          });
        }
      }

      // Actualizar estado de la venta
      const returnedAgg = await tx.returnItem.aggregate({
        where: { return_: { saleId: sale.id }, NOT: { returnId: ret.id } },
        _sum: { quantity: true },
      });
      const totalReturnedSoFar = preparedItems.reduce((s, i) => s + i.quantity, 0) + (returnedAgg._sum.quantity || 0);
      const totalSold = sale.items.reduce((s, i) => s + i.quantity, 0);
      const newStatus = totalReturnedSoFar >= totalSold ? 'devuelta' : 'vigente';
      await tx.sale.update({ where: { id: sale.id }, data: { status: newStatus } });

      return ret;
    }, { timeout: 20000 });

    await logAudit(req.user.id, 'CREATE', 'return', result.id, { number, saleId: sale.id, total: totalReturn });
    res.status(201).json({ id: result.id, number, total: totalReturn });
  } catch (e) {
    if (e.message.includes('excede')) return res.status(400).json({ error: e.message });
    next(e);
  }
});

export default router;
