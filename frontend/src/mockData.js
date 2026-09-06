// Datos de demostración del frontend. El backend definitivo (hosting) los reemplazará.

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d;
};

export const mockVentas = [
  { id: 1001, fecha: day(0), cliente: 'Cliente mostrador', vendedor: 'Natalia', metodo: 'Efectivo', items: '2 · Camiseta Básica, Gorra', total: 77000, tipo: 'FAC' },
  { id: 1000, fecha: day(0), cliente: 'Ana García', vendedor: 'Natalia', metodo: 'Nequi', items: '1 · Jean Mujer Slim', total: 99000, tipo: 'FAC' },
  { id: 999, fecha: day(0), cliente: 'Cliente mostrador', vendedor: 'Pedro', metodo: 'Tarjeta débito', items: '3 · Medias, Top deportivo', total: 124000, tipo: 'FAC' },
  { id: 998, fecha: day(1), cliente: 'Carlos Ruiz', vendedor: 'Pedro', metodo: 'Transferencia', items: '1 · Chaqueta Bomber', total: 180000, tipo: 'FAC' },
  { id: 997, fecha: day(1), cliente: 'Cliente mostrador', vendedor: 'Natalia', metodo: 'Efectivo', items: '1 · Pantalón Jogger', total: 85000, tipo: 'FAC' },
  { id: 996, fecha: day(2), cliente: 'María López', vendedor: 'Natalia', metodo: 'Bancolombia', items: '2 · Vestido Floral, Cinturón', total: 111000, tipo: 'FAC' },
  { id: 995, fecha: day(3), cliente: 'Cliente mostrador', vendedor: 'Pedro', metodo: 'Efectivo', items: '1 · Leggins', total: 78000, tipo: 'FAC' },
  { id: 994, fecha: day(4), cliente: 'Jorge Mendoza', vendedor: 'Pedro', metodo: 'Crédito', items: '2 · Jean Clásico', total: 220000, tipo: 'FAC', saldo: 220000 },
  { id: 993, fecha: day(5), cliente: 'Cliente mostrador', vendedor: 'Natalia', metodo: 'Efectivo', items: '4 · Camiseta Estampada', total: 156000, tipo: 'FAC' },
  { id: 992, fecha: day(6), cliente: 'Laura Torres', vendedor: 'Natalia', metodo: 'Nequi', items: '1 · Conjunto Deportivo', total: 130000, tipo: 'FAC' },
  { id: 991, fecha: day(7), cliente: 'Cliente mostrador', vendedor: 'Pedro', metodo: 'Efectivo', items: '1 · Gorra, 2 Medias', total: 98000, tipo: 'FAC' },
  { id: 990, fecha: day(9), cliente: 'Carlos Ruiz', vendedor: 'Pedro', metodo: 'Tarjeta crédito', items: '1 · Blazer', total: 160000, tipo: 'FAC' },
  { id: 989, fecha: day(11), cliente: 'Cliente mostrador', vendedor: 'Natalia', metodo: 'Efectivo', items: '3 · Camiseta DryFit', total: 195000, tipo: 'FAC' },
  { id: 988, fecha: day(14), cliente: 'Ana García', vendedor: 'Natalia', metodo: 'Transferencia', items: '2 · Vestido Noche', total: 330000, tipo: 'FAC' },
  { id: 987, fecha: day(16), cliente: 'Cliente mostrador', vendedor: 'Pedro', metodo: 'Efectivo', items: '1 · Jogger, 1 Camiseta', total: 120000, tipo: 'FAC' },
  { id: 986, fecha: day(20), cliente: 'Jorge Mendoza', vendedor: 'Pedro', metodo: 'Crédito', items: '5 · Cinturones', total: 180000, tipo: 'FAC', saldo: 90000 },
  { id: 985, fecha: day(23), cliente: 'Cliente mostrador', vendedor: 'Natalia', metodo: 'Efectivo', items: '2 · Jean Mujer', total: 198000, tipo: 'FAC' },
  { id: 984, fecha: day(28), cliente: 'Laura Torres', vendedor: 'Natalia', metodo: 'Efectivo', items: '1 · Impermeable', total: 220000, tipo: 'FAC' },
  { id: 983, fecha: day(30), cliente: 'Cliente mostrador', vendedor: 'Pedro', metodo: 'Daviplata', items: '4 · Medias', total: 112000, tipo: 'FAC' },
  { id: 982, fecha: day(35), cliente: 'Carlos Ruiz', vendedor: 'Pedro', metodo: 'Efectivo', items: '1 · Jean Recto, 1 Camiseta', total: 144000, tipo: 'FAC' },
];

