import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';

const router = Router();

router.use(authRequired);

router.get('/', requirePermission(['audit.view']), async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const logs = await prisma.auditLog.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json(logs);
  } catch (e) { next(e); }
});

export default router;