import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string; email: string; role: string;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};

export const requireManager = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
    res.status(403).json({ message: 'Manager or Admin access required' });
    return;
  }
  next();
};

// Staff cannot mutate — read-only for STAFF role
export const requireManagerForWrite = (
  req: AuthRequest, res: Response, next: NextFunction
): void => {
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (writeMethods.includes(req.method) && req.user?.role === 'STAFF') {
    res.status(403).json({ message: 'Staff cannot perform this action' });
    return;
  }
  next();
};

// Reports: STAFF has no access, MANAGER gets sales+stock only
export const requireReportAccess = (
  req: AuthRequest, res: Response, next: NextFunction
): void => {
  const role = req.user?.role;
  if (role === 'STAFF') {
    res.status(403).json({ message: 'Reports not available for staff' });
    return;
  }
  next();
};
