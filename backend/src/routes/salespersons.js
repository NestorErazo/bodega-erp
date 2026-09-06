import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';

const router = Router();
router.use(authRequired);

// Lista de vendedores (usuarios con rol de ventas) enriquecida con
// datos de empleado (comisión, documento) y ventas del mes.
router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { OR: [{ role: { name: 'vendedor' } }, { role: { name: 'admin' } }] },
      include: { role: { select: { name: true } } },
    });
    const employees = await prisma.employee.findMany({ where: { active: true } });

    const monthStart = new Date(); monthStart.setHours(0, 0, 0, 0); monthStart.setDate(1);
    const monthEnd = new Date(); monthEnd.setHours(23, 59, 59, 999);
    const sales = await prisma.sale.findMany({
      where: { status: 'vigente', date: { gte: monthStart, lte: monthEnd } },
      select: { userId: true, total: true },
    });
    const salesById = {};
    for (const s of sales) {
      if (!salesById[s.userId]) salesById[s.userId] = { total: 0, count: 0 };
      salesById[s.userId].total += s.total;
      salesById[s.userId].count += 1;
    }

    res.json(users.map((u) => {
      const emp = employees.find((e) => e.name.toLowerCase() === u.name.toLowerCase());
      const ventasMes = salesById[u.id]?.total || 0;
      const comision = emp?.commission || 0;
      return {
        id: u.id,
        nombre: u.name,
        documento: emp?.document || u.email,
        telefono: u.phone || emp?.phone || '—',
        comision,
        ventasMes,
        tickets: salesById[u.id]?.count || 0,
        comisionGenerada: (ventasMes * comision) / 100,
        promedio: salesById[u.id]?.count ? Math.round(ventasMes / salesById[u.id].count) : 0,
        estado: u.active ? 'Activo' : 'Inactivo',
      };
    }));
  } catch (e) { next(e); }
});

// Resumen de ventas por vendedor en un periodo
router.get('/performance', async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const where = { status: 'vigente' };
    if (desde || hasta) {
      where.date = {};
      if (desde) where.date.gte = new Date(desde);
      if (hasta) where.date.lte = new Date(hasta + 'T23:59:59');
    }
    const sales = await prisma.sale.findMany({ where, include: { user: { select: { name: true } }, items: true, payments: true } });
    const map = {};
    for (const s of sales) {
      const name = s.user?.name || 'Sin vendedor';
      if (!map[name]) map[name] = { nombre: name, ventas: 0, tickets: 0, unidades: 0, efectivo: 0, promedio: 0 };
      map[name].ventas += s.total;
      map[name].tickets += 1;
      map[name].unidades += s.items.reduce((x, i) => x + i.quantity, 0);
      map[name].efectivo += s.payments.filter((p) => p.method === 'efectivo').reduce((x, p) => x + p.amount, 0);
    }
    for (const v of Object.values(map)) v.promedio = v.tickets ? Math.round(v.ventas / v.tickets) : 0;
    res.json(Object.values(map).sort((a, b) => b.ventas - a.ventas));
  } catch (e) { next(e); }
});

// Metas del mes por vendedor
router.get('/goals', async (_req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [employees, goals, users, sales] = await Promise.all([
      prisma.employee.findMany(),
      prisma.salesGoal.findMany({ where: { period: 'mensual', startDate: { gte: monthStart, lt: monthEnd } } }),
      prisma.user.findMany({ where: { role: { name: 'vendedor' }, active: true } }),
      prisma.sale.findMany({ where: { status: 'vigente', date: { gte: monthStart, lt: monthEnd } }, select: { userId: true, total: true } }),
    ]);

    const achieved = {};
    for (const s of sales) achieved[s.userId] = (achieved[s.userId] || 0) + s.total;
    const globalGoal = goals.filter((g) => g.employeeId == null).reduce((s, g) => s + g.amount, 0);

    const today = now.getDate();
    const daysInMonth = monthEnd.getDate();

    const rows = users.map((u) => {
      const emp = employees.find((e) => e.name.toLowerCase() === u.name.toLowerCase());
      const goal = goals.find((g) => g.employeeId === emp?.id);
      const meta = goal?.amount ?? globalGoal ?? 0;
      const logrado = achieved[u.id] || 0;
      const esperado = (meta / daysInMonth) * today;
      return {
        vendedor: u.name, meta, logrado,
        avance: meta > 0 ? (logrado / meta) * 100 : 0,
        esperado, ritmo: esperado > 0 ? (logrado / esperado) * 100 : 0,
        pendiente: Math.max(0, meta - logrado),
        faltantesDias: daysInMonth - today,
      };
    });
    res.json(rows);
  } catch (e) { next(e); }
});

// Alta de vendedor: crea el empleado y el usuario con rol vendedor
router.post('/', requirePermission(['sales.manage']), async (req, res, next) => {
  try {
    const { nombre, documento, telefono, comision = 0, email, password } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const role = await prisma.role.findUnique({ where: { name: 'vendedor' } });
    if (!role) return res.status(500).json({ error: 'Rol vendedor no encontrado' });

    const slug = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
    const userEmail = email || `${slug}.${Date.now()}@bodega.local`;
    const userPassword = password || 'demo123';

    const employee = await prisma.employee.create({
      data: { name: nombre, document: documento || '', phone: telefono || '', commission: Number(comision) || 0 },
    });

    const user = await prisma.user.create({
      data: {
        name: nombre,
        email: userEmail,
        password: await bcrypt.hash(userPassword, 10),
        roleId: role.id,
      },
    });

    res.status(201).json({
      id: user.id,
      nombre: user.name,
      documento: employee.document,
      telefono: employee.phone,
      comision: employee.commission,
      ventasMes: 0,
      comisionGenerada: 0,
      estado: 'Activo',
    });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'El correo o documento ya existe' });
    next(e);
  }
});

router.post('/goals', requirePermission(['sales.manage']), async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { employeeId = null, amount } = req.body;
    let existing = await prisma.salesGoal.findFirst({
      where: { period: 'mensual', startDate: monthStart, employeeId: employeeId ? Number(employeeId) : null },
    });
    if (existing) {
      existing = await prisma.salesGoal.update({ where: { id: existing.id }, data: { amount: Number(amount) } });
    } else {
      existing = await prisma.salesGoal.create({
        data: { period: 'mensual', amount: Number(amount), startDate: monthStart, endDate: monthEnd, employeeId: employeeId ? Number(employeeId) : null },
      });
    }
    res.json(existing);
  } catch (e) { next(e); }
});

export default router;