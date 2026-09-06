# Guía de despliegue a producción — Bodega de Ropa ERP/POS

Esta guía explica cómo llevar el proyecto desde el entorno local a un servidor de producción accesible por Internet.

---

## 1. Consideraciones previas

### Base de datos

El proyecto usa **SQLite** en desarrollo (`DATABASE_URL="file:./dev.db"`). En producción se recomienda migrar a **PostgreSQL** o **MySQL** porque:

- SQLite no funciona bien con múltiples instancias/replicas del backend.
- Los servicios de hosting efímeros (Railway, Render) reinician contenedores y perderían la base SQLite.
- PostgreSQL/MySQL ofrecen backups, concurrencia y mejor rendimiento.

### Opciones de despliegue

| Opción | Backend | Frontend | Base de datos | Dificultad | Costo aprox. |
|--------|---------|----------|---------------|------------|--------------|
| **A — Todo en un servidor** | VPS / Railway / Render | Servido por el mismo backend | PostgreSQL | Media | $5–15/mes |
| **B — Separado** | Railway / Render / Fly.io | Vercel / Netlify | PostgreSQL | Media | Free tier posible |
| **C — Hosting tradicional** | Servidor compartido con Node.js | Servidor compartido o mismo backend | MySQL/PostgreSQL | Media-Alta | Variable |

**Recomendación para empezar:** Opción A en **Railway** o **Render** con PostgreSQL, porque es la más sencilla de mantener.

---

## 2. Recomendación principal: Railway + PostgreSQL

Railway ofrece despliegue automático desde GitHub y base de datos PostgreSQL gestionada.

### 2.1 Preparar el repositorio

1. Sube el proyecto a un repositorio de GitHub/GitLab/Bitbucket.
2. Asegúrate de que no esté en `.gitignore` de forma accidental:
   - `backend/prisma/schema.prisma`
   - `backend/prisma/migrations/`
   - `backend/package.json`
   - `frontend/package.json`
3. **No subas** `backend/prisma/dev.db` ni `backend/.env` al repositorio. Railway generará la base de datos y las variables de entorno por separado.

### 2.2 Crear la base de datos PostgreSQL

1. En Railway crea un nuevo proyecto.
2. Agrega un servicio **PostgreSQL**.
3. Una vez creada, copia la variable `DATABASE_URL` (por ejemplo: `postgresql://user:pass@host:5432/dbname`).

### 2.3 Desplegar el backend

1. En Railway agrega un servicio **New > GitHub Repo** y selecciona tu repositorio.
2. Configura el **Root Directory** como `backend`.
3. En **Variables** agrega:

| Variable | Valor de ejemplo | Descripción |
|----------|------------------|-------------|
| `DATABASE_URL` | `postgresql://...` | URL de PostgreSQL |
| `JWT_SECRET` | `un-secreto-muy-largo-y-aleatorio-minimo-64-caracteres` | Clave para firmar tokens |
| `PORT` | `4000` | Puerto interno (Railway lo expone automáticamente) |
| `NODE_ENV` | `production` | Modo producción |
| `FRONTEND_URL` | `https://tu-app.vercel.app` | Dominio del frontend (para CORS) |

4. En **Settings > Build Command** usa:

```bash
npx prisma generate && npx prisma migrate deploy
```

5. En **Settings > Start Command** usa:

```bash
node src/server.js
```

6. Railway generará una URL pública como `https://backend-production-xxx.up.railway.app`.

### 2.4 Sembrar datos iniciales (solo la primera vez)

En Railway ve a la pestaña **Shell** del servicio backend y ejecuta:

```bash
node prisma/seed.js
```

> Esto creará la empresa, roles, usuario admin y datos demo. Si no quieres datos demo, modifica `seed.js` para que solo cree lo esencial.

### 2.5 Desplegar el frontend

#### Opción A: mismo dominio que el backend (más simple)

Si prefieres que el backend sirva el frontend:

1. En tu máquina local construye el frontend:

```bash
cd frontend
npm run build
```

2. Copia la carpeta `frontend/dist` dentro de `backend/dist`.
3. Sube esos cambios al repositorio.
4. Asegúrate de que `backend/src/server.js` sirva archivos estáticos (ver sección 5).
5. Con esto todo queda en `https://backend-production-xxx.up.railway.app`.

#### Opción B: frontend en Vercel (separado)

1. Sube el repositorio a GitHub.
2. En Vercel crea un nuevo proyecto importando el repositorio.
3. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. En **Environment Variables** agrega:
   - `VITE_API_URL=https://backend-production-xxx.up.railway.app/api`
5. Vercel generará una URL como `https://tu-app.vercel.app`.
6. Actualiza `FRONTEND_URL` en Railway con la URL de Vercel.

---

## 3. Despliegue en Render (alternativa)

Render también tiene free tier limitado.

### Backend (Web Service)

