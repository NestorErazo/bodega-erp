# Contrato frontend ↔ API — Bodega de Ropa

> **Documento de referencia para Persona A (backend) y Persona B (frontend).**
> Define, por página/módulo, los endpoints que consume el frontend (`frontend/src/pages/*`),
> el **shape** de petición y respuesta, y los huecos que hay que cerrar.
> Complementa `PLAN_TRABAJO.md` (tandas 1–5) y `README.md`.

---

## Convenciones generales (obligatorias en todos los endpoints)

- Todas las rutas van bajo el prefijo `/api` (el front las llama sin prefijo: `api('/products')`).
- Todas las respuestas son **JSON**.
- Errores: status no-2xx + cuerpo `{ "error": "mensaje corto" }` (el front muestra `data.error`).
- `401` → el front borra sesión y redirige a `/login`. No usar otro código para sesión expirada.
- Autenticación: header `Authorization: Bearer <token>` en toda petición autenticada.
- Dinero `COP`: números (no strings). Fechas: ISO 8601 (`Date`/`string` — el front normaliza ambos).
- El front NO expone un campo `id` para varios-botones: las tablas usan `key={item.id}`; devolver siempre `id`.

### Fallback a mocks

`useResource(path, mockData)` (frontend/src/hooks/useResource.js) intenta la API primero y solo usa
`mockData` si la petición **falla**. Las páginas que usan `api()` directo **no** tienen fallback y
requieren backend activo (Dashboard, POS, Products, ProductForm, Movements, Kardex).

---

## 1. Autenticación

### `POST /auth/login`
Body: `{ "email": "admin@bodega.com", "password": "admin123" }`
Respuesta `200`:
```json
{ "token": "jwt...", "user": { "id": 1, "name": "Administrador", "email": "admin@bodega.com", "role": "admin" } }
```
> El front guarda `token` y `user` en localStorage. El comprobante del POS usa `user.name`.
> Credenciales demo en frontend/src/pages/Login.jsx: `admin@bodega.com`/`admin123`, `vendedor@bodega.com`/`demo123`.

### `GET /auth/me`
Respuesta `200`: `{ "id": 1, "name": "…", "email": "…", "role": "…" }` (misma forma que `login.user`).
Se invoca al recargar con un token guardado.

---

## 2. Catálogo compartido (`/catalog`)

Respuesta para cada uno: **array** de `{ "id": number, "name": string }`.

| Endpoint | Notas |
|---|---|
| `GET /catalog/categories` | opcional `subcategories: [{ id, name }]` por categoría (las consume ProductForm) |
| `GET /catalog/brands` | — |
| `GET /catalog/sizes` | variantes |
| `GET /catalog/colors` | variantes |

---

## 3. Ventas

### `GET /sales` — VentasHistorial y Devoluciones (fallback `mockVentas` / `mockVentaDetalle`)
Respuesta `200`: **array** de ventas serializadas:
```json
[{
  "id": 1001, "number": "FAC-1001", "tipo": "FAC", "fecha": "2026-09-05T10:00:00.000Z",
  "cliente": "Cliente mostrador", "vendedor": "Natalia", "metodo": "Efectivo",
  "total": 77000, "subtotal": 70000, "discount": 0, "tax": 0,
  "items": [{ "producto": "Camiseta Básica", "talla": "M", "color": "Negro",
              "cantidad": 2, "precio": 35000, "descuento": 0, "total": 70000 }],
  "detalle": "2 × Camiseta Básica",
  "payments": [{ "method": "efectivo", "amount": 77000 }]
}]
```
- El número real viene en `number` (`FAC-1001`). El front puede renderizar `FAC-{id}` como respaldo.
- El backend devuelve `items` como array de líneas; `detalle` es un string descriptivo.
- Querystring soportado: `?q=`, `?metodo=`, `?fechaDesde=`, `?fechaHasta=`, `?limit=`.

### `POST /sales` — POS (ya conectado en front)
Body:
```json
{
  "customerId": 1,
  "items": [{ "productId": 1, "variantId": 12, "quantity": 2, "price": 35000 }],
  "payments": [{ "method": "efectivo", "amount": 70000 }],
  "cashRegisterId": 1,
  "discount": 0,
  "tax": 0,
  "notes": ""
}
```
- `customerId` y `cashRegisterId` son opcionales.
- `payments.method` puede ser `efectivo`, `nequi`, `transferencia`, `bancolombia`, `daviplata`, `tarjeta debito`, `tarjeta credito`, `credito`.
- Si hay pago `credito` y `customerId`, se genera automáticamente una cuenta por cobrar.

