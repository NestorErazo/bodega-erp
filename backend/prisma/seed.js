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

const daysAgo = (n, h = 14) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d;
};

const dayStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function main() {
  console.log('Cargando datos de demostración completos...');

  // ---------- RESET (seed reejecutable) ----------
  const resetOrder = [
    'auditLog', 'notification', 'accountReceivablePayment', 'accountReceivable',
    'accountPayablePayment', 'accountPayable', 'bankMovement', 'bankAccount',
    'expense', 'expenseCategory', 'cashMovement', 'cashRegister',
    'returnItem', 'return', 'salePayment', 'saleItem', 'sale',
    'inventoryMovement', 'purchaseItem', 'purchase',
    'productVariant', 'product', 'customer', 'supplier',
    'size', 'color', 'brand', 'subcategory', 'category',
    'setting', 'salesGoal', 'employee', 'permission', 'user', 'role', 'company',
  ];
  for (const model of resetOrder) await prisma[model].deleteMany();

  // ---------- EMPRESA ----------
  const company = await prisma.company.create({
    data: { name: 'Bodega de Ropa SAS', nit: '901.234.567-1', address: 'Cl 5 #4-23, Centro', city: 'Cali', phone: '+57 300 111 2233', email: 'contacto@bodega.com', currency: 'COP' },
  });

  // ---------- ROLES Y PERMISOS ----------
  const roles = {};
  for (const [roleName, perms] of Object.entries(PERMISSIONS)) {
    roles[roleName] = await prisma.role.create({
      data: { name: roleName, description: `${roleName} del sistema`, permissions: { create: perms.map((key) => ({ key, name: key })) } },
    });
  }

  // ---------- USUARIOS ----------
  const admin = await prisma.user.create({
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

  // ---------- CATÁLOGO BASE ----------
  const brandsData = ["Lévi's", 'Adidas', 'Nike', 'Básico', 'Colombina'];
  const sizesData = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colorsData = ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Gris'];
  const categoriesData = [
    { name: 'Camisetas', subs: ['Manga corta', 'Manga larga', 'Deportiva'] },
    { name: 'Pantalones', subs: ['Jeans', 'Deportivos', 'Formales'] },
    { name: 'Chaquetas', subs: ['Bomber', 'Blazer', 'Impermeable'] },
    { name: 'Vestidos', subs: ['Corto', 'Largo', 'Noche'] },
    { name: 'Ropa deportiva', subs: ['Conjunto', 'Top', 'Leggins'] },
    { name: 'Accesorios', subs: ['Gorras', 'Cinturones', 'Medias'] },
  ];

  const brands = {};
  for (const b of brandsData) brands[b] = await prisma.brand.create({ data: { name: b } });
  const sizes = {};
  for (const s of sizesData) sizes[s] = await prisma.size.create({ data: { name: s } });
  const colors = {};
  for (const c of colorsData) colors[c] = await prisma.color.create({ data: { name: c } });

  const categories = {};
  for (const cat of categoriesData) {
    const c = await prisma.category.create({ data: { name: cat.name, description: cat.name } });
    categories[cat.name] = c;
    for (const sub of cat.subs) {
      await prisma.subcategory.create({ data: { name: sub, categoryId: c.id } });
    }
  }

  // ---------- GASTOS: categorías ----------
  const expenseCats = {};
  for (const name of ['Arriendo', 'Servicios públicos', 'Internet', 'Nómina', 'Transporte', 'Publicidad', 'Empaque', 'Mantenimiento', 'Impuestos', 'Comisiones', 'Otros']) {
    expenseCats[name] = await prisma.expenseCategory.create({ data: { name } });
  }

  // ---------- PROVEEDORES ----------
  const suppliersData = [
    { name: 'Textiles del Valle SAS', nit: '900123456-1', phone: '3101234567', email: 'ventas@textilesvalle.com', city: 'Cali', creditDays: 30, contact: 'Juan Pérez' },
    { name: 'Distribuciones Jeans S.A.', nit: '900654321-2', phone: '3159876543', email: 'info@distjeans.com', city: 'Medellín', creditDays: 45, contact: 'María Gómez' },
    { name: 'Moda Sport Ltda', nit: '900111222-3', phone: '3001112233', email: 'contacto@modasport.com', city: 'Bogotá', creditDays: 15, contact: 'José Díaz' },
    { name: 'Hebras & Hilos', nit: '900555666-5', phone: '3148889999', email: 'soporte@hebrayhilos.com', city: 'Barranquilla', creditDays: 30, contact: 'Luz Amparo' },
    { name: 'Acabados Botones & Más', nit: '900333444-4', phone: '3182223344', email: 'pedidos@acabados.com', city: 'Pereira', creditDays: 60, contact: 'Rosa Núñez' },
  ];
  const suppliers = {};
  for (const s of suppliersData) suppliers[s.name] = await prisma.supplier.create({ data: s });

  // ---------- CLIENTES ----------
  const customersData = [
    { name: 'Ana García', document: 'CC 52345678', phone: '3001112233', email: 'ana@mail.com', city: 'Cali' },
    { name: 'Carlos Ruiz', document: 'CC 1011122334', phone: '3156667788', email: 'carlos@mail.com', city: 'Cali' },
    { name: 'María López', document: 'CC 77665544', phone: '3202223344', email: 'maria@mail.com', city: 'Yumbo' },
    { name: 'Jorge Mendoza', document: 'CC 41889911', phone: '3014445566', email: 'jorge@mail.com', city: 'Cali' },
    { name: 'Laura Torres', document: 'CC 1122334455', phone: '3137778899', email: 'laura@mail.com', city: 'Palmira' },
    { name: 'Pedro Sánchez', document: 'CC 555666777', phone: '3163334444', email: 'pedro.s@mail.com', city: 'Cali' },
    { name: 'Diana Ríos', document: 'CC 888777666', phone: '3129990000', email: 'diana@mail.com', city: 'Jamundí' },
    { name: 'Carlos Vidal', document: 'CC 222333444', phone: '3171122334', email: 'vidal@mail.com', city: 'Cali' },
    { name: 'Sofía Ramírez', document: 'CC 777888999', phone: '3180011223', email: 'sofia@mail.com', city: 'Cali' },
    { name: 'Andrés Marín', document: 'CC 333444555', phone: '3192233445', email: 'andres@mail.com', city: 'Bugalagrande' },
    { name: 'Paola Valencia', document: 'CC 666777888', phone: '3124455667', email: 'paola@mail.com', city: 'Cali' },
    { name: 'Ricardo Gómez', document: 'CC 999888777', phone: '3155566778', email: 'ricardo@mail.com', city: 'Cali' },
    { name: 'Carmen Rodríguez', document: 'CC 444555666', phone: '3206677889', email: 'carmen@mail.com', city: 'Buga' },
    { name: 'Felipe Castro', document: 'CC 555888222', phone: '3017788990', email: 'felipe@mail.com', city: 'Cali' },
    { name: 'Valentina Peña', document: 'CC 111222333', phone: '3128899001', email: 'valentina@mail.com', city: 'Candelaria' },
    { name: 'Hugo Salazar', document: 'CC 333666999', phone: '3130011223', email: 'hugo@mail.com', city: 'Palmira' },
    { name: 'Lucía Mora', document: 'CC 222555888', phone: '3002233445', email: 'lucia@mail.com', city: 'Cali' },
    { name: 'Óscar Vélez', document: 'CC 888111444', phone: '3143344556', email: 'oscar@mail.com', city: 'Yumbo' },
    { name: 'Marta Herrera', document: 'CC 777222555', phone: '3154455667', email: 'marta@mail.com', city: 'Cali' },
    { name: 'Diego Torres', document: 'CC 666111444', phone: '3165566778', email: 'diego@mail.com', city: 'Cali' },
  ];
  const customers = {};
  for (const c of customersData) customers[c.name] = await prisma.customer.create({ data: c });

  // ---------- PRODUCTOS ----------
  const demoProducts = [
    { name: 'Camiseta Básica', reference: 'CAM-001', category: 'Camisetas', sub: 'Manga corta', brand: 'Básico', cost: 18000, price: 35000, gender: 'Unisex', stock: 90 },
    { name: 'Camiseta Deportiva DryFit', reference: 'CAM-002', category: 'Camisetas', sub: 'Deportiva', brand: 'Nike', cost: 38000, price: 65000, gender: 'Hombre', stock: 50 },
    { name: 'Camisa Manga Larga', reference: 'CAM-003', category: 'Camisetas', sub: 'Manga larga', brand: 'Básico', cost: 32000, price: 58000, gender: 'Hombre', stock: 36 },
    { name: 'Pantalón Jean Clásico', reference: 'PAN-001', category: 'Pantalones', sub: 'Jeans', brand: "Lévi's", cost: 65000, price: 110000, gender: 'Hombre', stock: 64 },
    { name: 'Pantalón Deportivo Jogger', reference: 'PAN-002', category: 'Pantalones', sub: 'Deportivos', brand: 'Adidas', cost: 45000, price: 85000, gender: 'Hombre', stock: 70 },
    { name: 'Pantalón Formal Dobby', reference: 'PAN-003', category: 'Pantalones', sub: 'Formales', brand: 'Básico', cost: 70000, price: 120000, gender: 'Hombre', stock: 30 },
    { name: 'Jean Mujer Slim', reference: 'PAN-004', category: 'Pantalones', sub: 'Jeans', brand: "Lévi's", cost: 58000, price: 99000, gender: 'Mujer', stock: 45 },
    { name: 'Chaquetas Bomber', reference: 'CHA-001', category: 'Chaquetas', sub: 'Bomber', brand: 'Adidas', cost: 98000, price: 180000, gender: 'Unisex', stock: 24 },
    { name: 'Chaqueta Blazer', reference: 'CHA-002', category: 'Chaquetas', sub: 'Blazer', brand: 'Básico', cost: 85000, price: 160000, gender: 'Hombre', stock: 16 },
    { name: 'Vestido Corto Floral', reference: 'VES-001', category: 'Vestidos', sub: 'Corto', brand: 'Colombina', cost: 40000, price: 75000, gender: 'Mujer', stock: 40 },
    { name: 'Vestido Largo Noche', reference: 'VES-002', category: 'Vestidos', sub: 'Noche', brand: 'Colombina', cost: 88000, price: 165000, gender: 'Mujer', stock: 0 },
    { name: 'Conjunto Deportivo Mujer', reference: 'DEP-001', category: 'Ropa deportiva', sub: 'Conjunto', brand: 'Adidas', cost: 70000, price: 130000, gender: 'Mujer', stock: 28 },
    { name: 'Leggins Deportivos', reference: 'DEP-002', category: 'Ropa deportiva', sub: 'Leggins', brand: 'Nike', cost: 42000, price: 78000, gender: 'Mujer', stock: 55 },
    { name: 'Top Deportivo', reference: 'DEP-003', category: 'Ropa deportiva', sub: 'Top', brand: 'Nike', cost: 25000, price: 48000, gender: 'Mujer', stock: 80 },
    { name: 'Gorra Snapback', reference: 'ACC-001', category: 'Accesorios', sub: 'Gorras', brand: 'Adidas', cost: 22000, price: 42000, gender: 'Unisex', stock: 100 },
    { name: 'Cinturón Cuero', reference: 'ACC-002', category: 'Accesorios', sub: 'Cinturones', brand: 'Básico', cost: 18000, price: 36000, gender: 'Unisex', stock: 90 },
    { name: 'Medias Deportivas (3u)', reference: 'ACC-003', category: 'Accesorios', sub: 'Medias', brand: 'Nike', cost: 15000, price: 28000, gender: 'Unisex', stock: 120 },
    { name: 'Camiseta Estampada Star', reference: 'CAM-004', category: 'Camisetas', sub: 'Manga corta', brand: 'Colombina', cost: 20000, price: 39000, gender: 'Hombre', stock: 66 },
    { name: 'Jean Hombre Recto', reference: 'PAN-005', category: 'Pantalones', sub: 'Jeans', brand: "Lévi's", cost: 62000, price: 105000, gender: 'Hombre', stock: 56 },
    { name: 'Chaqueta Impermeable', reference: 'CHA-003', category: 'Chaquetas', sub: 'Impermeable', brand: 'Nike', cost: 120000, price: 220000, gender: 'Unisex', stock: 6 },
  ];

  const products = [];
  for (const p of demoProducts) {
    const cat = categories[p.category];
    const sub = await prisma.subcategory.findFirst({ where: { name: p.sub } });
    const base = await prisma.product.create({
      data: {
        code: p.reference, reference: p.reference, name: p.name,
        description: `${p.name} - ${p.brand}`, categoryId: cat.id, subcategoryId: sub.id,
        brandId: brands[p.brand].id, supplierId: suppliers['Textiles del Valle SAS'].id,
        gender: p.gender, purchasePrice: p.cost, avgCost: p.cost, salePrice: p.price,
        wholesalePrice: Math.round(p.price * 0.9), promoPrice: Math.round(p.price * 0.95), taxRate: 0,
        stockMin: p.stock > 0 ? Math.max(5, Math.round(p.stock * 0.1)) : 5, stockMax: p.stock * 2,
      },
    });

    // Variantes: 3 colores × 3 tallas con stock distribuido
    const pc = ['Negro', 'Blanco', 'Rojo'].slice(0, p.stock > 0 ? 3 : 2);
    const ps = ['S', 'M', 'L'];
    let remaining = p.stock;
    const variantRecords = [];
    for (const colorName of pc) {
      for (const sizeName of ps) {
        if (pc.length * ps.length === 0) break;
        const totalSlots = pc.length * ps.length;
        const stockHere = p.stock > 0 ? Math.floor(remaining / totalSlots) + (remaining % totalSlots > 0 ? 1 : 0) : 0;
        const finalStock = Math.max(0, Math.min(stockHere, remaining));
        const v = await prisma.productVariant.create({
          data: {
            productId: base.id, sizeId: sizes[sizeName].id, colorId: colors[colorName].id,
            sku: `${p.reference}-${colorName.slice(0, 3).toUpperCase()}-${sizeName}`,
            stock: finalStock, cost: p.cost, price: p.price,
          },
        });
        remaining -= finalStock;
        variantRecords.push(v);
        if (finalStock > 0) {
          await prisma.inventoryMovement.create({
            data: { userId: admin.id, productId: base.id, variantId: v.id, type: 'ENTRADA', quantity: finalStock, cost: p.cost, documentRef: 'INICIAL', reason: 'Inventario inicial' },
          });
        }
      }
    }
    products.push({ ...base, variants: variantRecords, price: p.price, cost: p.cost });
  }

  // ---------- VENDEDORES ----------
  const vendedores = [
    { name: 'Natalia Restrepo', document: 'CC 1011223344', phone: '3000000001', commission: 3 },
    { name: 'Pedro Gutiérrez', document: 'CC 987654321', phone: '3000000002', commission: 2.5 },
    { name: 'Luisa Fernanda Díaz', document: 'CC 1122334455', phone: '3000000003', commission: 2 },
  ];
  for (const v of vendedores) await prisma.employee.create({ data: v });

  // ---------- CAJA ----------
  const caja = await prisma.cashRegister.create({
    data: { name: 'Caja principal', status: 'abierta', openedById: admin.id, openingAmount: 1500000, openedAt: new Date() },
  });

  // ---------- VENTAS HISTÓRICAS ----------
  const methods = ['efectivo', 'efectivo', 'nequi', 'bancolombia', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'daviplata'];
  const clientNames = Object.keys(customers);
  const useCredit = [4, 6, 0, 1, 2, 3, 5, 7, 8, 9, 11, 13, 15];
  let saleNumber = 1000;
  let accountReceivableCounter = 0;

  for (let dayOffset = 0; dayOffset < 40; dayOffset++) {
    if (dayOffset === 1 || dayOffset === 5 || dayOffset === 12 || dayOffset === 19 || dayOffset === 26 || dayOffset === 33 || dayOffset === 39) continue; // sin venta algún día
    const salesCount = (dayOffset === 0 ? 4 : 2 + (Math.random() < 0.4 ? 1 : 0));
    for (let s = 0; s < salesCount; s++) {
      const nItems = 1 + Math.floor(Math.random() * 3);
      const productIdx = Math.floor(Math.random() * products.length);
      const prod = products[productIdx];
      const variant = prod.variants[Math.floor(Math.random() * prod.variants.length)];
      const qty = 1 + Math.floor(Math.random() * 2);
      const price = prod.price;
      const subtotal = price * qty;
      const method = methods[Math.floor(Math.random() * methods.length)];
      const custName = Math.random() < 0.65 ? clientNames[Math.floor(Math.random() * clientNames.length)] : null;
      const customer = custName ? customers[custName] : null;
      const isCredit = method === 'credito' || (customer && useCredit.includes(prod.id % useCredit.length));

      const saleDate = daysAgo(dayOffset);
      const number = `FAC-${saleNumber++}`;

      const sale = await prisma.sale.create({
        data: {
          number, date: saleDate, userId: admin.id, customerId: customer?.id || null,
          subtotal, discount: 0, tax: 0, total: subtotal,
          items: {
            create: [{ productId: prod.id, variantId: variant.id, quantity: qty, price, cost: prod.cost, total: subtotal }],
          },
          payments: { create: [{ method: isCredit ? 'credito' : method, amount: subtotal, cashRegisterId: caja.id }] },
        },
      });

      // Descontar inventario vía movimiento
      await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: Math.max(0, variant.stock - qty) } });
      await prisma.inventoryMovement.create({
        data: { userId: admin.id, productId: prod.id, variantId: variant.id, type: 'SALIDA', quantity: qty, cost: prod.cost, documentRef: number, reason: 'Venta POS' },
      });

      // Cuenta por cobrar si es crédito
      if (isCredit && customer) {
        const receivedForThisCust = { A: 0, D: 0, O: 0 };
        const partialPaid = Math.random() < 0.4;
        const paid = partialPaid ? Math.round(subtotal * 0.5) : 0;
        accountReceivableCounter++;
        const dueDate = new Date(saleDate); dueDate.setDate(dueDate.getDate() + 15);
        const ar = await prisma.accountReceivable.create({
          data: {
            customerId: customer.id, saleId: sale.id, date: saleDate, dueDate, amount: subtotal,
            paid, status: paid >= subtotal ? 'pagado' : paid > 0 ? 'parcial' : 'pendiente',
          },
        });
        if (paid > 0) {
          await prisma.accountReceivablePayment.create({ data: { accountId: ar.id, amount: paid, method: 'efectivo' } });
        }
      }
    }
  }

  // ---------- COMPRAS HISTÓRICAS ----------
  const comprasDemo = [
    { num: 'OC-040', prov: 'Textiles del Valle SAS', days: 3, credit: false, lines: [{ p: 'CAM-002', q: 80, c: 37000 }, { p: 'CAM-001', q: 120, c: 17500 }] },
    { num: 'OC-039', prov: 'Distribuciones Jeans S.A.', days: 7, credit: true, lines: [{ p: 'PAN-001', q: 50, c: 63000 }, { p: 'PAN-005', q: 40, c: 60000 }] },
    { num: 'OC-038', prov: 'Moda Sport Ltda', days: 11, credit: true, lines: [{ p: 'PAN-002', q: 60, c: 44000 }, { p: 'DEP-002', q: 40, c: 40000 }] },
    { num: 'OC-037', prov: 'Textiles del Valle SAS', days: 18, credit: false, lines: [{ p: 'VES-001', q: 30, c: 38000 }] },
    { num: 'OC-036', prov: 'Hebras & Hilos', days: 25, credit: false, lines: [{ p: 'ACC-002', q: 60, c: 17000 }, { p: 'ACC-003', q: 80, c: 14000 }] },
  ];

  for (const oc of comprasDemo) {
    const prov = suppliers[oc.prov];
    let subtotal = 0;
    const items = [];
    for (const line of oc.lines) {
      const prod = products.find((p) => p.reference === line.p);
      if (!prod) continue;
      const lineTotal = line.q * line.c;
      subtotal += lineTotal;
      items.push({ productId: prod.id, quantity: line.q, cost: line.c, taxRate: 0, total: lineTotal });
    }
    const purchDate = daysAgo(oc.days);
    const purchase = await prisma.purchase.create({
      data: {
        number: oc.num, date: purchDate, supplierId: prov.id, userId: admin.id,
        status: oc.credit ? 'recibida' : 'pagada', paymentType: oc.credit ? 'credito' : 'contado',
        subtotal, discount: 0, tax: 0, freight: 0, total: subtotal,
        items: { create: items.map((i) => ({ ...i, variantId: null })) },
      },
    });

    // Actualizar inventario y costo promedio simple
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      const variants = await prisma.productVariant.findMany({ where: { productId: item.productId } });
      for (const v of variants) {
        await prisma.productVariant.update({ where: { id: v.id }, data: { stock: v.stock + Math.floor(item.quantity / variants.length), cost: item.cost } });
      }
      await prisma.inventoryMovement.create({
        data: { userId: admin.id, productId: item.productId, type: 'ENTRADA', quantity: item.quantity, cost: item.cost, documentRef: oc.num, reason: 'Compra a proveedor' },
      });
      const avg = prod.avgCost;
      const newQty = variants.reduce((s, v2) => s + v2.stock, 0);
      await prisma.product.update({ where: { id: item.productId }, data: { avgCost: avg, purchasePrice: item.cost } });
    }

    if (oc.credit) {
      const due = new Date(purchDate); due.setDate(due.getDate() + prov.creditDays);
      await prisma.accountPayable.create({
        data: {
          supplierId: prov.id, purchaseId: purchase.id, date: purchDate, dueDate: due, amount: subtotal,
          paid: oc.prov === 'Hebras & Hilos' ? 0 : Math.round(subtotal * 0.4), status: oc.prov === 'Hebras & Hilos' ? 'pendiente' : 'parcial',
        },
      });
    }
  }

  // ---------- GASTOS ----------
  const gastos = [
    { cat: 'Arriendo', days: 2, desc: 'Local principal', val: 2500000, meth: 'transferencia', doc: 'REC-0001' },
    { cat: 'Servicios públicos', days: 4, desc: 'Energía y agua', val: 780000, meth: 'pse', doc: 'REC-0002' },
    { cat: 'Internet', days: 6, desc: 'Fibra 300MB', val: 89000, meth: 'tarjeta_debito', doc: 'REC-0003' },
    { cat: 'Nómina', days: 8, desc: 'Vendedores (3)', val: 4200000, meth: 'transferencia', doc: 'REC-0004' },
    { cat: 'Publicidad', days: 10, desc: 'Redes sociales', val: 350000, meth: 'tarjeta_credito', doc: 'REC-0005' },
    { cat: 'Empaque', days: 13, desc: 'Bolsas y cajas', val: 145000, meth: 'efectivo', doc: 'REC-0006' },
    { cat: 'Transporte', days: 16, desc: 'Recogida mercancía', val: 220000, meth: 'efectivo', doc: 'REC-0007' },
    { cat: 'Mantenimiento', days: 21, desc: 'Estanterías', val: 180000, meth: 'transferencia', doc: 'REC-0008' },
    { cat: 'Comisiones', days: 30, desc: 'Comisiones vendedores', val: 575500, meth: 'transferencia', doc: 'REC-0009' },
  ];
  for (const g of gastos) {
    await prisma.expense.create({
      data: {
        date: daysAgo(g.days), categoryId: expenseCats[g.cat].id, description: g.desc, amount: g.val,
        method: g.meth, document: g.doc, userId: admin.id, companyId: company.id,
      },
    });
  }

  // ---------- BANCOS ----------
  const banAhorros = await prisma.bankAccount.create({ data: { bank: 'Bancolombia', account: 'Cuenta Ahorros 123-456', type: 'Ahorros', initialBalance: 8000000 } });
  const banNequi = await prisma.bankAccount.create({ data: { bank: 'Nequi', account: '300 111 2233', type: 'Digital', initialBalance: 2000000 } });
  const bankMovs = [
    { b: banAhorros, days: 2, type: 'ingreso', concept: 'Consignación ventas', amount: 4500000 },
    { b: banNequi, days: 3, type: 'ingreso', concept: 'Recaudo Nequi', amount: 1900000 },
    { b: banAhorros, days: 8, type: 'egreso', concept: 'Pago proveedor Textiles del Valle', amount: -9800000 },
    { b: banAhorros, days: 15, type: 'ingreso', concept: 'Consignación ventas', amount: 3200000 },
    { b: banNequi, days: 20, type: 'ingreso', concept: 'Recaudo Nequi', amount: 1100000 },
  ];
  for (const m of bankMovs) {
    await prisma.bankMovement.create({
      data: { bankAccountId: m.b.id, date: daysAgo(m.days), type: m.type, concept: m.concept, amount: m.amount },
    });
  }

  // ---------- METAS ----------
  await prisma.salesGoal.createMany({
    data: [
      { period: 'diaria', amount: 1200000, startDate: new Date() },
      { period: 'mensual', amount: 30000000, startDate: new Date() },
      { period: 'anual', amount: 360000000, startDate: new Date() },
    ],
  });

  // ---------- CONFIGURACIÓN ----------
  await prisma.setting.createMany({
    data: [
      { key: 'company.name', value: 'Bodega de Ropa SAS', companyId: company.id },
      { key: 'company.nit', value: '901.234.567-1', companyId: company.id },
      { key: 'currency', value: 'COP', companyId: company.id },
      { key: 'iva', value: '19', companyId: company.id },
      { key: 'document.factura', value: 'FAC-1001', companyId: company.id },
    ],
  });

  // ---------- AUDITORÍA ----------
  await prisma.auditLog.create({
    data: { userId: admin.id, action: 'SEED', entity: 'system', details: 'Datos de demostración cargados correctamente' },
  });

  console.log('✅ Datos demo cargados:');
  console.log(`  · ${Object.keys(products).length} productos con variantes`);
  console.log(`  · ${Object.keys(customers).length} clientes`);
  console.log(`  · ${Object.keys(suppliers).length} proveedores`);
  console.log(`  · ${(await prisma.sale.count())} ventas históricas`);
  console.log(`  · ${(await prisma.purchase.count())} compras`);
  console.log(`  · ${(await prisma.expense.count())} gastos`);
  console.log(`  · ${(await prisma.accountReceivable.count())} cuentas por cobrar`);
  console.log(`  · ${(await prisma.accountPayable.count())} cuentas por pagar`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());