export const mockVentaDetalle = [
  { producto: 'Camiseta Básica', talla: 'M', color: 'Negro', cantidad: 2, precio: 35000, descuento: 0, total: 70000 },
  { producto: 'Gorra Snapback', talla: 'U', color: 'Azul', cantidad: 1, precio: 42000, descuento: 10000, total: 32000 },
];

export const mockProveedores = [
  { id: 1, nombre: 'Textiles del Valle SAS', nit: '900123456-1', telefono: '3101234567', email: 'ventas@textilesvalle.com', ciudad: 'Cali', diasCredito: 30, estado: 'Activo', compras: 24, deuda: 0 },
  { id: 2, nombre: 'Distribuciones Jeans S.A.', nit: '900654321-2', telefono: '3159876543', email: 'info@distjeans.com', ciudad: 'Medellín', diasCredito: 45, estado: 'Activo', compras: 31, deuda: 4500000 },
  { id: 3, nombre: 'Moda Sport Ltda', nit: '900111222-3', telefono: '3001112233', email: 'contacto@modasport.com', ciudad: 'Bogotá', diasCredito: 15, estado: 'Activo', compras: 12, deuda: 980000 },
  { id: 4, nombre: 'Acabados Botones & Más', nit: '900333444-4', telefono: '3182223344', email: 'pedidos@acabados.com', ciudad: 'Pereira', diasCredito: 60, estado: 'Inactivo', compras: 5, deuda: 0 },
  { id: 5, nombre: 'Hebras & Hilos', nit: '900555666-5', telefono: '3148889999', email: 'soporte@hebrayhilos.com', ciudad: 'Barranquilla', diasCredito: 30, estado: 'Activo', compras: 8, deuda: 2300000 },
];

export const mockCompras = [
  { id: 'OC-040', proveedor: 'Textiles del Valle SAS', fecha: day(2), estado: 'Recibida', total: 9800000, items: 'Camiseta DryFit ×150 · Básica ×300' },
  { id: 'OC-039', proveedor: 'Distribuciones Jeans S.A.', fecha: day(6), estado: 'Pendiente', total: 12400000, items: 'Jean Clásico ×120 · Jean Recto ×90' },
  { id: 'OC-038', proveedor: 'Moda Sport Ltda', fecha: day(10), estado: 'Recibida', total: 5400000, items: 'Jogger ×100 · Leggins ×80' },
  { id: 'OC-037', proveedor: 'Textiles del Valle SAS', fecha: day(15), estado: 'Pagada', total: 6200000, items: 'Vestido Floral ×120' },
  { id: 'OC-036', proveedor: 'Hebras & Hilos', fecha: day(21), estado: 'Recibida', total: 2100000, items: 'Cinturón ×100 · Medias ×200' },
];

export const mockClientes = [
  { id: 1, nombre: 'Ana García', documento: 'CC 52345678', telefono: '3001112233', email: 'ana@mail.com', ciudad: 'Cali', compras: 12, total: 4200000, ultima: day(0), deuda: 0 },
  { id: 2, nombre: 'Carlos Ruiz', documento: 'CC 1011122334', telefono: '3156667788', email: 'carlos@mail.com', ciudad: 'Cali', compras: 18, total: 6800000, ultima: day(9), deuda: 0 },
  { id: 3, nombre: 'María López', documento: 'CC 77665544', telefono: '3202223344', email: 'maria@mail.com', ciudad: 'Yumbo', compras: 7, total: 2300000, ultima: day(2), deuda: 0 },
  { id: 4, nombre: 'Jorge Mendoza', documento: 'CC 41889911', telefono: '3014445566', email: 'jorge@mail.com', ciudad: 'Cali', compras: 15, total: 8900000, ultima: day(4), deuda: 310000 },
  { id: 5, nombre: 'Laura Torres', documento: 'CC 1122334455', telefono: '3137778899', email: 'laura@mail.com', ciudad: 'Palmira', compras: 9, total: 3500000, ultima: day(6), deuda: 0 },
  { id: 6, nombre: 'Pedro Sánchez', documento: 'CC 555666777', telefono: '3163334444', email: 'pedro.s@mail.com', ciudad: 'Cali', compras: 4, total: 1200000, ultima: day(22), deuda: 0 },
  { id: 7, nombre: 'Diana Ríos', documento: 'CC 888777666', telefono: '3129990000', email: 'diana@mail.com', ciudad: 'Jamundí', compras: 11, total: 5600000, ultima: day(12), deuda: 500000 },
];