Respuesta `201`: la venta completa serializada (mismo shape que `GET /sales/:id`).
```json
{ "id": 1002, "number": "FAC-1002", "fecha": "ISO", "cliente": "...", "vendedor": "...", "total": 70000 }
```
> Efecto esperado: descuenta stock, agrega movimiento de inventario (kardex), registra auditoría,
> afecta caja (si `cashRegisterId`) y queda visible en `GET /sales`.

### `POST /refunds` — Devoluciones (implementado)
Body: `{ "saleId": 1001, "items": [{ "cantidad": 1, "total": 35000 }], "motivo": "Error del cliente", "reingresar": true }`
Respuesta `201`: `{ "id": 1, "number": "NOT-1001", "total": 35000 }`.
> Efecto: crea la devolución, reintegra stock si `reingresar=true`, registra movimiento de inventario `DEVOLUCION`, ajusta caja (si hay caja abierta y pago en efectivo), ajusta cuenta por cobrar si aplica, y cambia el estado de la venta a `devuelta` cuando es devolución total.

### `GET /salespersons` — Vendedores (fallback `mockVendedores`)
Respuesta `200`: **array**:
```json
[{ "id": 1, "nombre": "Natalia Restrepo", "documento": "CC 1011223344", "telefono": "3000000001",
   "comision": 3, "estado": "Activo", "ventasMes": 9800000, "comisionGenerada": 294000 }]
```
### `POST /salespersons` — Alta de vendedor (implementado)
Body: `{ nombre, documento, telefono, comision, email?, password? }`.
Respuesta `201`: el vendedor creado (mismo shape que `GET /salespersons`).
> Crea un `Employee` y un `User` con rol `vendedor`. Si no se envía `email`, se genera uno interno; si no se envía `password`, se usa `demo123`.

---

## 4. Inventario y catálogo de productos

### `GET /products` — POS, Products, Movements, Kardex (SIN fallback)
Querystring: `?q=`, `?categoryId=`, `?lowStock=true`, `?limit=500`.
Respuesta `200`: **array**:
```json
[{
  "id": 1, "code": "CAM001", "reference": "REF-001", "name": "Camiseta Básica",
  "description": "", "barcode": "", "sku": "",
  "brand": "Básico", "category": "Camisetas", "categoryId": 1, "brandId": 1,
  "purchasePrice": 15000, "avgCost": 15000, "salePrice": 35000,
  "wholesalePrice": 30000, "promoPrice": 0, "taxRate": 0,
  "stockMin": 5, "stockMax": 100, "totalStock": 120, "location": "A1-05",
  "colorLabel": "Varios", "active": true,
  "variants": [{ "id": 12, "sizeId": 2, "colorId": 3, "size": "M", "color": "Negro",
                 "sku": "CAM001-2-3", "barcode": "", "stock": 40, "cost": 15000, "price": 35000 }]
}]
```
> **⚠️ Contrato crítico para POS:** todo producto DEBE traer `variants` como **array no vacío** y cada
> variante su `price`. Un `variants` ausente rompe la tarjeta del producto (`POS.jsx:96`).

### `GET /products/{id}` — ProductForm (edición), Movements, Kardex `?`
Misma forma que el ítem de `GET /products` (con sus `variants`).

### `POST /products` / `PUT /products/{id}` — ProductForm (CRUD) (SIN fallback)
Body (coincide con el shape de producto + `variants`):
```json
{
  "code": "CAM002", "reference": "", "name": "Nuevo", "description": "",
  "categoryId": 1, "subcategoryId": null, "brandId": null,
  "material": "", "gender": "", "season": "", "location": "A1-05",
  "purchasePrice": 15000, "avgCost": 15000, "salePrice": 35000,
  "wholesalePrice": 0, "promoPrice": 0, "taxRate": 0, "stockMin": 5, "stockMax": 100,
  "active": true,
  "variants": [{ "id": null, "sizeId": 2, "colorId": 3, "sku": "CAM002-2-3",
                 "barcode": "", "stock": 10, "cost": 15000, "price": 35000 }]
}
```
Respuesta: el producto creado/actualizado. Al editar, las variantes existentes traen su `id`.

