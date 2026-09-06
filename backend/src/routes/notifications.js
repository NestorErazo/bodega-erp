import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

const DEFAULT_TYPES = ['inventario_bajo', 'cartera_vencida', 'checkout_recordatorio'];

async function ensureDefaults() {
  const settings = await prisma.setting.findMany({ where: { key: { startsWith: 'notif.' } } });
  if (settings.length === 0) {
    await prisma.setting.createMany({ data: DEFAULT_TYPES.map((k) => ({ key: `notif.${k}`, value: 'true' })) });
  }
}

router.get('/', async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const notifications = await prisma.notification.findMany({ where, orderBy: { date: 'desc' }, take: 50 });
    const unread = notifications.filter((n) => !n.read).length;
    const result = notifications.map((n) => ({ id: n.id, type: n.type, title: n.type.replace(/_/g, ' '), message: n.message, leida: n.read, read: n.read, fecha: n.date, date: n.date }));
    res.json({ notifications: result, unread });
  } catch (e) { next(e); }
});

router.post('/ensure', async (req, res, next) => {
  try { await ensureDefaults(); res.json({ ok: true }); }
  catch (e) { next(e); }
});

// Generar notificaciones actuales según preferencias
router.post('/generate', async (req, res, next) => {
  try {
    await ensureDefaults();
    const settings = await prisma.setting.findMany({ where: { key: { startsWith: 'notif.' } } });
    const enabled = new Set(settings.filter((s) => s.value === 'true').map((s) => s.key.replace('notif.', '')));
    const now = new Date();
    const notifications = [];

    if (enabled.has('inventario_bajo')) {
      const low = await prisma.product.findMany({ where: { stockMin: { gt: 0 } }, include: { variants: true } });
      for (const p of low) {
        const stock = p.variants.reduce((s, v) => s + v.stock, 0);
        if (stock <= p.stockMin) {
          notifications.push({ type: 'inventario_bajo', message: `Stock bajo: ${p.name} tiene solo ${stock} unidades (mínimo ${p.stockMin})` });
        }
      }
    }
    if (enabled.has('cartera_vencida')) {
      const overdue = await prisma.accountReceivable.findMany({ where: { status: 'pendiente', dueDate: { lt: now } }, include: { customer: true } });
      for (const c of overdue) {
        const dias = Math.floor((now - c.dueDate) / 86400000);
        notifications.push({ type: 'cartera_vencida', message: `${c.customer.name} adeuda $${(c.amount - c.paid).toLocaleString()} con ${dias} días de mora` });
      }
    }

    let created = 0;
    for (const n of notifications) {
      const exists = await prisma.notification.findFirst({
        where: { type: n.type, message: n.message, date: { gte: new Date(now.getTime() - 86400000) } },
      });
      if (!exists) {
        await prisma.notification.create({ data: { type: n.type, message: n.message } });
        created++;
      }
    }
    res.json({ created, total: notifications.length });
  } catch (e) { next(e); }
});

router.post('/read', async (req, res, next) => {
  try {
    const { ids } = req.body;
    const where = { ...(ids && ids.length ? { id: { in: ids.map(Number) } } : {}), ...(req.user.role !== 'admin' ? { userId: req.user.id } : {}) };
    await prisma.notification.updateMany({ where, data: { read: true } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;