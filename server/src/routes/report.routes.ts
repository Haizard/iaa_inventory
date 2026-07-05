import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireReportAccess, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireReportAccess);  // STAFF blocked from all reports
router.use(authenticate);

// GET /api/reports/sales?from=&to=
router.get('/sales', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(new Date().getFullYear(), 0, 1);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    to.setHours(23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = sales
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + Number(s.totalAmount), 0);

    const totalTransactions = sales.length;
    const completedCount = sales.filter((s) => s.status === 'COMPLETED').length;
    const cancelledCount = sales.filter((s) => s.status === 'CANCELLED').length;

    // Group by date for chart
    const byDate: Record<string, number> = {};
    for (const s of sales.filter((s) => s.status === 'COMPLETED')) {
      const key = s.createdAt.toISOString().split('T')[0];
      byDate[key] = (byDate[key] || 0) + Number(s.totalAmount);
    }
    const chartData = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    // Top selling products
    const productMap: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {};
    for (const s of sales.filter((s) => s.status === 'COMPLETED')) {
      for (const item of s.items) {
        const key = item.productId;
        if (!productMap[key]) {
          productMap[key] = { name: item.product.name, sku: item.product.sku, qty: 0, revenue: 0 };
        }
        productMap[key].qty += item.quantity;
        productMap[key].revenue += Number(item.subtotal);
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      summary: { totalRevenue, totalTransactions, completedCount, cancelledCount },
      sales,
      chartData,
      topProducts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/purchases?from=&to=
router.get('/purchases', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(new Date().getFullYear(), 0, 1);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    to.setHours(23, 59, 59, 999);

    const purchases = await prisma.purchase.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        supplier: { select: { name: true } },
        user: { select: { name: true } },
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCost = purchases
      .filter((p) => p.status === 'RECEIVED')
      .reduce((sum, p) => sum + Number(p.totalAmount), 0);

    // By supplier
    const supplierMap: Record<string, { name: string; total: number; count: number }> = {};
    for (const p of purchases.filter((p) => p.status === 'RECEIVED')) {
      const key = p.supplierId;
      if (!supplierMap[key]) {
        supplierMap[key] = { name: p.supplier.name, total: 0, count: 0 };
      }
      supplierMap[key].total += Number(p.totalAmount);
      supplierMap[key].count += 1;
    }
    const bySupplier = Object.values(supplierMap).sort((a, b) => b.total - a.total);

    res.json({
      summary: {
        totalCost,
        totalOrders: purchases.length,
        receivedCount: purchases.filter((p) => p.status === 'RECEIVED').length,
      },
      purchases,
      bySupplier,
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/stock
router.get('/stock', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { quantity: 'asc' },
    });

    const totalProducts = products.length;
    const outOfStock = products.filter((p) => p.quantity === 0).length;
    const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock).length;
    const totalStockValue = products.reduce(
      (sum, p) => sum + Number(p.costPrice) * p.quantity,
      0
    );
    const totalRetailValue = products.reduce(
      (sum, p) => sum + Number(p.price) * p.quantity,
      0
    );

    // By category
    const catMap: Record<string, { name: string; count: number; value: number }> = {};
    for (const p of products) {
      const key = p.categoryId;
      if (!catMap[key]) {
        catMap[key] = { name: p.category.name, count: 0, value: 0 };
      }
      catMap[key].count += p.quantity;
      catMap[key].value += Number(p.costPrice) * p.quantity;
    }
    const byCategory = Object.values(catMap).sort((a, b) => b.value - a.value);

    res.json({
      summary: { totalProducts, outOfStock, lowStock, totalStockValue, totalRetailValue },
      products,
      byCategory,
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