### `GET /inventory/movements?limit=200` — Movements (SIN fallback)
Respuesta `200`: **array**:
```json
[{ "id": 1, "date": "ISO", "productName": "Camiseta Básica", "variantLabel": "Negro · M",
   "type": "ENTRADA", "quantity": 20, "cost": 15000, "documentRef": "OC-040", "reason": "Compra", "user": "Administrador" }]
```
`type` ∈ `ENTRADA | SALIDA | AJUSTE | DEVOLUCION`.

### `POST /inventory/movements` — Movements (SIN fallback)
Body: `{ "productId": 1, "variantId": 12, "type": "ENTRADA", "quantity": 10, "reason": "…", "documentRef": "OC-041" }`
Efecto esperado (UI): `SALIDA` descuenta stock.

### `GET /inventory/kardex/{productId}` — Kardex (SIN fallback)
Respuesta `200`:
```json
{
  "product": { "id": 1, "name": "Camiseta Básica", "avgCost": 15200 },
  "totalStock": 120, "inventoryValue": 1824000,
  "variants": [{ "id": 12, "label": "Negro · M", "stock": 40 }],
  "kardex": [{ "id": 1, "date": "ISO", "document": "OC-040", "type": "ENTRADA",
               "entrada": 20, "salida": 0, "saldo": 20, "cost": 15000, "user": "Administrador", "reason": "Compra" }]
}
```
> ⚠️ El front espera `variants` con `id`/`label`/`stock` y `kardex` con `entrada`/`salida` numéricos.

---

## 5. Dashboard

Sin fallback. Tres peticiones en paralelo:

### `GET /dashboard`
```json
{ "inventory": { "totalProducts": 24, "totalStock": 620, "agotados": 0,
                 "stockBajo": 2, "valorCosto": 18000000, "valorVenta": 34000000 },
  "movimientos": [{ "id": 1, "product": "Camiseta Básica", "user": "Natalia",
                    "date": "ISO", "type": "SALIDA", "quantity": 2 }] }
```
### `GET /dashboard/charts`
```json
{ "byCategory": [{ "category": "Camisetas", "stock": 240, "products": 8, "value": 9000000 }],
  "weekly": [{ "date": "2026-08-31", "movimientos": 14 }] }
```
### `GET /dashboard/alerts`
```json
[{ "product": "Chaqueta Impermeable", "code": "CHQ-01", "severity": "warning",
   "type": "stock_bajo", "stock": 9, "min": 10 }]
```
`severity` ∈ `critical | warning` (define color). `type` se muestra con `_`→espacio.

---

## 6. Compras

### `GET /purchases` — Compras (fallback `mockCompras`)
```json
[{ "id": 1, "numero": "OC-040", "proveedor": "Textiles del Valle SAS",
   "fecha": "ISO", "items": "Camiseta DryFit ×150", "total": 9800000,
   "estado": "Recibida" }]
```
`estado` ∈ `Pendiente | Recibida | Pagada | Anulada` (filtro case-insensitive). `numero || id` para el N.º.

### `POST /purchases` — (PENDIENTE de conectar)
Body:
```json
{ "proveedorId": 1, "fecha": "2026-09-06", "condicionPago": "credito",
  "lines": [{ "descripcion": "Camiseta DryFit ×L · Negro", "qty": 150, "costo": 20000, "iva": 19 }] }
```
Efecto esperado (UI): sube inventario, actualiza costo promedio, genera cuenta por pagar (crédito) o
movimiento financiero (contado), registra auditoría.

### `GET /suppliers` — Proveedores (fallback `mockProveedores`, normaliza inglés/español)
```json
[{ "id": 1, "nombre": "Textiles del Valle SAS", "nit": "900123456-1",
   "telefono": "3101234567", "email": "ventas@textilesvalle.com", "ciudad": "Cali",
   "contacto": "", "diasCredito": 30, "compras": 24, "deuda": 0, "estado": "Activo" }]
```
> Acepta también inglés: `name/phone/city/contact/creditDays/active`. `POST /suppliers`/`PUT /suppliers/{id}` (PENDIENTE): body con los campos del shape.

---

## 7. Clientes

