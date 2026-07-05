import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// GET /api/users — admin only
router.get('/', requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users — admin only
router.post(
  '/',
  requireAdmin,
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['ADMIN', 'MANAGER', 'STAFF']),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
      if (existing) {
        res.status(409).json({ message: 'Email already in use' });
        return;
      }
      const hashed = await bcrypt.hash(req.body.password, 12);
      const user = await prisma.user.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          password: hashed,
          role: req.body.role,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      res.status(201).json(user);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/users/:id — admin only
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data: any = { name: req.body.name, role: req.body.role };
    if (req.body.password) {
      data.password = await bcrypt.hash(req.body.password, 12);
    }
    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id — admin only
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.id === req.params.id) {
    res.status(400).json({ message: 'Cannot delete your own account' });
    return;
  }
  try {
    await prisma.user.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'User deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
