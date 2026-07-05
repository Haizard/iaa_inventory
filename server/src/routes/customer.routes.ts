import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, requireManagerForWrite, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireManagerForWrite);

// GET /api/customers
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: String(search), mode: 'insensitive' } },
              { email: { contains: String(search), mode: 'insensitive' } },
              { phone: { contains: String(search), mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(customers);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: String(req.params.id) },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            invoiceNo: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        _count: { select: { sales: true } },
      },
    });
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/customers
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
      const customer = await prisma.customer.create({
        data: {
          name: req.body.name,
          email: req.body.email || null,
          phone: req.body.phone || null,
          address: req.body.address || null,
        },
      });
      res.status(201).json(customer);
    } catch (err: any) {
      if (err.code === 'P2002') {
        res.status(409).json({ message: 'Email already in use' });
        return;
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/customers/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await prisma.customer.update({
      where: { id: String(req.params.id) },
      data: {
        name: req.body.name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
      },
    });
    res.json(customer);
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.customer.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Customer deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
