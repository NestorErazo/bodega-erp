import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { signToken, authRequired } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!user.active) return res.status(403).json({ error: 'Usuario inactivo' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken(user);
    await logAudit(user.id, 'LOGIN', 'user', user.id, { email: user.email });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
    });
  } catch (e) { next(e); }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: { include: { permissions: true } } },
    });
    if (!user) return res.status(404).json({ error: 'No encontrado' });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions.map((p) => p.key),
    });
  } catch (e) { next(e); }
});

export default router;