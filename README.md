# Bodega de Ropa — ERP / POS

Sistema ERP administrativo y punto de venta para bodega de ropa. Permite gestionar inventario con variantes (talla/color), ventas POS, devoluciones, compras, proveedores, clientes, cartera, caja, gastos, bancos, reportes y configuración del negocio.

## Funcionalidades principales

- **Punto de venta (POS):** búsqueda por código/SKU/nombre, carrito con variantes, múltiples métodos de pago, descuentos y generación de factura.
- **Inventario / Kardex:** control de entradas, salidas, ajustes y trazabilidad por producto y variante.
- **Productos:** CRUD de productos con variantes, categorías, marcas, tallas y colores.
- **Ventas y devoluciones:** historial de ventas, filtrado y devoluciones que reintegran stock, ajustan caja y cartera.
- **Compras:** órdenes de compra que afectan inventario y generan cuentas por pagar.
- **Clientes y cartera:** cuentas por cobrar con abonos y estados (pendiente, parcial, pagado, vencido).
- **Finanzas:** caja (apertura, movimientos, cierre), gastos operativos y cuentas bancarias.
- **Vendedores:** comisiones, metas de ventas y alta de vendedores.
- **Reportes:** ventas por período, métodos de pago, productos top, rentabilidad por categoría y metas.
- **Configuración:** datos de la empresa, numeración de documentos y preferencias.
- **Auditoría:** registro de operaciones relevantes (ventas, inventario, caja, configuración).

## Módulos y rutas

| # | Módulo | Rutas frontend | API principal |
|---|--------|----------------|---------------|
| 1 | Dashboard | `/` | `GET /api/dashboard`, `/api/dashboard/alerts`, `/api/dashboard/charts` |
| 2 | Productos | `/inventario/productos`, `/inventario/productos/nuevo`, `/inventario/productos/:id` | `GET/POST/PUT /api/products` |
| 3 | Inventario / Kardex | `/inventario/movimientos`, `/inventario/kardex` | `GET/POST /api/inventory/movements`, `GET /api/inventory/kardex/:id` |
| 4 | POS / Ventas | `/ventas`, `/ventas/historial`, `/ventas/devoluciones` | `GET/POST /api/sales`, `POST /api/refunds` |
| 5 | Vendedores | `/ventas/vendedores` | `GET/POST /api/salespersons`, `/api/salespersons/goals` |
| 6 | Compras / Proveedores | `/compras`, `/compras/proveedores` | `GET/POST /api/purchases`, `GET/POST/PUT /api/suppliers` |
| 7 | Clientes / Cartera | `/clientes`, `/clientes/cartera` | `GET/POST/PUT /api/customers`, `GET /api/accounts-receivable`, `POST /api/accounting/receivables/:id/pay` |
| 8 | Finanzas | `/finanzas/caja`, `/finanzas/gastos`, `/finanzas/bancos` | `GET/POST /api/cash/*`, `GET/POST /api/expenses`, `GET/POST /api/banks/*` |
| 9 | Reportes | `/reportes` | `GET /api/reports/resumen`, `/api/reports/serie`, `/api/reports/top`, `/api/reports/categories`, `/api/reports/goals` |
| 10 | Configuración / Auditoría | `/configuracion`, `/auditoria` | `GET/PUT /api/settings`, `GET /api/audit` |

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts + React Router + Lucide React
- **Backend**: Node.js + Express + Prisma ORM
- **Base de datos**: SQLite en desarrollo. En producción se apunta `DATABASE_URL` a PostgreSQL, MySQL o SQLite según el hosting.
- **Autenticación**: JWT con roles y permisos.

## Estructura del proyecto

```
bodega/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Modelo de datos completo
│   │   ├── seed.js              # Datos demo reejecutables
│   │   └── dev.db               # SQLite (generado por migrate)
│   ├── src/
│   │   ├── server.js            # Express, rutas, CORS
│   │   ├── db.js                # Exporta Prisma client
│   │   ├── middleware/auth.js   # JWT
│   │   ├── middleware/permissions.js
│   │   ├── utils/audit.js
│   │   └── routes/              # auth, users, products, inventory, dashboard,
│   │                            # catalog, sales, refunds, purchases, customers,
│   │                            # suppliers, cash, expenses, banks, accounts,
│   │                            # salespersons, notifications, reports, audit, settings
│   ├── .env                     # DATABASE_URL, JWT_SECRET, PORT
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Rutas de la aplicación
│   │   ├── api.js               # Fetch wrapper + token
│   │   ├── context/AuthContext.jsx
│   │   ├── hooks/useResource.js # Fetch con fallback a mock local
│   │   ├── mockData.js          # Datos demo offline
│   │   ├── components/          # Layout, ui.jsx, Badge, StatCard, etc.
│   │   └── pages/               # Módulos organizados por carpeta
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── docs/
│   ├── API_CONTRATO.md          # Contrato frontend/API
│   └── MANUAL_USUARIO.md        # Guía de uso para el usuario final
├── package.json                 # Scripts raíz
├── PLAN_TRABAJO.md              # Plan de sincronización frontend/backend
└── README.md                    # Este archivo
```

