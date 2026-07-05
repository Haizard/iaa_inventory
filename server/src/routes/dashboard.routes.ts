import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalSales,
      totalPurchases,
      lowStockProducts,
      recentSales,
      recentPurchases,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.supplier.count(),
      prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true }),
      prisma.purchase.aggregate({ _sum: { totalAmount: true }, _count: true }),
      prisma.product.findMany({
        where: { quantity: { lte: 10 } },
        select: { id: true, name: true, sku: true, quantity: true, minStock: true },
        orderBy: { quantity: 'asc' },
        take: 5,
      }),
      prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
      prisma.purchase.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { supplier: { select: { name: true } } },
      }),
    ]);

    res.json({
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalSalesCount: totalSales._count,
      totalSalesAmount: totalSales._sum.totalAmount || 0,
      totalPurchasesCount: totalPurchases._count,
      totalPurchasesAmount: totalPurchases._sum.totalAmount || 0,
      lowStockProducts,
      recentSales,
      recentPurchases,
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/sales-chart — last 7 days
router.get('/sales-chart', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: since }, status: 'COMPLETED' },
      select: { createdAt: true, totalAmount: true },
    });

    // Group by day
    const map: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      map[d.toISOString().split('T')[0]] = 0;
    }

    for (const s of sales) {
      const key = s.createdAt.toISOString().split('T')[0];
      if (map[key] !== undefined) {
        map[key] += Number(s.totalAmount);
      }
    }

    const chart = Object.entries(map).map(([date, amount]) => ({ date, amount }));
    res.json(chart);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
