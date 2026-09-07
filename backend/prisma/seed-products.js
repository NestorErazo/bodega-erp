// Seed de 70 productos de prueba para produccion.
// Se ejecuta una sola vez. Verifica si ya existen productos para no duplicar.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const productosData = [
  // Camisetas
  { name: 'Camiseta Básica Algodón', category: 'Camisetas', subcategory: 'Manga corta', brand: 'Básico', price: 45000, cost: 22000, gender: 'Unisex', season: 'Verano' },
  { name: 'Camiseta Estampada Urbana', category: 'Camisetas', subcategory: 'Manga corta', brand: 'Nike', price: 68000, cost: 34000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Camiseta Deportiva DryFit', category: 'Camisetas', subcategory: 'Deportiva', brand: 'Adidas', price: 75000, cost: 38000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Camiseta Manga Larga Clásica', category: 'Camisetas', subcategory: 'Manga larga', brand: 'Básico', price: 52000, cost: 26000, gender: 'Unisex', season: 'Invierno' },
  { name: 'Camiseta Polo Piqué', category: 'Camisetas', subcategory: 'Manga corta', brand: "Lévi's", price: 89000, cost: 45000, gender: 'Masculino', season: 'Todo el año' },
  { name: 'Camiseta Crop Top', category: 'Camisetas', subcategory: 'Manga corta', brand: 'Colombina', price: 39000, cost: 19000, gender: 'Femenino', season: 'Verano' },
  { name: 'Camiseta Oversize', category: 'Camisetas', subcategory: 'Manga corta', brand: 'Nike', price: 72000, cost: 36000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Camiseta Estampada Floral', category: 'Camisetas', subcategory: 'Manga corta', brand: 'Colombina', price: 49000, cost: 24000, gender: 'Femenino', season: 'Primavera' },
  { name: 'Camiseta Manga Larga Térmica', category: 'Camisetas', subcategory: 'Manga larga', brand: 'Básico', price: 58000, cost: 29000, gender: 'Unisex', season: 'Invierno' },
  { name: 'Camiseta Deportiva Compresión', category: 'Camisetas', subcategory: 'Deportiva', brand: 'Adidas', price: 82000, cost: 41000, gender: 'Masculino', season: 'Todo el año' },
  { name: 'Camiseta Infantil Estampada', category: 'Camisetas', subcategory: 'Manga corta', brand: 'Colombina', price: 32000, cost: 16000, gender: 'Infantil', season: 'Todo el año' },
  { name: 'Camiseta Polo Mujer', category: 'Camisetas', subcategory: 'Manga corta', brand: "Lévi's", price: 79000, cost: 40000, gender: 'Femenino', season: 'Todo el año' },

  // Pantalones
  { name: 'Jean Clásico Straight', category: 'Pantalones', subcategory: 'Jeans', brand: "Lévi's", price: 145000, cost: 75000, gender: 'Masculino', season: 'Todo el año' },
  { name: 'Jean Skinny Mujer', category: 'Pantalones', subcategory: 'Jeans', brand: "Lévi's", price: 135000, cost: 68000, gender: 'Femenino', season: 'Todo el año' },
  { name: 'Pantalón Deportivo Jogger', category: 'Pantalones', subcategory: 'Deportivos', brand: 'Nike', price: 110000, cost: 55000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Pantalón Deportivo Mujer', category: 'Pantalones', subcategory: 'Deportivos', brand: 'Adidas', price: 105000, cost: 52000, gender: 'Femenino', season: 'Todo el año' },
  { name: 'Pantalón Formal Vestir', category: 'Pantalones', subcategory: 'Formales', brand: 'Básico', price: 125000, cost: 62000, gender: 'Masculino', season: 'Todo el año' },
  { name: 'Pantalón Cargo', category: 'Pantalones', subcategory: 'Formales', brand: 'Nike', price: 118000, cost: 59000, gender: 'Masculino', season: 'Otoño' },
  { name: 'Jean Mom Fit', category: 'Pantalones', subcategory: 'Jeans', brand: 'Colombina', price: 128000, cost: 64000, gender: 'Femenino', season: 'Todo el año' },
  { name: 'Pantalón Chino', category: 'Pantalones', subcategory: 'Formales', brand: "Lévi's", price: 115000, cost: 57000, gender: 'Masculino', season: 'Primavera' },
  { name: 'Leggins Básico Negro', category: 'Pantalones', subcategory: 'Deportivos', brand: 'Adidas', price: 65000, cost: 32000, gender: 'Femenino', season: 'Todo el año' },
  { name: 'Jean Niño Ajustado', category: 'Pantalones', subcategory: 'Jeans', brand: 'Colombina', price: 78000, cost: 39000, gender: 'Infantil', season: 'Todo el año' },
  { name: 'Pantalón Palazzo', category: 'Pantalones', subcategory: 'Formales', brand: 'Básico', price: 98000, cost: 49000, gender: 'Femenino', season: 'Verano' },

  // Chaquetas
  { name: 'Chaqueta Bomber Nylon', category: 'Chaquetas', subcategory: 'Bomber', brand: 'Nike', price: 195000, cost: 98000, gender: 'Unisex', season: 'Otoño' },
  { name: 'Chaqueta Blazer Elegante', category: 'Chaquetas', subcategory: 'Blazer', brand: 'Básico', price: 175000, cost: 88000, gender: 'Femenino', season: 'Todo el año' },
  { name: 'Chaqueta Impermeable', category: 'Chaquetas', subcategory: 'Impermeable', brand: 'Adidas', price: 210000, cost: 105000, gender: 'Unisex', season: 'Invierno' },
  { name: 'Chaqueta Cuero Sintético', category: 'Chaquetas', subcategory: 'Bomber', brand: "Lévi's", price: 230000, cost: 115000, gender: 'Masculino', season: 'Invierno' },
  { name: 'Blazer Formal Hombre', category: 'Chaquetas', subcategory: 'Blazer', brand: 'Básico', price: 185000, cost: 92000, gender: 'Masculino', season: 'Todo el año' },
  { name: 'Chaqueta Jean Clásica', category: 'Chaquetas', subcategory: 'Bomber', brand: "Lévi's", price: 165000, cost: 82000, gender: 'Unisex', season: 'Otoño' },
  { name: 'Chaqueta Acolchada Ligera', category: 'Chaquetas', subcategory: 'Impermeable', brand: 'Nike', price: 220000, cost: 110000, gender: 'Unisex', season: 'Invierno' },

  // Vestidos
  { name: 'Vestido Corto Verano', category: 'Vestidos', subcategory: 'Corto', brand: 'Colombina', price: 115000, cost: 57000, gender: 'Femenino', season: 'Verano' },
  { name: 'Vestido Largo Elegante', category: 'Vestidos', subcategory: 'Largo', brand: 'Básico', price: 185000, cost: 92000, gender: 'Femenino', season: 'Primavera' },
  { name: 'Vestido Noche Encaje', category: 'Vestidos', subcategory: 'Noche', brand: 'Colombina', price: 245000, cost: 122000, gender: 'Femenino', season: 'Todo el año' },
  { name: 'Vestido Casual Estampado', category: 'Vestidos', subcategory: 'Corto', brand: 'Nike', price: 98000, cost: 49000, gender: 'Femenino', season: 'Verano' },
  { name: 'Vestido Midi Floral', category: 'Vestidos', subcategory: 'Largo', brand: 'Colombina', price: 145000, cost: 72000, gender: 'Femenino', season: 'Primavera' },
  { name: 'Vestido Playero', category: 'Vestidos', subcategory: 'Corto', brand: 'Básico', price: 85000, cost: 42000, gender: 'Femenino', season: 'Verano' },

  // Ropa deportiva
  { name: 'Conjunto Deportivo Hombre', category: 'Ropa deportiva', subcategory: 'Conjunto', brand: 'Nike', price: 165000, cost: 82000, gender: 'Masculino', season: 'Todo el año' },
  { name: 'Conjunto Deportivo Mujer', category: 'Ropa deportiva', subcategory: 'Conjunto', brand: 'Adidas', price: 170000, cost: 85000, gender: 'Femenino', season: 'Todo el año' },
  { name: 'Top Deportivo', category: 'Ropa deportiva', subcategory: 'Top', brand: 'Nike', price: 62000, cost: 31000, gender: 'Femenino', season: 'Todo el año' },
  { name: 'Leggins Deportivo Estampado', category: 'Ropa deportiva', subcategory: 'Leggins', brand: 'Adidas', price: 78000, cost: 39000, gender: 'Femenino', season: 'Todo el año' },
  { name: 'Short Deportivo Hombre', category: 'Ropa deportiva', subcategory: 'Conjunto', brand: 'Nike', price: 58000, cost: 29000, gender: 'Masculino', season: 'Verano' },
  { name: 'Short Deportivo Mujer', category: 'Ropa deportiva', subcategory: 'Leggins', brand: 'Adidas', price: 55000, cost: 27000, gender: 'Femenino', season: 'Verano' },
  { name: 'Buzo Deportivo Capucha', category: 'Ropa deportiva', subcategory: 'Conjunto', brand: 'Nike', price: 135000, cost: 67000, gender: 'Unisex', season: 'Invierno' },
  { name: 'Chaqueta Deportiva Reflectiva', category: 'Ropa deportiva', subcategory: 'Conjunto', brand: 'Adidas', price: 155000, cost: 77000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Top Deportivo Manga Larga', category: 'Ropa deportiva', subcategory: 'Top', brand: 'Nike', price: 68000, cost: 34000, gender: 'Femenino', season: 'Invierno' },
  { name: 'Conjunto Deportivo Niño', category: 'Ropa deportiva', subcategory: 'Conjunto', brand: 'Adidas', price: 95000, cost: 47000, gender: 'Infantil', season: 'Todo el año' },

  // Accesorios
  { name: 'Gorra Clásica Ajustable', category: 'Accesorios', subcategory: 'Gorras', brand: 'Nike', price: 48000, cost: 24000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Gorra Trucker Malla', category: 'Accesorios', subcategory: 'Gorras', brand: 'Adidas', price: 52000, cost: 26000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Cinturón Cuero Sintético', category: 'Accesorios', subcategory: 'Cinturones', brand: 'Básico', price: 42000, cost: 21000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Cinturón Casual Lona', category: 'Accesorios', subcategory: 'Cinturones', brand: "Lévi's", price: 38000, cost: 19000, gender: 'Masculino', season: 'Todo el año' },
  { name: 'Medias Deportivas Pack x3', category: 'Accesorios', subcategory: 'Medias', brand: 'Nike', price: 28000, cost: 14000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Medias Algodón Pack x3', category: 'Accesorios', subcategory: 'Medias', brand: 'Adidas', price: 24000, cost: 12000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Gorra Beanie Invierno', category: 'Accesorios', subcategory: 'Gorras', brand: 'Básico', price: 32000, cost: 16000, gender: 'Unisex', season: 'Invierno' },
  { name: 'Cinturón Formal Reversible', category: 'Accesorios', subcategory: 'Cinturones', brand: "Lévi's", price: 58000, cost: 29000, gender: 'Masculino', season: 'Todo el año' },
  { name: 'Medias Compresión Deportiva', category: 'Accesorios', subcategory: 'Medias', brand: 'Nike', price: 35000, cost: 17000, gender: 'Unisex', season: 'Todo el año' },

  // Extras para llegar a 70
  { name: 'Camiseta Básica V Neck', category: 'Camisetas', subcategory: 'Manga corta', brand: 'Básico', price: 42000, cost: 21000, gender: 'Masculino', season: 'Verano' },
  { name: 'Camiseta Básica Cuello Redondo', category: 'Camisetas', subcategory: 'Manga corta', brand: 'Básico', price: 40000, cost: 20000, gender: 'Femenino', season: 'Verano' },
  { name: 'Jean Roto Street', category: 'Pantalones', subcategory: 'Jeans', brand: 'Colombina', price: 142000, cost: 71000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Pantalón Jogger Niño', category: 'Pantalones', subcategory: 'Deportivos', brand: 'Adidas', price: 82000, cost: 41000, gender: 'Infantil', season: 'Todo el año' },
  { name: 'Chaqueta Rompevientos', category: 'Chaquetas', subcategory: 'Impermeable', brand: 'Nike', price: 178000, cost: 89000, gender: 'Unisex', season: 'Otoño' },
  { name: 'Vestido Coctel Corto', category: 'Vestidos', subcategory: 'Corto', brand: 'Básico', price: 135000, cost: 67000, gender: 'Femenino', season: 'Todo el año' },
  { name: 'Buzo Deportivo Mujer', category: 'Ropa deportiva', subcategory: 'Conjunto', brand: 'Adidas', price: 125000, cost: 62000, gender: 'Femenino', season: 'Invierno' },
  { name: 'Gorra Snapback', category: 'Accesorios', subcategory: 'Gorras', brand: 'Nike', price: 56000, cost: 28000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Camiseta Estampada Rock', category: 'Camisetas', subcategory: 'Manga corta', brand: 'Colombina', price: 55000, cost: 27000, gender: 'Unisex', season: 'Todo el año' },
  { name: 'Pantalón Jean Slim', category: 'Pantalones', subcategory: 'Jeans', brand: "Lévi's", price: 138000, cost: 69000, gender: 'Masculino', season: 'Todo el año' },
];

const COLORS = ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Gris'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

async function main() {
  console.log('[seed-products] Verificando productos existentes...');

  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log(`[seed-products] Ya existen ${existingCount} productos. No se crean nuevos.`);
    return;
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@bodega.com' } });
  if (!admin) {
    console.error('[seed-products] No se encontró usuario admin. Ejecuta init-prod.js primero.');
    process.exit(1);
  }

  console.log('[seed-products] Creando 70 productos de prueba...');

  // Asegurar catálogo base
  const categoryNames = [...new Set(productosData.map((p) => p.category))];
  const categories = {};
  for (const name of categoryNames) {
    let c = await prisma.category.findUnique({ where: { name } });
    if (!c) c = await prisma.category.create({ data: { name, description: name } });
    categories[name] = c;
  }

  const subcategories = {};
  for (const p of productosData) {
    const key = `${p.category}-${p.subcategory}`;
    if (!subcategories[key]) {
      const cat = categories[p.category];
      let s = await prisma.subcategory.findUnique({ where: { name_categoryId: { name: p.subcategory, categoryId: cat.id } } });
      if (!s) s = await prisma.subcategory.create({ data: { name: p.subcategory, categoryId: cat.id } });
      subcategories[key] = s;
    }
  }

  const brandNames = [...new Set(productosData.map((p) => p.brand))];
  const brands = {};
  for (const name of brandNames) {
    let b = await prisma.brand.findUnique({ where: { name } });
    if (!b) b = await prisma.brand.create({ data: { name } });
    brands[name] = b;
  }

  const sizeMap = {};
  for (const name of SIZES) {
    let s = await prisma.size.findUnique({ where: { name } });
    if (!s) s = await prisma.size.create({ data: { name } });
    sizeMap[name] = s;
  }

  const colorMap = {};
  for (const name of COLORS) {
    let c = await prisma.color.findUnique({ where: { name } });
    if (!c) c = await prisma.color.create({ data: { name } });
    colorMap[name] = c;
  }

  const supplier = await prisma.supplier.findFirst();

  for (let i = 0; i < productosData.length; i++) {
    const p = productosData[i];
    const code = `PRD-${String(i + 1).padStart(3, '0')}`;

    const product = await prisma.product.create({
      data: {
        code,
        name: p.name,
        description: `Producto de prueba: ${p.name}`,
        categoryId: categories[p.category].id,
        subcategoryId: subcategories[`${p.category}-${p.subcategory}`].id,
        brandId: brands[p.brand].id,
        supplierId: supplier?.id || null,
        gender: p.gender,
        season: p.season,
        purchasePrice: p.cost,
        avgCost: p.cost,
        salePrice: p.price,
        wholesalePrice: Math.round(p.price * 0.85),
        stockMin: 5,
        stockMax: 100,
        active: true,
      },
    });

    // Crear variantes: 3 colores x 4 tallas = 12 variantes por producto
    const selectedColors = COLORS.slice(0, 3);
    const selectedSizes = SIZES.slice(1, 5); // S, M, L, XL
    const movements = [];

    for (const colorName of selectedColors) {
      for (const sizeName of selectedSizes) {
        const stock = Math.floor(Math.random() * 40) + 10; // 10-50 unidades
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sizeId: sizeMap[sizeName].id,
            colorId: colorMap[colorName].id,
            sku: `${code}-${sizeName}-${colorName.toUpperCase()}`,
            stock,
            cost: p.cost,
            price: p.price,
          },
        });

        movements.push({
          userId: admin.id,
          productId: product.id,
          variantId: variant.id,
          type: 'ENTRADA',
          quantity: stock,
          cost: p.cost,
          documentRef: 'INV-INICIAL',
          reason: 'Stock inicial de prueba',
        });
      }
    }

    await prisma.inventoryMovement.createMany({ data: movements });
  }

  console.log(`[seed-products] ${productosData.length} productos creados exitosamente.`);
}

main()
  .catch((e) => {
    console.error('[seed-products] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
