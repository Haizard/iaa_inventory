import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireManager); // Only Manager and Admin can create purchases

// GET /api/purchases
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(purchases);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/purchases/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: String(req.params.id) },
      include: {
        supplier: true,
        user: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
    });
    if (!purchase) {
      res.status(404).json({ message: 'Purchase not found' });
      return;
    }
    res.json(purchase);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/purchases
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { supplierId, items } = req.body;

  if (!supplierId) {
    res.status(400).json({ message: 'Supplier is required' });
    return;
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: 'Purchase must have at least one item' });
    return;
  }

  try {
    const referenceNo = `PO-${Date.now()}`;
    let totalAmount = 0;

    const purchase = await prisma.$transaction(async (tx) => {
      const purchaseItemsData = await Promise.all(
        items.map(async (item: { productId: string; quantity: number; unitCost: number }) => {
          const subtotal = item.quantity * item.unitCost;
          totalAmount += subtotal;

          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } },
          });

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal,
          };
        })
      );

      return tx.purchase.create({
        data: {
          referenceNo,
          totalAmount,
          supplierId,
          userId: req.user!.id,
          items: { create: purchaseItemsData },
        },
        include: {
          supplier: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      });
    });

    res.status(201).json(purchase);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
