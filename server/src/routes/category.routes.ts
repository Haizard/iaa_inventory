import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, requireManagerForWrite, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireManagerForWrite);

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: String(req.params.id) },
      include: { products: true },
    });
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json(category);
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
      const category = await prisma.category.create({
        data: { name: req.body.name, description: req.body.description },
      });
      res.status(201).json(category);
    } catch (err: any) {
      if (err.code === 'P2002') {
        res.status(409).json({ message: 'Category already exists' });
        return;
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = await prisma.category.update({
      where: { id: String(req.params.id) },
      data: { name: req.body.name, description: req.body.description },
    });
    res.json(category);
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.category.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Category deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
