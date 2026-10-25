import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthedRequest } from '../middleware/requireAuth.js';

/** Per-user labels that buyers attach to their purchases. */
export const labelsRouter = Router();

const uuidSchema = z.string().uuid();
const nameSchema = z
  .string()
  .trim()
  .min(1, 'Label name is required')
  .max(40, 'Label name must be 40 characters or less');

const labelSelect = {
  id: true,
  name: true,
  _count: { select: { orders: true } },
} as const;

function toLabelDto(l: { id: string; name: string; _count: { orders: number } }) {
  return { id: l.id, name: l.name, orderCount: l._count.orders };
}

/** Label names are unique per user, ignoring case ("Finance" == "finance"). */
async function findNameClash(userId: string, name: string, excludeId?: string) {
  const labels = await prisma.label.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  const wanted = name.toLowerCase();
  return labels.find((l) => l.id !== excludeId && l.name.toLowerCase() === wanted);
}

labelsRouter.get('/', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const labels = await prisma.label.findMany({
    where: { userId },
    select: labelSelect,
    orderBy: { name: 'asc' },
  });
  res.json(labels.map(toLabelDto));
});

labelsRouter.post('/', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const parsed = z.object({ name: nameSchema }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message });
  }

  if (await findNameClash(userId, parsed.data.name)) {
    return res.status(409).json({ error: 'You already have that label' });
  }

  const label = await prisma.label.create({
    data: { userId, name: parsed.data.name },
    select: labelSelect,
  });
  res.status(201).json(toLabelDto(label));
});

labelsRouter.patch('/:id', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const idResult = uuidSchema.safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: 'Invalid label ID' });

  const parsed = z.object({ name: nameSchema }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message });
  }

  const existing = await prisma.label.findFirst({ where: { id: idResult.data, userId } });
  if (!existing) return res.status(404).json({ error: 'Label not found' });

  if (await findNameClash(userId, parsed.data.name, existing.id)) {
    return res.status(409).json({ error: 'You already have that label' });
  }

  const label = await prisma.label.update({
    where: { id: existing.id },
    data: { name: parsed.data.name },
    select: labelSelect,
  });
  res.json(toLabelDto(label));
});

labelsRouter.delete('/:id', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const idResult = uuidSchema.safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: 'Invalid label ID' });

  const existing = await prisma.label.findFirst({ where: { id: idResult.data, userId } });
  if (!existing) return res.status(404).json({ error: 'Label not found' });

  // order_labels rows cascade.
  await prisma.label.delete({ where: { id: existing.id } });
  res.status(204).send();
});
