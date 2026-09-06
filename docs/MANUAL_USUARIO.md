# Manual de usuario — Bodega de Ropa ERP/POS

Guía de uso del sistema para administradores, vendedores y operarios de bodega.

---

## 1. Acceso al sistema

1. Abra el navegador y vaya a la URL del sistema (por defecto `http://localhost:5173` en desarrollo).
2. Ingrese su correo y contraseña.
3. Haga clic en **Ingresar**.

### Credenciales de demostración

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin@bodega.com` | `admin123` | Administrador |
| `vendedor@bodega.com` | `demo123` | Vendedor |

> El rol de administrador tiene acceso a todos los módulos. El rol vendedor solo puede vender, consultar clientes y ver sus propias ventas.

---

## 2. Dashboard

Al iniciar sesión verá el tablero principal con:

- **KPIs**: ventas del período, utilidad, ticket promedio, margen bruto.
- **Gráficos**: ventas por categoría, movimientos recientes.
- **Alertas**: productos con stock bajo, inventario excesivo y cartera vencida.

Use el dashboard para tener una visión rápida del estado del negocio.

---

## 3. Punto de venta (POS)

Ruta: `/ventas`

### Vender un producto

1. En el campo de búsqueda escriba el nombre, código de barras, referencia o SKU del producto.
2. Haga clic en el producto deseado para agregarlo al carrito.
3. El sistema mostrará automáticamente las variantes disponibles (talla/color) con su stock.
4. Ajuste las cantidades si es necesario.
5. En el panel derecho seleccione los métodos de pago. Puede combinar varios (por ejemplo, efectivo + Nequi).
6. Si aplica, ingrese un descuento.
7. Haga clic en **Cobrar** para finalizar la venta.
8. El sistema descuenta el stock, registra el movimiento en el kardex, actualiza la caja y genera el comprobante.

### Ventas a crédito

1. Seleccione el cliente (debe estar registrado previamente).
2. En los métodos de pago elija **Crédito**.
3. La venta generará automáticamente una cuenta por cobrar en el módulo Cartera.

---

## 4. Historial de ventas y devoluciones

Rutas: `/ventas/historial` y `/ventas/devoluciones`

### Historial

- Consulte todas las ventas realizadas.
- Filtre por número de factura, cliente, método de pago o rango de fechas.
- Haga clic en una venta para ver su detalle.

### Devoluciones

1. Vaya a `/ventas/devoluciones`.
2. Busque la venta a la que desea aplicar la devolución.
3. Haga clic en **Devolver**.
4. Indique la cantidad a devolver y el motivo.
5. Marque o desmarque **Reingresar a inventario** según corresponda.
6. Confirme la devolución.

> El sistema reintegrará el stock, ajustará la caja (si el pago fue en efectivo), actualizará la cuenta por cobrar si aplica y cambiará el estado de la venta.

---

## 5. Productos

Rutas: `/inventario/productos`, `/inventario/productos/nuevo`, `/inventario/productos/:id`

### Crear un producto

1. Vaya a **Inventario > Productos** y haga clic en **Nuevo producto**.
2. Complete la información general: nombre, referencia, categoría, marca, precios, stock mínimo/máximo, ubicación.
3. Agregue variantes de talla y color. Cada variante puede tener su propio SKU, código de barras, stock y precio.
4. Guarde el producto.

### Editar o eliminar

- Haga clic en el producto de la lista para editarlo.
- Desde el formulario de edición puede modificar datos, agregar/eliminar variantes o desactivar el producto.

---

## 6. Inventario y Kardex

Rutas: `/inventario/movimientos`, `/inventario/kardex`

### Movimientos de inventario

1. Vaya a **Inventario > Movimientos**.
2. Haga clic en **Nuevo movimiento**.
3. Seleccione el producto, variante, tipo (entrada/salida/ajuste/devolución), cantidad y motivo.
4. Guarde. El stock se actualizará automáticamente.

### Kardex

1. Vaya a **Inventario > Kardex**.
2. Seleccione el producto.
3. Visualice el historial de entradas, salidas y saldos por variante.

---

## 7. Compras y proveedores

Rutas: `/compras`, `/compras/proveedores`

### Registrar una compra

1. Vaya a **Compras > Órdenes** y haga clic en **Nueva compra**.
2. Seleccione el proveedor.
3. Agregue los productos, cantidades y costos.
4. Indique la condición de pago: contado o crédito.
5. Guarde. El sistema aumentará el inventario y, si es crédito, generará una cuenta por pagar.

### Gestionar proveedores

1. Vaya a **Compras > Proveedores**.
2. Agregue nuevos proveedores con nombre, NIT, teléfono, ciudad, contacto y días de crédito.
3. Edite los existentes según sea necesario.

---

## 8. Clientes y cartera

Rutas: `/clientes`, `/clientes/cartera`

### Clientes

1. Vaya a **Clientes > Listado**.
2. Haga clic en **Nuevo cliente**.
3. Complete nombre, documento, teléfono, email, dirección y ciudad.
4. Guarde.

### Cartera (cuentas por cobrar)

1. Vaya a **Clientes > Cartera**.
2. Verá todas las cuentas pendientes con su valor, abonado, saldo, vencimiento y estado.
3. Haga clic en **Abonar** para registrar un pago parcial o total.
4. Seleccione el método de pago. El abono afectará la caja o banco según corresponda.

Estados de cartera:

- **Pendiente**: sin abonos.
- **Parcial**: con abonos pero saldo pendiente.
- **Pagado**: saldo cancelado.
- **Vencido**: fecha de vencimiento superada.

---

## 9. Finanzas

Rutas: `/finanzas/caja`, `/finanzas/gastos`, `/finanzas/bancos`

### Caja

1. Vaya a **Finanzas > Caja**.
2. Si no hay caja abierta, haga clic en **Abrir caja** e ingrese el fondo inicial.
3. Durante el día el sistema registrará automáticamente las ventas en efectivo.
4. Para registrar retiros o egresos de caja use **Nuevo movimiento**.
5. Al finalizar el día haga clic en **Cerrar caja** e ingrese el valor contado. El sistema calculará la diferencia.

### Gastos

1. Vaya a **Finanzas > Gastos**.
2. Haga clic en **Nuevo gasto**.
3. Seleccione categoría, ingrese descripción, valor, método de pago y comprobante.
4. Guarde.

### Bancos

1. Vaya a **Finanzas > Bancos**.
2. Consulte saldos y movimientos por cuenta.
3. Haga clic en **Nueva cuenta** o **Nuevo movimiento** según corresponda.

---

## 10. Vendedores y comisiones

Ruta: `/ventas/vendedores`

- Consulte el listado de vendedores con sus ventas del mes, comisión y comisión generada.
- Haga clic en **Nuevo vendedor** para dar de alta a un vendedor.
- Vaya a **Metas** para revisar o configurar objetivos de ventas mensuales.

---

## 11. Reportes

Ruta: `/reportes`

El módulo de reportes permite analizar el negocio por período:

- **Ventas del período**: total, unidades, ticket promedio, utilidad y margen bruto.
- **Métodos de pago**: distribución del recaudo.
- **Productos más vendidos**: ranking por unidades, ventas y utilidad.
- **Rentabilidad por categoría**: ventas vs ganancia por categoría.
- **Metas y proyecciones**: cumplimiento diario, mensual y anual.

Use el selector de **Período** para cambiar el rango de análisis.

---

## 12. Configuración

Ruta: `/configuracion`

### Datos de la empresa

1. Vaya a la pestaña **Empresa**.
2. Modifique nombre, NIT, dirección, teléfono, email, ciudad, moneda e IVA.
3. Haga clic en **Guardar cambios**.

### Numeración de documentos

1. Vaya a la pestaña **Documentos**.
2. Ajuste los prefijos y números siguientes para facturas, cotizaciones, pedidos y devoluciones.
3. Guarde los cambios.

### Catálogo, métodos de pago y roles

- Las pestañas de catálogo, métodos de pago y roles muestran la configuración actual.
- Próximamente se habilitará la edición completa de estas listas desde la misma pantalla.

---

## 13. Auditoría

Ruta: `/auditoria`

- Registro de operaciones importantes: ventas, devoluciones, movimientos de inventario, cambios de precios, apertura/cierre de caja, etc.
- Use los filtros para buscar por usuario, módulo o fecha.

---

## 14. Consejos de uso

- **Cierre de caja diario**: cierre la caja al finalizar cada jornada para mantener los cuadres financieros.
- **Stock mínimo**: revise el dashboard para identificar productos que requieren reposición.
- **Ventas a crédito**: registre siempre el cliente antes de hacer una venta a crédito.
- **Devoluciones**: indique siempre el motivo correcto para mantener la trazabilidad.
- **Backup**: haga copias periódicas de la base de datos (`backend/prisma/dev.db` en desarrollo o la BD de producción).

---

## 15. Solución de problemas comunes

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| No puedo iniciar sesión | Credenciales incorrectas | Verifique correo y contraseña. Contacte al administrador si olvidó la clave. |
| No aparecen productos en POS | Backend no responde o sin stock | Verifique que el backend esté activo y que los productos tengan stock. |
| La venta no se guarda | Pagos insuficientes | Asegúrese de que el total cobrado sea igual o mayor al total de la venta. |
| No puedo abrir caja | Ya hay una caja abierta | Cierre la caja anterior antes de abrir una nueva. |
| Los reportes no cambian | Filtro de período no aplicado | Seleccione el período y haga clic en **Analizar**. |

---

Para más detalles técnicos consulte el `README.md` y el `docs/API_CONTRATO.md`.