1. Crea un **Web Service** conectado a tu repositorio.
2. Configura:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `node src/server.js`
3. Agrega variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `FRONTEND_URL`.
4. Crea un **PostgreSQL** en Render y conecta la `DATABASE_URL`.

### Frontend en Render Static Site

1. Crea un **Static Site**.
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Publish Directory**: `dist`
5. Agrega variable `VITE_API_URL` apuntando al backend.

---

## 4. Despliegue en VPS propio (más control)

Si tienes un servidor VPS con Ubuntu:

```bash
# 1. Conectarte al servidor
ssh usuario@tu-servidor.com

# 2. Instalar dependencias
sudo apt update
sudo apt install -y nodejs npm postgresql nginx git

# 3. Clonar el repositorio
git clone https://github.com/tu-usuario/bodega.git
cd bodega

# 4. Instalar dependencias
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..

# 5. Configurar PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE bodega;"
sudo -u postgres psql -c "CREATE USER bodega WITH PASSWORD 'tu-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bodega TO bodega;"

# 6. Configurar variables de entorno
cp backend/.env.example backend/.env
nano backend/.env
# Editar DATABASE_URL, JWT_SECRET, PORT, FRONTEND_URL

# 7. Aplicar migraciones y seed
cd backend
npx prisma migrate deploy
npx prisma generate
node prisma/seed.js

# 8. Servir frontend desde el backend (ver sección 5)
# O copiar dist a /var/www/html y usar Nginx

# 9. Ejecutar backend con PM2
npm install -g pm2
pm2 start src/server.js --name bodega-backend
pm2 save
pm2 startup
```

### Configuración Nginx (si frontend y backend están separados)

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        root /var/www/bodega/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Configurar el backend para servir el frontend

Si decides desplegar todo junto, actualiza `backend/src/server.js` para servir la carpeta `dist` del frontend en producción:

```js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Antes de los manejadores de errores
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}
```

> Nota: ajusta la ruta relativa según dónde copies `frontend/dist`.

---

## 6. Configurar CORS para producción

Actualmente el backend permite cualquier origen (`app.use(cors())`). En producción restríngelo:

```js
import cors from 'cors';

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
```

Actualiza `FRONTEND_URL` en las variables de entorno.

---

## 7. Variables de entorno de producción

