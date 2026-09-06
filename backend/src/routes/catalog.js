import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

// Listados para formularios y filtros
async function getAll(path, model, orderField = 'name') {
  return prisma[model].findMany({ orderBy: { [orderField]: 'asc' } });
}

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { subcategories: { orderBy: { name: 'asc' } } },
    });
    res.json(categories);
  } catch (e) { next(e); }
});

router.get('/subcategories', async (_req, res, next) => {
  try { res.json(await getAll(null, 'subcategory')); }
  catch (e) { next(e); }
});

router.get('/brands', async (_req, res, next) => {
  try { res.json(await getAll(null, 'brand')); }
  catch (e) { next(e); }
});

router.get('/sizes', async (_req, res, next) => {
  try { res.json(await getAll(null, 'size')); }
  catch (e) { next(e); }
});

router.get('/colors', async (_req, res, next) => {
  try { res.json(await getAll(null, 'color')); }
  catch (e) { next(e); }
});

router.get('/clients', async (_req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, document: true, phone: true, vip: true } });
    res.json(customers.map((c) => ({ id: c.id, name: c.name, nombre: c.name, documento: c.document, telefono: c.phone, vip: c.vip })));
  } catch (e) { next(e); }
});

router.get('/suppliers', async (_req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, nit: true, phone: true } });
    res.json(suppliers);
  } catch (e) { next(e); }
});

export default router;