### `GET /customers` — Clientes (fallback `mockClientes`, normaliza inglés/español)
```json
[{ "id": 1, "nombre": "Ana García", "documento": "CC 52345678", "telefono": "3001112233",
   "email": "ana@mail.com", "ciudad": "Cali", "compras": 12, "total": 4200000,
   "ultima": "ISO", "deuda": 0 }]
```
Acepta también: `name/document/phone/city/sales`. `POST /customers` / `PUT /customers/{id}` (PENDIENTE).

### `GET /accounts-receivable` — Cartera (fallback `mockCartera`)
```json
[{ "id": 1, "cliente": "Jorge Mendoza", "documento": "FAC-994", "vencimiento": "ISO",
   "valor": 220000, "abonado": 0, "saldo": 220000, "estado": "Pendiente" }]
```
`estado` ∈ `Pendiente | Parcial | Pagado | Vencido`.

### `POST /accounting/receivables/{id}/pay` — Abono a cartera (backend listo)
Body: `{ "amount": 50000, "method": "efectivo", "cashRegisterId": 1 }`. Efecto esperado: registra el pago, actualiza saldo, afecta caja si aplica y registra auditoría.
> El backend expone esta ruta bajo `/api/accounting`; para mantener compatibilidad también se monta `/api/accounts-receivable` solo para el `GET` de Cartera.

---

## 8. Finanzas

### `GET /cash/state` — Caja (fallback `mockCaja`)
```json
{ "apertura": 1500000, "ingresos": 12500000, "egresos": 3200000,
  "cierreEsperado": 10800000, "cierreReal": 10750000, "diferencia": -5000 }
```
> `GET /cash/movements` ya está implementado. Devuelve los movimientos de la caja abierta
> (o de `cashRegisterId` si se envía) con formato `[{ id, hora, tipo, detalle, medio, valor, usuario, documentRef }]`.

### `GET /expenses` — Gastos (fallback `mockGastos`)
Respuesta: **array o `{ "gastos": [...], "total": n }`** (el front acepta ambos; Gastos.jsx:17).
```json
[{ "id": 1, "fecha": "ISO", "categoria": "Arriendo", "descripcion": "Local principal",
   "valor": 2500000, "metodo": "Transferencia", "comprobante": "REC-0001" }]
```
Categorías del selector: Arriendo, Servicios públicos, Internet, Nómina, Transporte, Publicidad, Empaque, Mantenimiento, Impuestos, Comisiones, Otros.
`POST /expenses` (PENDIENTE): `{ fecha, categoria, descripcion, valor, metodo, comprobante }`.

### `GET /banks` — Bancos (fallback `mockBancos`, normaliza inglés/español)
```json
[{ "id": 1, "banco": "Bancolombia", "cuenta": "Cuenta Ahorros 123",
   "tipo": "Ahorros", "saldo": 8500000, "movimientos": 24 }]
```
Acepta `bank/account/type`. `tipo` ∈ `Ahorros | Corriente | Digital`.

### `GET /banks/movements` — (fallback `mockMovimientosBancarios`, normaliza)
```json
[{ "id": 1, "fecha": "ISO", "banco": "Bancolombia", "tipo": "Ingreso",
   "concepto": "Consignación ventas", "valor": 4500000 }]
```
Acepta `date/type/concept/amount`. `tipo` ∈ `Ingreso | Egreso | Transferencia`.

---

## 9. Reportes (parcial — usa solo mocks en el front)

`Reportes.jsx` aún NO llama a la API (usa `mockSerieVentas`, `mockMetodosPago`, `mockProductosTop`,
`mockRentabilidad`, `mockMetas`). El backend ya expone tres endpoints individuales;
falta conectar el frontend o crear un endpoint agregado `GET /reports`.

### Endpoints disponibles

#### `GET /reports/resumen?periodo=12m`
```json
{
  "ventas": 21000000, "costo": 13650000, "utilidad": 7350000,
  "facturas": 71, "devoluciones": 0
}
```

#### `GET /reports/serie?periodo=12m`
```json
[
  { "mes": "sep", "ventas": 21000000, "unidades": 195, "facturas": 71, "utilidad": 7350000 }
]
```

#### `GET /reports/top?periodo=12m&limit=10`
```json
[
  { "producto": "Camiseta Básica", "unidades": 184, "ventas": 6440000, "utilidad": 3128000 }
]
```

