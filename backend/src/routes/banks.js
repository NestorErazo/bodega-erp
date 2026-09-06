import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';

const router = Router();
router.use(authRequired);

router.get('/', async (_req, res, next) => {
  try {
    const banks = await prisma.bankAccount.findMany({ include: { movements: true } });
    res.json(banks.map((b) => ({
      ...b,
      saldo: b.initialBalance + b.movements.reduce((s, m) => s + m.amount, 0),
      movimientos: b.movements.length,
    })));
  } catch (e) { next(e); }
});

router.post('/', requirePermission(['finance.manage']), async (req, res, next) => {
  try {
    const b = await prisma.bankAccount.create({ data: { ...req.body } });
    res.status(201).json(b);
  } catch (e) { next(e); }
});

router.get('/movements', async (_req, res, next) => {
  try {
    const movements = await prisma.bankMovement.findMany({
      orderBy: { date: 'desc' }, take: 200,
      include: { bankAccount: { select: { bank: true } } },
    });
    res.json(movements.map((m) => ({ ...m, banco: m.bankAccount.bank })));
  } catch (e) { next(e); }
});

router.post('/movements', requirePermission(['finance.manage']), async (req, res, next) => {
  try {
    const { bankAccountId, type, concept, amount, documentRef } = req.body;
    const signed = Number(amount) * (type === 'egreso' || type === 'transferencia' || type === 'pago' ? -1 : 1);
    const m = await prisma.bankMovement.create({
      data: { bankAccountId: Number(bankAccountId), type, concept, amount: signed, documentRef, userId: req.user.id },
    });
    res.status(201).json(m);
  } catch (e) { next(e); }
});

export default router;