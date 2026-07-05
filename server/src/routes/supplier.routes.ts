import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, requireManagerForWrite, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireManagerForWrite);

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { purchases: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(suppliers);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: String(req.params.id) },
      include: { purchases: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!supplier) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }
    res.json(supplier);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/',
  [body('name').notEmpty().trim()],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const supplier = await prisma.supplier.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          address: req.body.address,
        },
      });
      res.status(201).json(supplier);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: String(req.params.id) },
      data: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
      },
    });
    res.json(supplier);
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.supplier.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Supplier deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
