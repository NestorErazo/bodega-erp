import { Router } from 'express';
import prisma from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.use(authRequired);

// Movimientos de inventario con filtros
router.get('/movements', requirePermission(['inventory.manage', 'products.view']), async (req, res, next) => {
  try {
    const { productId, type, limit = 100 } = req.query;
    const where = {};
    if (productId) where.productId = Number(productId);
    if (type) where.type = type;

    const movements = await prisma.inventoryMovement.findMany({
      where,
      take: Number(limit),
      orderBy: { date: 'desc' },
      include: {
        product: { select: { id: true, name: true, code: true } },
        user: { select: { name: true } },
        variant: { include: { size: true, color: true } },
      },
    });
    res.json(movements.map((m) => ({
      ...m,
      productName: m.product.name,
      user: m.user.name,
      variantLabel: m.variant ? `${m.variant.color?.name || ''} ${m.variant.size?.name || ''}`.trim() : null,
    })));
  } catch (e) { next(e); }
});

// Registro de movimiento (entrada, salida, ajuste)
router.post('/movements', requirePermission(['inventory.manage']), async (req, res, next) => {
  try {
    const { productId, variantId, type, quantity, reason, observations, documentRef } = req.body;
    const qty = Number(quantity);
    if (!productId || !type || !qty || qty <= 0) {
      return res.status(400).json({ error: 'productId, type y quantity > 0 son requeridos' });
    }

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    let cost = product.avgCost;
    let stockAfter = null;

    // Para variante: stock base + suma de variantes
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: Number(variantId) } });
      if (!variant) return res.status(404).json({ error: 'Variante no encontrada' });
      cost = variant.cost || product.avgCost;

      if (type === 'SALIDA' && variant.stock < qty) {
        return res.status(400).json({ error: `Stock insuficiente en la variante (disponible: ${variant.stock})` });
      }
      stockAfter = type === 'SALIDA' ? variant.stock - qty : variant.stock + qty;
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: stockAfter },
      });
      // Actualizar costo promedio del producto y de la variante al registrar entradas
      if (type === 'ENTRADA') {
        const allVariants = await prisma.productVariant.findMany({ where: { productId: product.id } });
        const totalUnits = allVariants.reduce((s, v) => s + v.stock, 0);
        const totalValue = allVariants.reduce((s, v) => s + v.cost * v.stock, 0);
        const newAvg = totalUnits > 0 ? totalValue / totalUnits : cost;
        await prisma.product.update({ where: { id: product.id }, data: { avgCost: newAvg } });
        await logAudit(req.user.id, 'COST_UPDATE', 'product', product.id, { avgCost: newAvg });
      }
    } else {
      const variants = await prisma.productVariant.findMany({ where: { productId: product.id } });
      const currentStock = variants.reduce((s, v) => s + v.stock, 0);
      if (type === 'SALIDA' && currentStock < qty) {
        return res.status(400).json({ error: `Stock insuficiente (disponible: ${currentStock})` });
      }
      // Ajuste global: distribuir proporcionalmente entre variantes
      if (variants.length > 0) {
        const diff = type === 'SALIDA' ? -qty : qty;
        for (const v of variants) {
          const newStock = Math.max(0, v.stock + Math.round(diff / variants.length));
          await prisma.productVariant.update({ where: { id: v.id }, data: { stock: newStock } });
        }
      }
      stockAfter = currentStock + (type === 'SALIDA' ? -qty : qty);
    }

    const movement = await prisma.inventoryMovement.create({
      data: {
        userId: req.user.id,
        productId: Number(productId),
        variantId: variantId ? Number(variantId) : null,
        type,
        quantity: qty,
        cost,
        documentRef,
        reason,
        observations,
      },
    });

    await logAudit(req.user.id, 'MOVEMENT', 'inventory', movement.id, { type, productId, quantity: qty, reason });
    res.status(201).json({ movement, stockAfter });
  } catch (e) { next(e); }
});

// Kardex de un producto
router.get('/kardex/:productId', requirePermission(['inventory.manage', 'products.view']), async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: { include: { size: true, color: true } } },
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const movements = await prisma.inventoryMovement.findMany({
      where: { productId },
      orderBy: { date: 'asc' },
      include: { user: { select: { name: true } } },
    });

    // Construir Kardex con saldo acumulado
    let saldo = 0;
    const kardex = movements.map((m) => {
      saldo += m.type === 'SALIDA' ? -m.quantity : m.quantity;
      return {
        id: m.id,
        date: m.date,
        document: m.documentRef || m.type,
        type: m.type,
        entrada: m.type === 'ENTRADA' ? m.quantity : 0,
        salida: m.type === 'SALIDA' ? m.quantity : 0,
        saldo,
        cost: m.cost,
        user: m.user.name,
        reason: m.reason,
      };
    });

    const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
    res.json({
      product: { id: product.id, name: product.name, code: product.code, avgCost: product.avgCost },
      totalStock,
      inventoryValue: product.avgCost * totalStock,
      kardex,
      variants: product.variants.map((v) => ({ id: v.id, label: `${v.color?.name || ''} ${v.size?.name || ''}`.trim(), stock: v.stock, cost: v.cost })),
    });
  } catch (e) { next(e); }
});

export default router;