> El frontend `Reportes.jsx` consume los endpoints por separado. Se agregaron además
> `GET /reports/categories` (rentabilidad por categoría) y `GET /reports/goals` (metas diaria/mensual/anual).

---

## 10. Configuración (conectado)

El backend expone:
- `GET /settings` → devuelve configuración como objeto plano `{ key: value }`.
- `PUT /settings` → requiere permiso `settings.manage`, guarda en BD.

`Configuracion.jsx` ya carga los datos al montar y guarda cambios de empresa y numeración.

### Shape esperado
```json
{
  "empresa": { "nombre": "Bodega de Ropa", "nit": "901.234.567-1", "direccion": "", "telefono": "",
               "email": "", "ciudad": "Cali", "moneda": "COP", "iva": 19 },
  "categorias": ["Camisetas", "Pantalones", "Chaquetas"],
  "marcas": ["Básico", "Nike", "Adidas"],
  "tallas": ["XS", "S", "M", "L", "XL"],
  "colores": ["Negro", "Blanco", "Rojo", "Azul"],
  "metodosPago": ["Efectivo", "Transferencia", "Nequi", "Bancolombia", "Daviplata",
                  "Tarjeta débito", "Tarjeta crédito", "Crédito"],
  "numeracion": { "factura": "FAC-1002", "cotizacion": "COT-0001", "pedido": "PED-0001", "devolucion": "NOT-0001" },
  "roles": [{ "name": "Administrador", "desc": "Acceso completo" }]
}
```

---

## 11. Auditoría

### `GET /audit` — (fallback `mockAuditoria`, normaliza inglés/español)
```json
[{ "id": 1, "fecha": "ISO", "user": { "name": "Administrador" }, "action": "Modificó el precio…",
   "entity": "Productos", "details": "salePrice 32000 → 35000" }]
```
El front acepta ambos: `user.name|usuario`, `action|accion`, `entity|modulo`, `details|detalle`, `date|fecha`.
Módulos del filtro: Productos, Ventas, Inventario, Compras, Gastos, Usuarios, Configuración.

---

## Resumen de endpoints de escritura por implementar / conectar

| Prioridad | Endpoint | Página | Tanda | Estado real |
|---|---|---|---|---|
| Alta | `POST /sales` | POS | 1 | ✅ Implementado y conectado |
| Alta | `POST /refunds` | Devoluciones | 1 | ✅ Implementado y conectado |
| Alta | `POST/PUT /products` | ProductForm | 2 | ✅ Implementado |
| Alta | `POST /inventory/movements` | Movements | 2 | ✅ Implementado |
| Media | `POST/PUT /suppliers` | Proveedores | 3 | ✅ Implementado |
| Media | `POST /purchases` | Compras | 3 | ✅ Implementado |
| Media | `POST/PUT /customers` | Clientes | 3 | ✅ Implementado |
| Media | `POST /salespersons` | Vendedores | 3 | ✅ Implementado y conectado |
| Media | `POST /accounting/receivables/{id}/pay` | Cartera | 3 | ✅ Implementado |
| Media | `POST /cash/open`, `/cash/movements`, `/cash/close` | Caja | 3 | ✅ Implementados |
| Media | `GET /cash/movements` | Caja | 3 | ✅ Implementado y conectado |
| Media | `POST /expenses` | Gastos | 3 | ✅ Implementado |
| Media | `POST /banks`, `POST /banks/movements` | Bancos | 3 | ✅ Implementados |
| Media | `GET/PUT /settings`, `GET /catalog/*` | Configuración | 4 | ✅ Conectado |
| Media | `/reports/resumen`, `/serie`, `/top`, `/categories`, `/goals` | Reportes | 4 | ✅ Conectados |

> Consultas (GET) ya cubiertas por el contrato de lectura arriba y con fallback a mocks salvo
> Dashboard, POS, Products, ProductForm, Movements y Kardex (requieren backend activo).

## Notas de campos canónicos

- El front **acepta** campos en inglés en: Clientes (`name/document/phone/city/sales`),
  Proveedores (`name/phone/city/contact/creditDays/active`), Bancos (`bank/account/type`,
  `date/type/concept/amount`) y Auditoría (`user.name/action/entity/details/date`).
- Para el resto de módulos, el front consume los nombres en **español** tal como se listan arriba.
- Si el backend elige un solo idioma canónico (recomendado: español para todo salvo los 4 normalizados),
  el contrato de arriba no cambia.