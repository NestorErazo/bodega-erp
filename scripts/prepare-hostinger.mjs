// Prepara el proyecto para desplegar en Hostinger con MySQL.
// Uso: node scripts/prepare-hostinger.mjs
//
// Este script:
// 1. Cambia el provider de Prisma de sqlite a mysql.
// 2. Elimina las migraciones de SQLite.
// 3. Genera el SQL inicial (init.sql) para crear las tablas en MySQL.
// 4. Genera el cliente Prisma para MySQL.
// 5. Construye el frontend.
//
// IMPORTANTE: no ejecutes este script en tu entorno de desarrollo si quieres
// seguir usando SQLite. Úsalo justo antes de subir a Hostinger, o en una
// rama/clone separado de producción.

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const BACKEND_DIR = path.join(ROOT, 'backend');
const PRISMA_DIR = path.join(BACKEND_DIR, 'prisma');
const SCHEMA_FILE = path.join(PRISMA_DIR, 'schema.prisma');
const MIGRATIONS_DIR = path.join(PRISMA_DIR, 'migrations');
const INIT_SQL = path.join(PRISMA_DIR, 'init.sql');

function run(cmd, cwd = ROOT) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

async function main() {
  console.log('=== Preparando proyecto para Hostinger (MySQL) ===\n');

  // 1. Verificar que existe schema.prisma
  let schema;
  try {
    schema = await fs.readFile(SCHEMA_FILE, 'utf8');
  } catch {
    console.error(`No se encontró ${SCHEMA_FILE}`);
    process.exit(1);
  }

  // 2. Cambiar provider a mysql
  if (!schema.includes('provider = "sqlite"')) {
    console.log('El provider ya no es sqlite. Se asume que está preparado para MySQL.');
  } else {
    schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "mysql"');
    await fs.writeFile(SCHEMA_FILE, schema);
    console.log('✅ Provider cambiado a mysql en schema.prisma');
  }

  // 3. Eliminar migraciones SQLite
  try {
    await fs.rm(MIGRATIONS_DIR, { recursive: true, force: true });
    console.log('✅ Migraciones SQLite eliminadas');
  } catch {
    console.log('ℹ️ No había migraciones que eliminar');
  }

  // 4. Generar SQL inicial para MySQL
  try {
    run('npx prisma migrate diff --from-empty --to-schema-datamodel schema.prisma --script > init.sql', PRISMA_DIR);
    console.log('✅ Archivo init.sql generado en backend/prisma/init.sql');
  } catch {
    console.warn('⚠️ No se pudo generar init.sql automáticamente. Se generará manualmente en Hostinger.');
  }

  // 5. Generar cliente Prisma para MySQL
  run('npm install', BACKEND_DIR);
  run('npx prisma generate', BACKEND_DIR);
  console.log('✅ Cliente Prisma generado para MySQL');

  // 6. Construir frontend
  run('npm install', path.join(ROOT, 'frontend'));
  run('npm run build', path.join(ROOT, 'frontend'));
  console.log('✅ Frontend construido en frontend/dist');

  console.log('\n=== Preparación completada ===');
  console.log('\nSiguientes pasos:');
  console.log('1. Crea una base de datos MySQL en Hostinger (phpMyAdmin).');
  console.log('2. Ejecuta backend/prisma/init.sql en phpMyAdmin para crear las tablas.');
  console.log('3. Sube la carpeta backend/ (sin node_modules) y frontend/dist/ a Hostinger.');
  console.log('4. En Hostinger instala dependencias: cd backend && npm install --production');
  console.log('5. Configura variables de entorno (DATABASE_URL, JWT_SECRET, NODE_ENV, FRONTEND_URL).');
  console.log('6. Configura la aplicación Node.js en hPanel para ejecutar: node src/server.js');
  console.log('\nRecuerda NO subir backend/.env ni backend/prisma/dev.db.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
