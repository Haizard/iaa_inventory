import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// GET /api/sales
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        user: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sales);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/sales/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: String(req.params.id) },
      include: {
        user: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
    });
    if (!sale) {
      res.status(404).json({ message: 'Sale not found' });
      return;
    }
    res.json(sale);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/sales
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: 'Sale must have at least one item' });
    return;
  }

  try {
    // Verify stock availability
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        res.status(404).json({ message: `Product ${item.productId} not found` });
        return;
      }
      if (product.quantity < item.quantity) {
        res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        return;
      }
    }

    const invoiceNo = `INV-${Date.now()}`;
    let totalAmount = 0;

    const sale = await prisma.$transaction(async (tx) => {
      // Calculate totals and update stock
      const saleItemsData = await Promise.all(
        items.map(async (item: { productId: string; quantity: number; unitPrice: number }) => {
          const subtotal = item.quantity * item.unitPrice;
          totalAmount += subtotal;

          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal,
          };
        })
      );

      return tx.sale.create({
        data: {
          invoiceNo,
          totalAmount,
          userId: req.user!.id,
          customerId: req.body.customerId || null,
          items: { create: saleItemsData },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true } } } },
          user: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
        },
      });
    });

    res.status(201).json(sale);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/sales/:id/status
router.patch('/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sale = await prisma.sale.update({
      where: { id: String(req.params.id) },
      data: { status: req.body.status },
    });
    res.json(sale);
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Sale not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
