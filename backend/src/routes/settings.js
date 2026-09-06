import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const obj = {};
    for (const s of settings) obj[s.key] = s.value;
    res.json(obj);
  } catch (e) { next(e); }
});

router.put('/', requirePermission(['settings.manage']), async (req, res, next) => {
  try {
    const entries = req.body; // { key: value, ... }
    for (const [key, value] of Object.entries(entries)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    await logAudit(req.user.id, 'UPDATE', 'settings', null, entries);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;