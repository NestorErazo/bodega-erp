# Plan de trabajo — Sincronización Bodega (backend ↔ frontend)

> Objetivo: pasar el frontend de datos mock a datos reales de la API/BD.
> Estimación total: **1–2 días** (backend avanzado, pero faltan endpoints de escritura y agregados).

---

## Antecedentes / diagnóstico

- El frontend usa `useResource(path, mockData)` (frontend/src/hooks/useResource.js:6).
- Ese hook **intenta la API primero** y solo usa `mockData` si la petición falla.
  → Con el backend activo, los módulos de **lectura simple ya se "curan" solos**.
- El trabajo real está en los módulos que **escriben** (crear venta, CRUD de producto)
  y en **validar que el shape de la respuesta** de cada endpoint coincida con lo que
  la página renderiza.

Módulos frontend → endpoint que consumen (frontend/src/pages/):

> **Nota sobre estado actual:** los huecos de backend han sido cerrados: `POST /refunds`, `GET /cash/movements` y `POST /salespersons` ya existen. `Reportes.jsx` y `Configuracion.jsx` ya consumen la API. El endpoint agregado `GET /reports` no fue necesario porque el frontend llama `/reports/resumen`, `/serie`, `/top`, `/categories` y `/goals`.

| Página | Endpoint | Escritura | Respaldada por mock |
|--------|----------|-----------|---------------------|
| POS | `/products`, `POST /sales` | SÍ (venta) | no |
| VentasHistorial | `/sales` | no | `mockVentas` |
| Devoluciones | `/sales` | no | `mockVentas` |
| Products | `/products` (filtros) | no | no |
| ProductForm | `/catalog/*`, `POST/PUT /products` | SÍ (CRUD) | no |
| Movements | `/inventory/movements`, `/products` | SÍ (movimiento) | no |
| Kardex | `/products`, `/inventory/kardex/:id` | no | no |
| Dashboard | `/dashboard`, `/dashboard/charts`, `/dashboard/alerts` | no | no |
| Clientes | `/customers` | no | `mockClientes` |
| Cartera | `/accounts-receivable` | no | `mockCartera` |
| Proveedores | `/suppliers` | no | `mockProveedores` |
| Compras | `/purchases` | no | `mockCompras` |
| Vendedores | `/salespersons` | no | `mockVendedores` |
| Gastos | `/expenses` | no | `mockGastos` |
| Caja | `/cash/state` | no | `mockCaja` |
| Bancos | `/banks`, `/banks/movements` | no | `mockBancos` |
| Auditoria | `/audit` | no | `mockAuditoria` |
| Reportes | `/reports/resumen`, `/reports/serie`, `/reports/top` (a conectar) | no | `mockSerieVentas`/`mockRentabilidad` |
| Configuracion | `/settings` | SÍ (backend listo; frontend sin conectar) | no |

---

## Reparto del trabajo para 2 personas en paralelo

### Reglas de oro para no chocar

1. **Áreas separadas:** persona A solo toca backend, persona B solo frontend.
   | Área | Persona |
   |------|---------|
   | `backend/src/routes/*` | A |
   | `backend/prisma/*` + migraciones | A |
   | `frontend/src/pages/*` | B |
   | `frontend/src/api.js`, `hooks/`, `context/`, `App.jsx` | **Solo B** |

2. **Archivos compartidos los toca UNA sola persona** (`api.js`, `useResource.js`,
   `App.jsx`) para evitar merges conflictivos. Idealmente B.

3. **Contrato de datos acordado al inicio:** nombres y tipos de campos que cada
   endpoint devuelve/recibe, para que ambos sepan qué mapear.
   → **Definido en `docs/API_CONTRATO.md`** (leer antes de Tanda 1 y actualizarlo
   si algo cambia).

4. **Ramificación (recomendado):** usar git, cada uno en su rama
   (`backend-paralelo` / `frontend-paralelo`) y fusionar al cerrar cada tanda.
   Como A y B no tocan los mismos archivos, los merges no dan conflictos.

---

## Tandas de trabajo

### Tanda 1 — Núcleo de ventas (máxima prioridad, ~45 min)
- **A (backend):** definir/validar `GET /sales` + `POST /sales` (shape del body y respuesta).
- **B (frontend):** validar `POS.jsx` (crear venta end-to-end) y `VentasHistorial` + `Devoluciones`.
- **Coordinación:** acordar el contrato del `POST /sales`.

### Tanda 2 — Inventario y catálogo (~40 min)
- **A (backend):** validar `products`, `inventory/movements`, `inventory/kardex/:id`, `catalog/*` (CRUD producto, descuento de stock).
- **B (frontend):** `Products.jsx`, `Movements.jsx`, `Kardex.jsx`, `ProductForm.jsx` (CRUD).

### Tanda 3 — Módulos de lectura simple (~30 min)
- **A (backend):** revisar por módulo que respondan el shape esperado: `customers`,
  `suppliers`, `purchases`, `salespersons`, `expenses`, `cash/state`, `banks`,
  `banks/movements`, `audit`, `dashboard` (+charts/alerts), `accounts-receivable`.
- **B (frontend):** verificar que cada página renderice los datos reales (Clientes,
  Cartera, Proveedores, Compras, Vendedores, Gastos, Caja, Bancos, Auditoria,
  Dashboard). *Estas se curan solas al estar el backend activo; solo hay que validar el mapeo.*

### Tanda 4 — Reportes y configuración (~30 min) ✅
- **A (backend):** validar `/settings`; exponer `/reports/resumen`, `/reports/serie`, `/reports/top`, `/reports/categories` y `/reports/goals`.
- **B (frontend):** conectar `Reportes.jsx` a los endpoints de reportes y `Configuracion.jsx` a `/settings`.

### Tanda 5 — Verificación integral
- Correr `npm run dev` desde la raíz (`scripts/dev.mjs`).
- Probar el flujo completo: login → crear venta en POS → ver historial →
  kardex actualizado → dashboard refleja la venta.
- Marcar checklists abajo.

---

## Checklist de validación por módulo

- [x] **Ventas:** crear venta en POS persiste en BD y aparece en VentasHistorial.
- [x] **Inventario:** registrar movimiento descuenta stock (Kardex actualizado).
- [x] **Productos:** alta/edición de producto persiste; categorías/marcas cargan.
- [x] **Dashboard:** los 3 endpoints (`/dashboard`, `/charts`, `/alerts`) devuelven datos.
- [x] **Clientes / Cartera:** listado y cuentas por cobrar reales.
- [x] **Proveedores / Compras:** listados reales.
- [x] **Vendedores:** listado, alta y comisiones reales.
- [x] **Gastos / Caja / Bancos:** datos reales; movimientos de caja visibles.
- [x] **Auditoría:** log de actividad real.
- [x] **Reportes:** series, métodos de pago, top, rentabilidad por categoría y metas desde la API.
- [x] **Configuración:** datos de empresa y numeración se guardan en BD.
- [x] **Devoluciones:** `POST /refunds` reintegra stock, caja y cartera.

---

## Trabajo en paralelo (resumen)

- **Persona A = backend** (`backend/src/routes/*`, `prisma/`).
- **Persona B = frontend** (`frontend/src/pages/*`, y archivos compartidos: `api.js`, `hooks`, `context`, `App.jsx`).
- Trabajar **por tanda** y coordinar el **contrato de datos**.
- Usar **ramas de git** y fusionar por tanda para evitar conflictos.