## Requisitos

- Node.js 18+
- npm o pnpm
- (Opcional) Git

## Arranque rápido

```bash
cd bodega

# 1. Instalar dependencias
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Configurar entorno (backend/.env)
#    DATABASE_URL="file:./dev.db"
#    JWT_SECRET="tu-clave-secreta-minimo-32-caracteres"
#    PORT=4000

# 3. Crear schema + sembrar datos demo
cd backend
npx prisma migrate deploy   # aplica migraciones existentes
node prisma/seed.js          # carga datos demo (limpia y recrea)

# 4. Arrancar backend
npm run dev                  # http://localhost:4000

# 5. Arrancar frontend (otra terminal)
cd ../frontend && npm run dev
# Abrir http://localhost:5173
```

También se puede arrancar ambos desde la raíz con `npm run dev`.

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run setup` | Migración + seed desde la raíz |
| `npm run dev:backend` | Backend con `--watch` |
| `npm run dev:frontend` | Frontend con HMR |
| `npm run dev` | Ambos en paralelo (requiere `scripts/dev.mjs`) |
| `cd backend && npm run seed` | Re-sembrar datos demo (limpia y recrea todo) |
| `cd backend && npm run db:reset` | Resetea BD y ejecuta seed |
| `cd frontend && npm run build` | Build de producción |

## Credenciales demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@bodega.com` | `admin123` | Administrador (acceso total) |
| `vendedor@bodega.com` | `demo123` | Vendedor (POS, clientes, ventas) |

## API completa

Todas las rutas requieren `Authorization: Bearer <token>` excepto `POST /api/auth/login`.

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login, retorna JWT y usuario |
| `GET` | `/api/auth/me` | Usuario del token actual |

### Catálogo

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/catalog/categories` | Categorías |
| `GET` | `/api/catalog/subcategories` | Subcategorías |
| `GET` | `/api/catalog/brands` | Marcas |
| `GET` | `/api/catalog/sizes` | Tallas |
| `GET` | `/api/catalog/colors` | Colores |
| `GET` | `/api/catalog/clients` | Clientes para selectores |
| `GET` | `/api/catalog/suppliers` | Proveedores para selectores |

### Productos e inventario

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/products` | Lista con filtros (`q`, `categoryId`, `lowStock`, `limit`) |
| `GET` | `/api/products/:id` | Detalle de producto |
| `POST` | `/api/products` | Crear producto con variantes |
| `PUT` | `/api/products/:id` | Editar producto |
| `DELETE` | `/api/products/:id` | Eliminar producto |
| `GET` | `/api/inventory/movements` | Movimientos de inventario |
| `POST` | `/api/inventory/movements` | Registrar movimiento (entrada/salida/ajuste/devolución) |
| `GET` | `/api/inventory/kardex/:productId` | Kardex del producto |

### Ventas y devoluciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/sales` | Lista de ventas con filtros |
| `GET` | `/api/sales/:id` | Detalle de venta |
| `POST` | `/api/sales` | Crear venta POS (transacción atómica) |
| `DELETE` | `/api/sales/:id` | Anular venta |
| `POST` | `/api/refunds` | Crear devolución |

### Compras y proveedores

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/purchases` | Lista de compras |
| `POST` | `/api/purchases` | Crear compra |
| `PUT` | `/api/purchases/:id/status` | Cambiar estado de compra |
| `GET` | `/api/suppliers` | Lista de proveedores |
| `POST` | `/api/suppliers` | Crear proveedor |
| `PUT` | `/api/suppliers/:id` | Editar proveedor |

### Clientes y cartera

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/customers` | Lista de clientes |
| `POST` | `/api/customers` | Crear cliente |
| `PUT` | `/api/customers/:id` | Editar cliente |
| `GET` | `/api/accounts-receivable` | Cartera (frontend) |
| `GET` | `/api/accounting/receivables` | Cartera (API) |
| `POST` | `/api/accounting/receivables/:id/pay` | Abono a cuenta por cobrar |
| `GET` | `/api/accounting/payables` | Cuentas por pagar |
| `POST` | `/api/accounting/payables/:id/pay` | Abono a proveedor |

