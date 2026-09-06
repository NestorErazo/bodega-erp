import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { logAudit } from '../utils/audit.js';

const router = Router();
router.use(authRequired);

router.get('/categories', async (_req, res, next) => {
  try { res.json(await prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } })); }
  catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const { categoria, desde, hasta } = req.query;
    const where = {};
    if (categoria) where.category = { name: categoria };
    if (desde || hasta) {
      where.date = {};
      if (desde) where.date.gte = new Date(desde);
      if (hasta) where.date.lte = new Date(hasta + 'T23:59:59');
    }
    const expenses = await prisma.expense.findMany({
      where, orderBy: { date: 'desc' }, take: 500,
      include: { category: true, supplier: { select: { name: true } } },
    });
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({ gastos: expenses.map((e) => ({ ...e, categoria: e.category.name, proveedor: e.supplier?.name || null })), total });
  } catch (e) { next(e); }
});

router.post('/', requirePermission(['finance.manage']), async (req, res, next) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (data.categoryId) data.categoryId = Number(data.categoryId);
    if (data.supplierId) data.supplierId = Number(data.supplierId);
    else delete data.supplierId;
    const e = await prisma.expense.create({ data });
    await logAudit(req.user.id, 'CREATE', 'expense', e.id, { amount: e.amount, category: e.categoryId });
    res.status(201).json(e);
  } catch (err) { next(err); }
});

export default router;