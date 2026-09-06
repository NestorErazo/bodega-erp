import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = Router();
router.use(authRequired);

router.get('/', async (_req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    const withStats = await Promise.all(suppliers.map(async (s) => {
      const [purchases, cxp] = await Promise.all([
        prisma.purchase.count({ where: { supplierId: s.id, status: { not: 'anulada' } } }),
        prisma.accountPayable.aggregate({ where: { supplierId: s.id, status: { in: ['pendiente', 'parcial'] } }, _sum: { amount: true, paid: true } }),
      ]);
      return { ...s, compras: purchases, deuda: (cxp._sum.amount || 0) - (cxp._sum.paid || 0) };
    }));
    res.json(withStats);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const s = await prisma.supplier.create({ data: { ...req.body } });
    await logAudit(req.user.id, 'CREATE', 'supplier', s.id, { name: s.name });
    res.status(201).json(s);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const s = await prisma.supplier.update({ where: { id: Number(req.params.id) }, data: { ...req.body } });
    await logAudit(req.user.id, 'UPDATE', 'supplier', s.id, { name: s.name });
    res.json(s);
  } catch (e) { next(e); }
});

export default router;