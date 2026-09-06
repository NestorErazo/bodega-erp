import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.use(authRequired);

router.get('/', requirePermission(['users.manage']), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { id: 'asc' },
    });
    res.json(users.map((u) => ({ id: u.id, name: u.name, email: u.email, active: u.active, role: u.role.name })));
  } catch (e) { next(e); }
});

router.get('/roles', requirePermission(['users.manage']), async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({ include: { permissions: true } });
    res.json(roles);
  } catch (e) { next(e); }
});

router.post('/', requirePermission(['users.manage']), async (req, res, next) => {
  try {
    const { name, email, password, roleId, active = true } = req.body;
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(400).json({ error: 'El email ya está registrado' });
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: await bcrypt.hash(password, 10),
        roleId,
        active,
      },
      include: { role: true },
    });
    await logAudit(req.user.id, 'CREATE', 'user', user.id, { name: user.name, email: user.email });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, active: user.active, role: user.role.name });
  } catch (e) { next(e); }
});

router.put('/:id', requirePermission(['users.manage']), async (req, res, next) => {
  try {
    const { name, email, password, roleId, active } = req.body;
    const data = { name, email, roleId, active };
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data, include: { role: true } });
    await logAudit(req.user.id, 'UPDATE', 'user', user.id, { name: user.name, email: user.email });
    res.json({ id: user.id, name: user.name, email: user.email, active: user.active, role: user.role.name });
  } catch (e) { next(e); }
});

export default router;