export const mockCartera = [
  { id: 1, cliente: 'Jorge Mendoza', documento: 'FAC-994', vencimiento: day(10), valor: 220000, abonado: 0, saldo: 220000, estado: 'Pendiente' },
  { id: 2, cliente: 'Jorge Mendoza', documento: 'FAC-986', vencimiento: day(-2), valor: 180000, abonado: 90000, saldo: 90000, estado: 'Vencido' },
  { id: 3, cliente: 'Diana Ríos', documento: 'FAC-975', vencimiento: day(-5), valor: 500000, abonado: 0, saldo: 500000, estado: 'Vencido' },
  { id: 4, cliente: 'Carlos Ruiz', documento: 'FAC-968', vencimiento: day(20), valor: 300000, abonado: 150000, saldo: 150000, estado: 'Parcial' },
];

export const mockCaja = { apertura: 1500000, ingresos: 12500000, egresos: 3200000, cierreEsperado: 10800000, cierreReal: 10750000, diferencia: -5000 };

export const mockGastos = [
  { id: 1, fecha: day(1), categoria: 'Arriendo', descripcion: 'Local principal', valor: 2500000, metodo: 'Transferencia', comprobante: 'REC-0001' },
  { id: 2, fecha: day(3), categoria: 'Servicios públicos', descripcion: 'Energía y agua', valor: 780000, metodo: 'PSE', comprobante: 'REC-0002' },
  { id: 3, fecha: day(5), categoria: 'Internet', descripcion: 'Fibra óptica 300MB', valor: 89000, metodo: 'Débito', comprobante: 'REC-0003' },
  { id: 4, fecha: day(7), categoria: 'Nómina', descripcion: 'Vendedores (2)', valor: 4200000, metodo: 'Transferencia', comprobante: 'REC-0004' },
  { id: 5, fecha: day(9), categoria: 'Publicidad', descripcion: 'Facebook Ads', valor: 350000, metodo: 'Tarjeta crédito', comprobante: 'REC-0005' },
  { id: 6, fecha: day(12), categoria: 'Empaque', descripcion: 'Bolsas y cajas', valor: 145000, metodo: 'Efectivo', comprobante: 'REC-0006' },
  { id: 7, fecha: day(15), categoria: 'Transporte', descripcion: 'Recogida mercancía', valor: 220000, metodo: 'Efectivo', comprobante: 'REC-0007' },
  { id: 8, fecha: day(20), categoria: 'Mantenimiento', descripcion: 'Estanterías', valor: 180000, metodo: 'Transferencia', comprobante: 'REC-0008' },
];

export const mockBancos = [
  { id: 1, banco: 'Bancolombia', cuenta: 'Cuenta Ahorros 123', tipo: 'Ahorros', saldo: 8500000, movimientos: 24 },
  { id: 2, banco: 'Nequi', cuenta: 'Nequi 3001112233', tipo: 'Digital', saldo: 2400000, movimientos: 41 },
];

export const mockVendedores = [
  { id: 1, nombre: 'Natalia Restrepo', documento: 'CC 1011223344', telefono: '3000000001', comision: 3, estado: 'Activo', ventasMes: 9800000, comisionGenerada: 294000 },
  { id: 2, nombre: 'Pedro Gutiérrez', documento: 'CC 987654321', telefono: '3000000002', comision: 2.5, estado: 'Activo', ventasMes: 7900000, comisionGenerada: 197500 },
  { id: 3, nombre: 'Luisa Fernanda Díaz', documento: 'CC 1122334455', telefono: '3000000003', comision: 2, estado: 'Activo', ventasMes: 4200000, comisionGenerada: 84000 },
];

export const mockMetas = {
  diaria: { meta: 1200000, vendido: 864000 },
  mensual: { meta: 30000000, vendido: 24500000 },
  anual: { meta: 360000000, vendido: 198000000 },
};

// Series para gráficos de reportes
export const mockSerieVentas = Array.from({ length: 12 }, (_, i) => {
  const month = new Date();
  month.setMonth(month.getMonth() - (11 - i));
  const base = 18000000 + i * 1200000 + (i % 3) * 2500000;
  return {
    mes: month.toLocaleDateString('es-CO', { month: 'short' }),
    year: month.getFullYear(),
    ventas: Math.round(base / 1000) * 1000,
    unidades: 180 + i * 15,
    facturas: 60 + i,
    utilidad: Math.round(base * 0.35),
  };
});

export const mockMetodosPago = [
  { metodo: 'Efectivo', valor: 14800000 },
  { metodo: 'Transferencia', valor: 6200000 },
  { metodo: 'Nequi', valor: 4900000 },
  { metodo: 'Bancolombia', valor: 2800000 },
  { metodo: 'Tarjeta débito', valor: 3600000 },
  { metodo: 'Tarjeta crédito', valor: 2100000 },
  { metodo: 'Crédito', valor: 1900000 },
];

