import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, requireManagerForWrite, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireManagerForWrite);

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const brands = await prisma.brand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(brands);
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
      const brand = await prisma.brand.create({
        data: {
          name: req.body.name,
          description: req.body.description || null,
        },
      });
      res.status(201).json(brand);
    } catch (err: any) {
      if (err.code === 'P2002') {
        res.status(409).json({ message: 'Brand already exists' });
        return;
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const brand = await prisma.brand.update({
      where: { id: String(req.params.id) },
      data: {
        name: req.body.name,
        description: req.body.description || null,
      },
    });
    res.json(brand);
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Brand not found' });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ message: 'Brand already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.brand.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Brand deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Brand not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