### Finanzas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/cash/state` | Estado de caja abierta |
| `GET` | `/api/cash/movements` | Movimientos de caja |
| `POST` | `/api/cash/open` | Abrir caja |
| `POST` | `/api/cash/movements` | Registrar movimiento de caja |
| `POST` | `/api/cash/close` | Cerrar caja |
| `GET` | `/api/expenses` | Lista de gastos |
| `POST` | `/api/expenses` | Crear gasto |
| `GET` | `/api/banks` | Lista de bancos |
| `POST` | `/api/banks` | Crear banco |
| `GET` | `/api/banks/movements` | Movimientos bancarios |
| `POST` | `/api/banks/movements` | Crear movimiento bancario |

### Vendedores y metas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/salespersons` | Vendedores con comisiones y ventas del mes |
| `POST` | `/api/salespersons` | Alta de vendedor |
| `GET` | `/api/salespersons/performance` | Rendimiento por período |
| `GET` | `/api/salespersons/goals` | Metas del mes |
| `POST` | `/api/salespersons/goals` | Crear/actualizar meta |

### Reportes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/reports/resumen` | Resumen financiero por período |
| `GET` | `/api/reports/serie` | Serie histórica (ventas, unidades, utilidad, facturas) |
| `GET` | `/api/reports/top` | Top productos vendidos |
| `GET` | `/api/reports/categories` | Rentabilidad por categoría |
| `GET` | `/api/reports/goals` | Metas diaria/mensual/anual |

### Configuración, auditoría y notificaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/settings` | Configuración del sistema |
| `PUT` | `/api/settings` | Guardar configuración |
| `GET` | `/api/audit` | Log de auditoría |
| `GET/POST` | `/api/notifications` | Notificaciones |

## Datos demo

El `seed.js` genera:

- 1 empresa y 5 roles con permisos diferenciados.
- 2 usuarios (admin y vendedor).
- 20 productos con variantes (tallas × colores) y stock inicial.
- Movimientos de inventario y kardex por producto.
- 20 clientes.
- 5 proveedores.
- 3 empleados/vendedores.
- ~77 ventas históricas de los últimos 40 días (incluye ventas a crédito).
- 5 compras a proveedores.
- 9 gastos operativos.
- Cuentas por cobrar (43) y por pagar (2) generadas por créditos.
- 2 cuentas bancarias con movimientos.
- Caja abierta con fondo inicial.

Para regenerar los datos demo:

```bash
cd backend
npm run seed
```

## Guía de desarrollo

### Convenciones

- El backend usa `/api` como prefijo base.
- Respuestas en JSON. Errores: status no 2xx + `{ error: "mensaje" }`.
- Dinero en COP como números, fechas en ISO 8601.
- El frontend usa `useResource(path, mockData)` para lecturas con fallback a mocks.
- Páginas críticas (POS, productos, movimientos, kardex) no tienen fallback y requieren backend activo.

### Roles y permisos

Los permisos se validan en el backend mediante `requirePermission([...])`. Los principales son:

- `dashboard.view`
- `products.view`, `products.manage`
- `inventory.manage`
- `pos.sell`, `sales.view`, `sales.manage`
- `purchases.view`, `purchases.manage`
- `customers.view`
- `finance.view`, `finance.manage`
- `settings.manage`
- `audit.view`
- `users.manage`, `roles.manage`

### Trabajo en paralelo

Ver `PLAN_TRABAJO.md` para el reparto de tareas entre backend y frontend, tandas de trabajo y contrato de datos.

### Auditoría

El sistema registra automáticamente operaciones de ventas, inventario, caja, compras, gastos y configuración en `AuditLog`. Consultar en `/auditoria`.

## Producción

Para desplegar el sistema en Internet consulta la guía completa en **`docs/DESPLEGUE.md`**. En resumen:

1. Migrar de SQLite a PostgreSQL/MySQL (recomendado para producción).
2. Configurar `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV` y `FRONTEND_URL`.
3. Ejecutar `npx prisma migrate deploy` y `node prisma/seed.js` (o generar/importar SQL para MySQL).
4. Construir el frontend: `cd frontend && npm run build`.
5. Desplegar backend y frontend (juntos o separados).
6. Configurar dominio y SSL.

Opciones documentadas:

- **Railway / Render** (PostgreSQL, despliegue automático).
- **VPS** con Ubuntu + Nginx.
- **Hostinger** (hosting compartido con Node.js + MySQL). Incluye script `scripts/prepare-hostinger.mjs`.

## Notas adicionales

- El sistema soporta múltiples métodos de pago: efectivo, transferencia, Nequi, Bancolombia, Daviplata, tarjeta débito, tarjeta crédito y crédito.
- Las ventas a crédito generan automáticamente cuentas por cobrar.
- Las compras a crédito generan cuentas por pagar.
- Las devoluciones reintegran stock, ajustan caja y actualizan el estado de la venta.
- La numeración de facturas se actualiza automáticamente; también puede configurarse en `/configuracion`.

## Licencia

Proyecto privado. Uso exclusivo del titular.
