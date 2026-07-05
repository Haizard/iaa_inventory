import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, requireManagerForWrite, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireManagerForWrite); // STAFF: read-only

const optionalText = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value ?? null;

const optionalNumber = (value: unknown) =>
  value === '' || value === undefined || value === null ? null : Number(value);

const optionalDate = (value: unknown) =>
  typeof value === 'string' && value ? new Date(value) : null;

const productDataFromBody = (bodyData: any) => ({
  name: String(bodyData.name ?? '').trim(),
  shortDescription: optionalText(bodyData.shortDescription) as string | null,
  description: optionalText(bodyData.description) as string | null,
  sku: String(bodyData.sku ?? '').trim(),
  barcode: optionalText(bodyData.barcode) as string | null,
  imageUrl: optionalText(bodyData.imageUrl) as string | null,
  productType: bodyData.productType || 'PHYSICAL',
  price: Number(bodyData.price),
  costPrice: Number(bodyData.costPrice),
  wholesalePrice: optionalNumber(bodyData.wholesalePrice) as number | null,
  minSellingPrice: optionalNumber(bodyData.minSellingPrice) as number | null,
  taxRate: optionalNumber(bodyData.taxRate) as number | null,
  discountRate: optionalNumber(bodyData.discountRate) as number | null,
  currency: String(bodyData.currency || 'TZS').trim(),
  quantity: Number(bodyData.quantity ?? 0),
  minStock: Number(bodyData.minStock ?? 10),
  maxStock: optionalNumber(bodyData.maxStock) as number | null,
  trackInventory: bodyData.trackInventory ?? true,
  unit: String(bodyData.unit || 'pcs').trim(),
  purchaseUnit: optionalText(bodyData.purchaseUnit) as string | null,
  sellingUnit: optionalText(bodyData.sellingUnit) as string | null,
  unitConversion: optionalText(bodyData.unitConversion) as string | null,
  warehouse: optionalText(bodyData.warehouse) as string | null,
  storageLocation: optionalText(bodyData.storageLocation) as string | null,
  expiryDate: optionalDate(bodyData.expiryDate) as Date | null,
  batchNumber: optionalText(bodyData.batchNumber) as string | null,
  status: bodyData.status || 'ACTIVE',
  canBeSold: bodyData.canBeSold ?? true,
  featured: bodyData.featured ?? false,
  availableOnline: bodyData.availableOnline ?? false,
  availableInStore: bodyData.availableInStore ?? true,
  allowBackorders: bodyData.allowBackorders ?? false,
  supplierSku: optionalText(bodyData.supplierSku) as string | null,
  supplierLeadTimeDays: optionalNumber(bodyData.supplierLeadTimeDays) as number | null,
  shippingWeight: optionalNumber(bodyData.shippingWeight) as number | null,
  shippingLength: optionalNumber(bodyData.shippingLength) as number | null,
  shippingWidth: optionalNumber(bodyData.shippingWidth) as number | null,
  shippingHeight: optionalNumber(bodyData.shippingHeight) as number | null,
  shippingClass: optionalText(bodyData.shippingClass) as string | null,
  categoryId: String(bodyData.categoryId ?? '').trim(),
  brandId: optionalText(bodyData.brandId) as string | null,
  supplierId: optionalText(bodyData.supplierId) as string | null,
});

// GET /api/products
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, categoryId, lowStock } = req.query;

    const products = await prisma.product.findMany({
      where: {
        ...(search ? { name: { contains: String(search), mode: 'insensitive' } } : {}),
        ...(categoryId ? { categoryId: String(categoryId) } : {}),
        ...(lowStock === 'true' ? { quantity: { lte: prisma.product.fields.minStock } } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Handle lowStock filter manually since Prisma doesn't support field comparisons directly
    const filtered =
      lowStock === 'true' ? products.filter((p) => p.quantity <= p.minStock) : products;

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
      include: { category: true, brand: true, supplier: true },
    });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/products
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('sku').notEmpty().trim(),
    body('productType').optional().isIn(['PHYSICAL', 'DIGITAL', 'SERVICE', 'BUNDLE', 'VARIABLE']),
    body('status').optional().isIn(['ACTIVE', 'DRAFT', 'ARCHIVED', 'DISCONTINUED']),
    body('price').isNumeric(),
    body('costPrice').isNumeric(),
    body('categoryId').notEmpty(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const product = await prisma.product.create({
        data: productDataFromBody(req.body),
        include: { category: true, brand: true, supplier: true },
      });
      res.status(201).json(product);
    } catch (err: any) {
      if (err.code === 'P2002') {
        res.status(409).json({ message: 'SKU or barcode already exists' });
        return;
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/products/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.update({
      where: { id: String(req.params.id) },
      data: productDataFromBody(req.body),
      include: { category: true, brand: true, supplier: true },
    });
    res.json(product);
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ message: 'SKU or barcode already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.product.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Product deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
