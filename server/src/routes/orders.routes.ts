import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthedRequest } from '../middleware/requireAuth.js';

/**
 * A buyer's library: their paid orders, with buyer-owned customisation
 * (title/description overrides, archive flag, labels). Orders are never
 * hard-deleted here — "delete" is a soft delete that hides the item.
 */
export const ordersRouter = Router();

const uuidSchema = z.string().uuid();

const orderSelect = {
  id: true,
  fileId: true,
  amountCents: true,
  currency: true,
  paidAt: true,
  createdAt: true,
  customTitle: true,
  customDescription: true,
  archivedAt: true,
  file: {
    select: {
      title: true,
      description: true,
      numRows: true,
      deletedAt: true,
    },
  },
  labels: {
    select: { label: { select: { id: true, name: true } } },
    orderBy: { label: { name: 'asc' } },
  },
} as const;

type OrderRecord = {
  id: string;
  fileId: string;
  amountCents: number;
  currency: string;
  paidAt: Date | null;
  createdAt: Date;
  customTitle: string | null;
  customDescription: string | null;
  archivedAt: Date | null;
  file: {
    title: string;
    description: string;
    numRows: number | null;
    deletedAt: Date | null;
  };
  labels: { label: { id: string; name: string } }[];
};

function toOrderDto(o: OrderRecord) {
  return {
    id: o.id,
    fileId: o.fileId,
    title: o.customTitle ?? o.file.title,
    description: o.customDescription ?? o.file.description,
    originalTitle: o.file.title,
    originalDescription: o.file.description,
    isCustomized: o.customTitle !== null || o.customDescription !== null,
    amountCents: o.amountCents,
    currency: o.currency,
    numRows: o.file.numRows,
    paidAt: o.paidAt ?? o.createdAt,
    archivedAt: o.archivedAt,
    // The admin removed the dataset from the catalog; the buyer keeps access.
    fileRemoved: o.file.deletedAt !== null,
    labels: o.labels.map((l) => l.label),
  };
}

/** Find one of the caller's own, non-deleted, paid orders. */
async function findOwnOrder(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId, status: 'paid', deletedAt: null },
    select: orderSelect,
  });
}

ordersRouter.get('/mine', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const orders = await prisma.order.findMany({
    where: { userId, status: 'paid', deletedAt: null },
    select: orderSelect,
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders.map(toOrderDto));
});

const editSchema = z
  .object({
    // `null` resets a field back to the dataset's own title/description.
    customTitle: z.string().trim().min(1, 'Title is required').max(200).nullable().optional(),
    customDescription: z.string().trim().max(2000).nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update' });

ordersRouter.patch('/:id', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const idResult = uuidSchema.safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: 'Invalid order ID' });

  const parsed = editSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message || 'Invalid order data' });
  }

  const existing = await findOwnOrder(userId, idResult.data);
  if (!existing) return res.status(404).json({ error: 'Order not found' });

  const { customTitle, customDescription, archived } = parsed.data;
  const data: {
    customTitle?: string | null;
    customDescription?: string | null;
    archivedAt?: Date | null;
  } = {};
  if (customTitle !== undefined) data.customTitle = customTitle;
  if (customDescription !== undefined) {
    data.customDescription = customDescription === '' ? null : customDescription;
  }
  if (archived !== undefined) data.archivedAt = archived ? new Date() : null;

  const updated = await prisma.order.update({
    where: { id: existing.id },
    data,
    select: orderSelect,
  });
  res.json(toOrderDto(updated));
});

/** Replace the set of labels attached to an order (labels must be the caller's). */
ordersRouter.put('/:id/labels', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const idResult = uuidSchema.safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: 'Invalid order ID' });

  const parsed = z.object({ labelIds: z.array(uuidSchema).max(50) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid labels payload' });

  const existing = await findOwnOrder(userId, idResult.data);
  if (!existing) return res.status(404).json({ error: 'Order not found' });

  const ownLabels = await prisma.label.findMany({
    where: { userId, id: { in: parsed.data.labelIds } },
    select: { id: true },
  });
  if (ownLabels.length !== new Set(parsed.data.labelIds).size) {
    return res.status(400).json({ error: 'One or more labels do not exist' });
  }

  await prisma.$transaction([
    prisma.orderLabel.deleteMany({ where: { orderId: existing.id } }),
    prisma.orderLabel.createMany({
      data: ownLabels.map((l) => ({ orderId: existing.id, labelId: l.id })),
    }),
  ]);

  const updated = await findOwnOrder(userId, existing.id);
  res.json(toOrderDto(updated!));
});

/** Soft delete: hides the purchase from the buyer; the order record stays. */
ordersRouter.delete('/:id', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const idResult = uuidSchema.safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: 'Invalid order ID' });

  const existing = await findOwnOrder(userId, idResult.data);
  if (!existing) return res.status(404).json({ error: 'Order not found' });

  await prisma.$transaction([
    prisma.orderLabel.deleteMany({ where: { orderId: existing.id } }),
    prisma.order.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), archivedAt: null },
    }),
  ]);
  res.status(204).send();
});
