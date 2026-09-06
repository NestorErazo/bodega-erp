import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.use(authRequired);

const productInclude = {
  category: true,
  subcategory: true,
  brand: true,
  variants: { include: { size: true, color: true } },
};

function serializeProduct(p) {
  const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
  return {
    id: p.id,
    code: p.code,
    barcode: p.barcode,
    sku: p.sku,
    reference: p.reference,
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    category: p.category?.name,
    subcategoryId: p.subcategoryId,
    subcategory: p.subcategory?.name,
    brandId: p.brandId,
    brand: p.brand?.name,
    material: p.material,
    gender: p.gender,
    season: p.season,
    image: p.image,
    purchasePrice: p.purchasePrice,
    avgCost: p.avgCost,
    salePrice: p.salePrice,
    wholesalePrice: p.wholesalePrice,
    promoPrice: p.promoPrice,
    taxRate: p.taxRate,
    stockMin: p.stockMin,
    stockMax: p.stockMax,
    location: p.location,
    active: p.active,
    totalStock,
    variants: p.variants.map((v) => ({
      id: v.id,
      sizeId: v.sizeId,
      size: v.size?.name,
      colorId: v.colorId,
      color: v.color?.name,
      sku: v.sku,
      barcode: v.barcode,
      stock: v.stock,
      cost: v.cost,
      price: v.price,
      image: v.image,
    })),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// Listado con filtros
router.get('/', async (req, res, next) => {
  try {
    const { q, categoryId, brandId, active, lowStock } = req.query;
    const where = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { code: { contains: q } },
        { reference: { contains: q } },
        { barcode: { contains: q } },
        { sku: { contains: q } },
      ];
    }
    if (categoryId) where.categoryId = Number(categoryId);
    if (brandId) where.brandId = Number(brandId);
    if (active !== undefined) where.active = active === 'true';

    const products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { name: 'asc' },
    });

    let result = products.map(serializeProduct);
    if (lowStock === 'true') {
      result = result.filter((p) => p.totalStock <= p.stockMin);
    }

    res.json(result);
  } catch (e) { next(e); }
});

// Detalle
router.get('/:id', async (req, res, next) => {
  try {
    const p = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, include: productInclude });
    if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(serializeProduct(p));
  } catch (e) { next(e); }
});

// Crear producto con variantes
router.post('/', requirePermission(['products.manage']), async (req, res, next) => {
  try {
    const { variants = [], ...data } = req.body;

    const product = await prisma.product.create({
      data: {
        code: data.code || data.reference,
        barcode: data.barcode,
        sku: data.sku,
        reference: data.reference,
        name: data.name,
        description: data.description,
        categoryId: Number(data.categoryId),
        subcategoryId: data.subcategoryId ? Number(data.subcategoryId) : null,
        brandId: data.brandId ? Number(data.brandId) : null,
        material: data.material,
        gender: data.gender,
        season: data.season,
        image: data.image,
        purchasePrice: Number(data.purchasePrice) || 0,
        avgCost: Number(data.avgCost) || 0,
        salePrice: Number(data.salePrice) || 0,
        wholesalePrice: Number(data.wholesalePrice) || 0,
        promoPrice: Number(data.promoPrice) || 0,
        taxRate: Number(data.taxRate) || 0,
        stockMin: Number(data.stockMin) || 5,
        stockMax: Number(data.stockMax) || 100,
        location: data.location,
        active: data.active !== false,
      },
    });

    let totalStock = 0;
    for (const v of variants) {
      const qty = Number(v.stock) || 0;
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sizeId: v.sizeId ? Number(v.sizeId) : null,
          colorId: v.colorId ? Number(v.colorId) : null,
          sku: v.sku,
          barcode: v.barcode,
          stock: qty,
          cost: Number(v.cost) || Number(data.avgCost) || 0,
          price: Number(v.price) || Number(data.salePrice) || 0,
          image: v.image,
        },
      });
      if (qty > 0) {
        await prisma.inventoryMovement.create({
          data: {
            userId: req.user.id,
            productId: product.id,
            type: 'ENTRADA',
            quantity: qty,
            cost: Number(v.cost) || 0,
            documentRef: 'INICIAL',
            reason: 'Inventario inicial',
          },
        });
      }
      totalStock += qty;
    }

    await logAudit(req.user.id, 'CREATE', 'product', product.id, { name: product.name, code: product.code });
    const full = await prisma.product.findUnique({ where: { id: product.id }, include: productInclude });
    res.status(201).json({ product: serializeProduct(full), totalStock });
  } catch (e) { next(e); }
});

// Actualizar producto y sus variantes (reescribe el conjunto de variantes)
router.put('/:id', requirePermission(['products.manage']), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { variants, ...data } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

    const product = await prisma.product.update({
      where: { id },
      data: {
        code: data.code || data.reference,
        barcode: data.barcode,
        sku: data.sku,
        reference: data.reference,
        name: data.name,
        description: data.description,
        categoryId: Number(data.categoryId),
        subcategoryId: data.subcategoryId ? Number(data.subcategoryId) : null,
        brandId: data.brandId ? Number(data.brandId) : null,
        material: data.material,
        gender: data.gender,
        season: data.season,
        image: data.image,
        purchasePrice: Number(data.purchasePrice) || 0,
        avgCost: Number(data.avgCost) || 0,
        salePrice: Number(data.salePrice) || 0,
        wholesalePrice: Number(data.wholesalePrice) || 0,
        promoPrice: Number(data.promoPrice) || 0,
        taxRate: Number(data.taxRate) || 0,
        stockMin: Number(data.stockMin) || 5,
        stockMax: Number(data.stockMax) || 100,
        location: data.location,
        active: data.active !== false,
      },
    });

    // Actualizar variantes existentes y crear nuevas
    if (Array.isArray(variants)) {
      const existingVariants = await prisma.productVariant.findMany({ where: { productId: id } });
      const updatedIds = new Set();
      for (const v of variants) {
        if (v.id && existingVariants.some((ev) => ev.id === Number(v.id))) {
          await prisma.productVariant.update({
            where: { id: Number(v.id) },
            data: {
              sizeId: v.sizeId ? Number(v.sizeId) : null,
              colorId: v.colorId ? Number(v.colorId) : null,
              sku: v.sku,
              barcode: v.barcode,
              stock: Number(v.stock) || 0,
              cost: Number(v.cost) || 0,
              price: Number(v.price) || 0,
              image: v.image,
            },
          });
          updatedIds.add(Number(v.id));
        } else {
          const nv = await prisma.productVariant.create({
            data: {
              productId: id,
              sizeId: v.sizeId ? Number(v.sizeId) : null,
              colorId: v.colorId ? Number(v.colorId) : null,
              sku: v.sku,
              barcode: v.barcode,
              stock: Number(v.stock) || 0,
              cost: Number(v.cost) || 0,
              price: Number(v.price) || 0,
              image: v.image,
            },
          });
          updatedIds.add(nv.id);
        }
      }
      // Eliminar variantes no incluidas
      for (const ev of existingVariants) {
        if (!updatedIds.has(ev.id)) {
          await prisma.productVariant.delete({ where: { id: ev.id } });
        }
      }
    }

    await logAudit(req.user.id, 'UPDATE', 'product', product.id, { name: product.name, code: product.code });
    res.json({ product: serializeProduct(product) });
  } catch (e) { next(e); }
});

// Anular (desactivar) producto en lugar de eliminar
router.delete('/:id', requirePermission(['products.manage']), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.update({ where: { id }, data: { active: false } });
    await logAudit(req.user.id, 'DEACTIVATE', 'product', id, { name: product.name });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;