export const mockProductosTop = [
  { producto: 'Camiseta Básica', unidades: 184, ventas: 6440000, utilidad: 3128000 },
  { producto: 'Jean Clásico', unidades: 96, ventas: 10560000, utilidad: 3840000 },
  { producto: 'Gorra Snapback', unidades: 140, ventas: 5880000, utilidad: 2800000 },
  { producto: 'Leggins Deportivos', unidades: 88, ventas: 6864000, utilidad: 3168000 },
  { producto: 'Pantalón Jogger', unidades: 61, ventas: 5185000, utilidad: 2440000 },
];

export const mockRentabilidad = {
  porProducto: mockProductosTop.map((p) => ({ ...p, margen: Math.round((p.utilidad / p.ventas) * 100) })),
  porCategoria: [
    { categoria: 'Camisetas', ventas: 12400000, costo: 6200000, ganancia: 6200000, margen: 50 },
    { categoria: 'Pantalones', ventas: 22300000, costo: 13900000, ganancia: 8400000, margen: 38 },
    { categoria: 'Chaquetas', ventas: 11200000, costo: 6400000, ganancia: 4800000, margen: 43 },
    { categoria: 'Vestidos', ventas: 8400000, costo: 4600000, ganancia: 3800000, margen: 45 },
    { categoria: 'Ropa deportiva', ventas: 9800000, costo: 5200000, ganancia: 4600000, margen: 47 },
    { categoria: 'Accesorios', ventas: 6700000, costo: 3100000, ganancia: 3600000, margen: 54 },
  ],
};

export const mockAuditoria = [
  { id: 1, fecha: day(0), usuario: 'Administrador', accion: 'Modificó el precio del producto CAМ-001 de $32.000 a $35.000', modulo: 'Productos', detalle: 'salePrice 32000 → 35000' },
  { id: 2, fecha: day(0), usuario: 'Natalia Restrepo', accion: 'Registró la venta FAC-1001', modulo: 'Ventas', detalle: 'Total $77.000' },
  { id: 3, fecha: day(1), usuario: 'Administrador', accion: 'Anuló la venta FAC-0990', modulo: 'Ventas', detalle: 'Causa: devolución cliente' },
  { id: 4, fecha: day(2), usuario: 'Pedro Gutiérrez', accion: 'Registró salida de inventario', modulo: 'Inventario', detalle: 'Gorra ×20, motivo: consumo interno' },
  { id: 5, fecha: day(3), usuario: 'Administrador', accion: 'Recibió la compra OC-040', modulo: 'Compras', detalle: '+150 Camiseta DryFit' },
  { id: 6, fecha: day(5), usuario: 'Contabilidad Demo', accion: 'Registró gasto de arriendo', modulo: 'Gastos', detalle: '$2.500.000' },
  { id: 7, fecha: day(8), usuario: 'Administrador', accion: 'Creó el usuario vendedor L. Díaz', modulo: 'Usuarios', detalle: 'rol vendedor' },
];

export const mockMovimientosBancarios = [
  { id: 1, fecha: day(1), banco: 'Bancolombia', tipo: 'Ingreso', concepto: 'Consignación ventas', valor: 4500000 },
  { id: 2, fecha: day(3), banco: 'Nequi', tipo: 'Ingreso', concepto: 'Recaudo Nequi', valor: 1900000 },
  { id: 3, fecha: day(5), banco: 'Bancolombia', tipo: 'Egreso', concepto: 'Pago proveedor Textiles del Valle', valor: -9800000 },
  { id: 4, fecha: day(7), banco: 'Bancolombia', tipo: 'Egreso', concepto: 'Nómina', valor: -4200000 },
  { id: 5, fecha: day(10), banco: 'Bancolombia', tipo: 'Ingreso', concepto: 'Consignación ventas', valor: 3200000 },
  { id: 6, fecha: day(12), banco: 'Nequi', tipo: 'Ingreso', concepto: 'Recaudo Nequi', valor: 1100000 },
  { id: 7, fecha: day(14), banco: 'Bancolombia', tipo: 'Transferencia', concepto: 'A caja principal', valor: -2000000 },
];

export const mockNotificaciones = [
  { tipo: 'stock_bajo', mensaje: 'Chaqueta Impermeable: quedan 9 unidades (mín. 10)', fecha: day(0) },
  { tipo: 'agotado', mensaje: 'Vestido Largo Noche: agotado', fecha: day(0) },
  { tipo: 'cartera', mensaje: 'Diana Ríos tiene 1 factura vencida ($500.000)', fecha: day(1) },
  { tipo: 'cuenta_pagar', mensaje: 'Moda Sport Ltda vence en 3 días ($980.000)', fecha: day(2) },
  { tipo: 'meta', mensaje: 'Meta mensual al 81,67% — faltan $5.500.000', fecha: day(3) },
];