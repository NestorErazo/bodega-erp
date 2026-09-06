import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { logAudit } from '../utils/audit.js';

const router = Router();
router.use(authRequired);

// ---------- CUENTAS POR COBRAR ----------
// Ruta acoplada al frontend (Cartera.jsx): respeta los nombres de campo esperados.
router.get('/accounts-receivable', requirePermission(['finance.view', 'finance.manage']), async (req, res, next) => {
  try {
    const where = { status: { in: ['pendiente', 'parcial'] } };
    const rows = await prisma.accountReceivable.findMany({ where, include: { customer: true }, orderBy: { dueDate: 'asc' } });
    const now = new Date();
    const saleDocs = {};
    if (rows.some((c) => c.saleId)) {
      const sales = await prisma.sale.findMany({ where: { id: { in: rows.map((c) => c.saleId).filter(Boolean) } }, select: { id: true, number: true } });
      for (const s of sales) saleDocs[s.id] = s;
    }
    res.json(rows.map((c) => ({
      id: c.id,
      cliente: c.customer.name,
      documento: (c.saleId && saleDocs[c.saleId]?.number) || '—',
      vencimiento: c.dueDate || c.date,
      valor: c.amount,
      abonado: c.paid,
      saldo: c.amount - c.paid,
      estado: c.status === 'pendiente' ? (c.dueDate && c.dueDate < now ? 'Vencido' : 'Pendiente') : 'Parcial',
    })));
  } catch (e) { next(e); }
});

router.get('/receivables', requirePermission(['finance.view', 'finance.manage']), async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status && status !== 'todos' ? { status } : { status: { in: ['pendiente', 'parcial'] } };
    const rows = await prisma.accountReceivable.findMany({
      where, include: { customer: true, payments: true },
      orderBy: { dueDate: 'asc' },
    });
    const now = new Date();
    const saleDocs = {};
    if (rows.some((c) => c.saleId)) {
      const sales = await prisma.sale.findMany({ where: { id: { in: rows.map((c) => c.saleId).filter(Boolean) } }, select: { id: true, number: true, date: true } });
      for (const s of sales) saleDocs[s.id] = s;
    }
    res.json(rows.map((c) => ({
      id: c.id, cliente: c.customer.name, documento: (c.saleId && saleDocs[c.saleId]?.number) || '—',
      fecha: (c.saleId && saleDocs[c.saleId]?.date) || c.date,
      vence: c.dueDate, diasVencido: Math.max(0, Math.floor((now - c.dueDate) / 86400000)),
      monto: c.amount, abonado: c.paid, saldo: c.amount - c.paid, estado: c.status,
      abonos: c.payments.map((p) => p.amount).reduce((s, a) => s + a, 0),
    })));
  } catch (e) { next(e); }
});

// Abono a cuenta por cobrar
router.post('/receivables/:id/pay', requirePermission(['finance.manage']), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { amount, method = 'efectivo' } = req.body;
    const cxc = await prisma.accountReceivable.findUnique({ where: { id }, include: { customer: true } });
    if (!cxc) return res.status(404).json({ error: 'CxC no encontrada' });
    const amt = Number(amount);
    const newPaid = cxc.paid + amt;
    if (newPaid > cxc.amount + 0.01) return res.status(400).json({ error: 'El abono supera el saldo' });

    await prisma.$transaction(async (tx) => {
      await tx.accountReceivablePayment.create({
        data: { accountId: id, amount: amt, method, date: new Date() },
      });
      await tx.accountReceivable.update({
        where: { id },
        data: { paid: newPaid, status: newPaid >= cxc.amount - 0.01 ? 'pagada' : 'parcial' },
      });
      const register = await tx.cashRegister.findFirst({ where: { status: 'abierta' } });
      if (register) {
        await tx.cashMovement.create({
          data: { cashRegisterId: register.id, userId: req.user.id, type: 'cartera', concept: `Abono CxC de ${cxc.customer.name}`, amount: amt, method },
        });
      }
    }, { timeout: 20000 });
    await logAudit(req.user.id, 'PAY', 'account_receivable', id, { amount: amt });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---------- CUENTAS POR PAGAR ----------
router.get('/payables', requirePermission(['finance.view', 'finance.manage']), async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status && status !== 'todos' ? { status } : { status: { in: ['pendiente', 'parcial'] } };
    const rows = await prisma.accountPayable.findMany({
      where, include: { supplier: true, purchase: { select: { number: true, date: true } } },
      orderBy: { dueDate: 'asc' },
    });
    res.json(rows.map((c) => ({
      id: c.id, proveedor: c.supplier.name, documento: c.purchase?.number || '—', fecha: c.purchase?.date || c.date,
      vence: c.dueDate, monto: c.amount, abonado: c.paid, saldo: c.amount - c.paid, estado: c.status,
    })));
  } catch (e) { next(e); }
});

router.post('/payables/:id/pay', requirePermission(['finance.manage']), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { amount, method = 'efectivo' } = req.body;
    const cxp = await prisma.accountPayable.findUnique({ where: { id }, include: { supplier: true } });
    if (!cxp) return res.status(404).json({ error: 'CxP no encontrada' });
    const amt = Number(amount);
    const newPaid = cxp.paid + amt;
    if (newPaid > cxp.amount + 0.01) return res.status(400).json({ error: 'El abono supera el saldo' });

    await prisma.$transaction(async (tx) => {
      await tx.accountPayablePayment.create({
        data: { accountId: id, amount: amt, method, date: new Date() },
      });
      await tx.accountPayable.update({
        where: { id },
        data: { paid: newPaid, status: newPaid >= cxp.amount - 0.01 ? 'pagada' : 'parcial' },
      });
    }, { timeout: 20000 });
    await logAudit(req.user.id, 'PAY', 'account_payable', id, { amount: amt });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;