### Backend (`.env`)

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="tu-clave-super-segura-de-al-menos-64-caracteres-aleatorios"
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://tu-app.com
```

### Frontend (`.env.production`)

```env
VITE_API_URL=https://tu-backend.com/api
```

> Vite usa `import.meta.env.VITE_API_URL`. Actualiza `frontend/src/api.js` si aún no lo usa.

---

## 8. Migrar datos de SQLite a PostgreSQL/MySQL

Si ya tienes datos locales que quieres conservar:

### Opción 1: exportar e importar con scripts

1. Crea un script Node.js que lea de SQLite y escriba en PostgreSQL usando Prisma.
2. Ejecuta el script contra la base de datos de producción.

### Opción 2: usar pgloader (SQLite → PostgreSQL)

```bash
pgloader sqlite://backend/prisma/dev.db postgresql://user:pass@host/dbname
```

> Luego ejecuta `npx prisma migrate deploy` para asegurar que el schema esté al día.

### Opción 3: empezar desde cero

Ejecuta `node prisma/seed.js` en producción para datos iniciales.

---

## 9. Dominio personalizado y SSL

### Railway

1. En el servicio backend ve a **Settings > Domains**.
2. Agrega tu dominio y sigue las instrucciones de DNS.
3. Railway proporciona SSL automático.

### Render

1. En el servicio web ve a **Settings > Custom Domains**.
2. Agrega tu dominio y configura los registros DNS indicados.
3. Render gestiona SSL automáticamente.

### VPS con Nginx + Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## 10. Verificación final

Antes de entregar el sistema:

1. Accede al frontend y prueba login con las credenciales de admin.
2. Crea una venta en POS.
3. Verifica que el stock se descuenta y el kardex se actualiza.
4. Abre y cierra caja.
5. Revisa que los reportes carguen datos reales.
6. Confirma que la configuración se guarda correctamente.
7. Verifica HTTPS y que no haya errores de CORS en la consola del navegador.

---

## 11. Backup y mantenimiento

### Backups de base de datos

- **Railway/Render**: activa backups automáticos en el panel de la base de datos.
- **VPS**: configura un cron diario:

```bash
pg_dump $DATABASE_URL > backup_$(date +%F).sql
```

### Actualizaciones

1. Realiza cambios en local.
2. Sube a GitHub.
3. El hosting redeploya automáticamente (si está conectado al repo).
4. Si hay cambios en Prisma, ejecuta `npx prisma migrate deploy` en el servidor.

---

## 12. Checklist de despliegue

- [ ] Repositorio en GitHub sin `.env` ni `dev.db`.
- [ ] Base de datos PostgreSQL/MySQL creada.
- [ ] Variables de entorno configuradas.
- [ ] Migraciones aplicadas (`npx prisma migrate deploy`).
- [ ] Datos iniciales cargados (`node prisma/seed.js`).
- [ ] Backend desplegado y accesible por HTTPS.
- [ ] Frontend desplegado (o servido por el backend).
- [ ] CORS configurado con el dominio del frontend.
- [ ] Dominio personalizado y SSL activo.
- [ ] Pruebas de login, venta, caja y reportes exitosas.
- [ ] Backups automáticos activados.

---

## 13. Despliegue en Hostinger

Hostinger ofrece dos opciones: **hosting compartido con Node.js** (planes Business/Cloud Startup) o **VPS**. A continuación la guía para hosting compartido, que es la más común.

### Requisitos en Hostinger

- Plan que soporte **Node.js** (hPanel > Websites > Manage > Node.js).
- Base de datos **MySQL** incluida (se gestiona desde phpMyAdmin).

### Paso a paso

#### 1. Preparar el proyecto en local

Ejecuta el script de preparación:

```bash
node scripts/prepare-hostinger.mjs
```

Este script hace automáticamente:

- Cambia el provider de Prisma de SQLite a MySQL.
- Elimina migraciones de SQLite.
- Genera `backend/prisma/init.sql` con el schema para MySQL.
- Genera el cliente Prisma para MySQL.
- Construye el frontend en `frontend/dist/`.

> **IMPORTANTE:** no ejecutes este script en tu rama de desarrollo si vas a seguir usando SQLite. Hazlo en una copia o rama de producción.

#### 2. Crear la base de datos MySQL en Hostinger

1. Ingresa a hPanel.
2. Ve a **Bases de datos** > **Base de datos MySQL**.
3. Crea una nueva base de datos y anota:
   - Nombre de la base de datos.
   - Usuario.
   - Contraseña.
   - Host (generalmente `localhost` o el que indique Hostinger).

#### 3. Crear las tablas

1. Abre **phpMyAdmin** desde hPanel.
2. Selecciona la base de datos creada.
3. Ve a la pestaña **Importar**.
4. Selecciona el archivo `backend/prisma/init.sql` generado por el script.
5. Ejecuta la importación.

#### 4. Subir archivos por FTP o Administrador de archivos

Sube al directorio raíz de tu dominio (por ejemplo `public_html`):

- Carpeta `backend/` **sin** `node_modules`.
- Carpeta `frontend/dist/`.
- **No subas**: `backend/.env`, `backend/prisma/dev.db`, `backend/node_modules`, `frontend/node_modules`.

Estructura sugerida en el servidor:

```
public_html/
├── backend/
│   ├── src/
│   ├── prisma/
│   │   ├── schema.prisma   # ahora con provider mysql
│   │   └── init.sql
│   └── package.json
├── frontend/
│   └── dist/
└── (archivos de Hostinger)
```

#### 5. Instalar dependencias del backend

Desde hPanel abre **Terminal** (si está disponible) o conecta por SSH y ejecuta:

```bash
cd ~/public_html/backend
npm install --production
```

#### 6. Configurar variables de entorno

Crea un archivo `backend/.env` en el servidor con:

```env
DATABASE_URL="mysql://usuario:password@host:3306/nombre_base_datos"
JWT_SECRET="tu-clave-super-segura-de-al-menos-64-caracteres-aleatorios"
PORT=3000
NODE_ENV=production
FRONTEND_URL="https://tu-dominio.com"
```

> Hostinger asigna un puerto específico para Node.js. Ajusta `PORT` al que te indique hPanel.

#### 7. Configurar la aplicación Node.js en hPanel

1. En hPanel ve a **Websites** > **Node.js** (o **Setup Node.js App**).
2. Selecciona la versión de Node.js (recomendada: 18 o 20).
3. **Application root**: `backend` (o la ruta donde subiste backend).
4. **Application startup file**: `src/server.js`.
5. **Application URL**: tu dominio o subdominio.
6. Guarda y reinicia la aplicación.

#### 8. Verificar

- Accede a `https://tu-dominio.com`.
- Prueba login con `admin@bodega.com` / `admin123`.
- Crea una venta, revisa stock y reportes.

### Hostinger VPS (alternativa)

Si tienes un VPS con Hostinger, sigue la guía de la **sección 4 (VPS propio)** con Ubuntu + Nginx. En VPS puedes instalar PostgreSQL o MySQL según prefieras.

### Notas importantes para Hostinger

- Hostinger compartido **no permite ejecutar SQLite de forma persistente** porque los archivos pueden no conservarse entre reinicios. Por eso se usa MySQL.
- Si más adelante cambias el schema, deberás generar un nuevo `init.sql` o usar migraciones SQL manuales en phpMyAdmin.
- El certificado SSL lo gestiona Hostinger automáticamente si activas HTTPS en el dominio.

---

Para dudas específicas sobre un hosting en particular, consulta la documentación oficial de Railway, Render, Hostinger o tu proveedor VPS.
