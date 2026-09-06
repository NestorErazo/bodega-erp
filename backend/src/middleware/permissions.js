import prisma from '../db.js';

// Middleware para verificar permisos por rol
export function requirePermission(keys) {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { role: { include: { permissions: true } } },
      });
      if (!user) return res.status(401).json({ error: 'Usuario no existe' });
      const userKeys = user.role.permissions.map((p) => p.key);
      const hasPermission = keys.some((k) => userKeys.includes(k));
      if (!hasPermission) return res.status(403).json({ error: 'Permiso denegado' });
      next();
    } catch (e) {
      next(e);
    }
  };
}