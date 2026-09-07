// Inicialización segura para producción.
// Crea solo lo esencial (roles, usuario admin, vendedor demo, empresa)
// si no existen. NO borra datos. Se puede ejecutar en cada deploy.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = {
  admin: ['dashboard.view', 'products.manage', 'inventory.manage', 'users.manage', 'roles.manage', 'reports.view', 'settings.manage', 'audit.view', 'finance.manage', 'sales.manage', 'purchases.manage'],
  gerente: ['dashboard.view', 'products.view', 'inventory.manage', 'reports.view', 'finance.view', 'purchases.view', 'sales.view'],
  vendedor: ['dashboard.view', 'products.view', 'pos.sell', 'customers.view', 'sales.view'],
  bodega: ['inventory.manage', 'products.view', 'purchases.view'],
  contabilidad: ['finance.view', 'reports.view', 'expenses.manage', 'accounts.view'],
};

async function main() {
  console.log('[init-prod] Verificando datos esenciales...');

  // Verificar si ya existe usuario admin
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@bodega.com' } });
  if (existingAdmin) {
    console.log('[init-prod] Usuario admin ya existe. No se hace nada.');
    return;
  }

  console.log('[init-prod] Creando datos esenciales...');

  // Empresa
  const companyCount = await prisma.company.count();
  let company;
  if (companyCount === 0) {
    company = await prisma.company.create({
      data: { name: 'Bodega de Ropa SAS', nit: '901.234.567-1', address: 'Cl 5 #4-23, Centro', city: 'Cali', phone: '+57 300 111 2233', email: 'contacto@bodega.com', currency: 'COP' },
    });
  } else {
    company = await prisma.company.findFirst();
  }

  // Roles y permisos
  const roles = {};
  for (const [roleName, perms] of Object.entries(PERMISSIONS)) {
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await prisma.role.create({
        data: { name: roleName, description: `${roleName} del sistema`, permissions: { create: perms.map((key) => ({ key, name: key })) } },
      });
    }
    roles[roleName] = role;
  }

  // Usuarios
  await prisma.user.create({
    data: {
      name: 'Administrador', email: 'admin@bodega.com', password: await bcrypt.hash('admin123', 10),
      roleId: roles.admin.id, companyId: company.id,
    },
  });
  await prisma.user.create({
    data: {
      name: 'Vendedor Demo', email: 'vendedor@bodega.com', password: await bcrypt.hash('demo123', 10),
      roleId: roles.vendedor.id, companyId: company.id,
    },
  });

  // Configuración inicial
  const settings = [
    { key: 'company.name', value: 'Bodega de Ropa SAS' },
    { key: 'company.nit', value: '901.234.567-1' },
    { key: 'currency', value: 'COP' },
    { key: 'iva', value: '19' },
    { key: 'document.factura', value: 'FAC-1001' },
  ];
  for (const s of settings) {
    const exists = await prisma.setting.findUnique({ where: { key: s.key } });
    if (!exists) await prisma.setting.create({ data: { ...s, companyId: company.id } });
  }

  console.log('[init-prod] Datos esenciales creados.');
  console.log('[init-prod] Login: admin@bodega.com / admin123');
}

main()
  .catch((e) => {
    console.error('[init-prod] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
