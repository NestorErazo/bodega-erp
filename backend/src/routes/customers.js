import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    const where = q ? { OR: [{ name: { contains: q } }, { document: { contains: q } }, { phone: { contains: q } }] } : {};
    const customers = await prisma.customer.findMany({ where, orderBy: { name: 'asc' }, include: { _count: { select: { sales: true } } } });
    const withStats = await Promise.all(customers.map(async (c) => {
      const agg = await prisma.sale.aggregate({ where: { customerId: c.id, status: 'vigente' }, _sum: { total: true }, _count: true, _max: { date: true } });
      const cxc = await prisma.accountReceivable.aggregate({ where: { customerId: c.id, status: { in: ['pendiente', 'parcial'] } }, _sum: { amount: true, paid: true } });
      return {
        id: c.id, name: c.name, document: c.document, phone: c.phone, whatsapp: c.whatsapp, email: c.email,
        city: c.city, vip: c.vip, active: c.active,
        compras: agg._count, total: agg._sum.total || 0, ultima: agg._max.date,
        deuda: (cxc._sum.amount || 0) - (cxc._sum.paid || 0),
      };
    }));
    res.json(withStats);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const c = await prisma.customer.create({ data: { ...req.body } });
    await logAudit(req.user.id, 'CREATE', 'customer', c.id, { name: c.name });
    res.status(201).json(c);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const c = await prisma.customer.update({ where: { id: Number(req.params.id) }, data: { ...req.body } });
    await logAudit(req.user.id, 'UPDATE', 'customer', c.id, { name: c.name });
    res.json(c);
  } catch (e) { next(e); }
});

export default router;