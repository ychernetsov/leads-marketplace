import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthedRequest } from './requireAuth.js';

export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
