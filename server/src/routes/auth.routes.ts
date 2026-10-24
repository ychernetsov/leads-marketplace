import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';
import { requireAuth, AuthedRequest } from '../middleware/requireAuth.js';

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

authRouter.post('/signup', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid email or password' });

  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  const token = signToken(user.id);
  res.cookie('token', token, COOKIE_OPTIONS);
  res.status(201).json({ id: user.id, email: user.email });
});

authRouter.post('/login', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid email or password' });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user.id);
  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ id: user.id, email: user.email });
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(204).send();
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, role: user.role });
});
