import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { logAudit } from '../utils/audit.js';

const router = Router();
router.use(authRequired);

// Estado actual de caja
router.get('/state', async (_req, res, next) => {
  try {
    const register = await prisma.cashRegister.findFirst({ where: { status: 'abierta' }, orderBy: { id: 'desc' } });
    if (!register) return res.json({ caja: null, status: 'closed' });

    const movements = await prisma.cashMovement.findMany({ where: { cashRegisterId: register.id } });
    let efectivo = register.openingAmount;
    let otrosMedios = 0;
    for (const m of movements) {
      if (m.method === 'efectivo') efectivo += m.amount;
      else otrosMedios += m.amount;
    }
    const retiros = movements.filter((m) => m.type === 'retiro').reduce((s, m) => s + m.amount, 0);
    res.json({ caja: register, status: 'open', efectivo, otrosMedios, retiros, movimientos: movements });
  } catch (e) { next(e); }
});

// Movimientos de caja (caja abierta por defecto)
router.get('/movements', async (req, res, next) => {
  try {
    const { cashRegisterId, limit = 200 } = req.query;
    const where = {};
    if (cashRegisterId) {
      where.cashRegisterId = Number(cashRegisterId);
    } else {
      const register = await prisma.cashRegister.findFirst({ where: { status: 'abierta' }, orderBy: { id: 'desc' } });
      if (register) where.cashRegisterId = register.id;
    }
    const movements = await prisma.cashMovement.findMany({
      where,
      take: Number(limit),
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true } } },
    });
    res.json(movements.map((m) => ({
      id: m.id,
      hora: m.date,
      tipo: m.type,
      detalle: m.concept,
      medio: m.method,
      valor: m.amount,
      usuario: m.user?.name,
      documentRef: m.documentRef,
    })));
  } catch (e) { next(e); }
});

router.post('/open', requirePermission(['finance.manage']), async (req, res, next) => {
  try {
    const { name = 'Caja principal', openingAmount = 0 } = req.body;
    const register = await prisma.cashRegister.create({
      data: { name, status: 'abierta', openedById: req.user.id, openingAmount: Number(openingAmount) || 0, openedAt: new Date() },
    });
    await prisma.cashMovement.create({
      data: { cashRegisterId: register.id, userId: req.user.id, type: 'apertura', concept: 'Fondo apertura', amount: Number(openingAmount) || 0, method: 'efectivo' },
    });
    await logAudit(req.user.id, 'OPEN', 'cash_register', register.id, { name });
    res.status(201).json(register);
  } catch (e) { next(e); }
});

router.post('/movements', requirePermission(['finance.manage']), async (req, res, next) => {
  try {
    const { type, concept, amount, method = 'efectivo', documentRef } = req.body;
    const register = await prisma.cashRegister.findFirst({ where: { status: 'abierta' } });
    if (!register) return res.status(400).json({ error: 'No hay caja abierta' });
    const m = await prisma.cashMovement.create({
      data: {
        cashRegisterId: register.id, userId: req.user.id, type, concept,
        amount: type === 'egreso' || type === 'retiro' ? -(Number(amount) || 0) : Number(amount) || 0,
        method, documentRef,
      },
    });
    await logAudit(req.user.id, 'MOVEMENT', 'cash', m.id, { type, amount });
    res.status(201).json(m);
  } catch (e) { next(e); }
});

router.post('/close', requirePermission(['finance.manage']), async (req, res, next) => {
  try {
    const { counted } = req.body;
    const register = await prisma.cashRegister.findFirst({ where: { status: 'abierta' } });
    if (!register) return res.status(400).json({ error: 'No hay caja abierta' });

    const movements = await prisma.cashMovement.findMany({ where: { cashRegisterId: register.id } });
    let esperado = register.openingAmount;
    for (const m of movements) if (m.method === 'efectivo') esperado += m.amount;
    const difference = (Number(counted) || 0) - esperado;

    const closed = await prisma.cashRegister.update({
      where: { id: register.id },
      data: { status: 'cerrada', closingAmount: Number(counted) || 0, closedAt: new Date() },
    });
    await logAudit(req.user.id, 'CLOSE', 'cash_register', register.id, { esperado, contado: Number(counted), diferencia: difference });
    res.json({ ...closed, esperado, diferencia });
  } catch (e) { next(e); }
});

export default router;