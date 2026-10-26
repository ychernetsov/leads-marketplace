import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  deleteStoredObjects,
  getPrivateObjectBuffer,
  getPublicSampleUrl,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  uploadPublicSample,
} from '../lib/r2.js';
import z from 'zod';
import { requireAuth, AuthedRequest } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { randomUUID } from 'crypto';
import { parse } from 'csv-parse';
import { createCheckoutSession } from '../lib/checkout.js';
import { isMocksMode } from '../lib/mocks.js';

const uploadMetaSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priceCents: z.number().int().positive(),
  originalFilename: z.string().min(1),
});

const uuidSchema = z.string().uuid();

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function formatCsvRow(row: string[]): string {
  return row.map(escapeCsvField).join(',');
}

export const filesRouter = Router();

const publicFileSelect = {
  id: true,
  title: true,
  description: true,
  priceCents: true,
  currency: true,
  numRows: true,
  sampleUrl: true,
  status: true,
  createdAt: true,
} as const;

const editFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description must be 2000 characters or less'),
  priceCents: z
    .number('Price must be a number')
    .int('Price must be a whole number of cents')
    .positive('Price must be greater than zero')
    .max(100_000_000, 'Price is too large'),
});

const uuidListSchema = z.array(uuidSchema).min(1).max(500);

function toAdminFile(file: {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  numRows: number | null;
  sizeBytes: bigint | null;
  originalFilename: string | null;
  sampleUrl: string | null;
  status: string;
  createdAt: Date;
  _count?: { orders: number };
}) {
  return {
    id: file.id,
    title: file.title,
    description: file.description,
    priceCents: file.priceCents,
    currency: file.currency,
    numRows: file.numRows,
    // BigInt isn't JSON-serialisable; sizes comfortably fit in a JS number.
    sizeBytes: file.sizeBytes === null ? null : Number(file.sizeBytes),
    originalFilename: file.originalFilename,
    sampleUrl: file.sampleUrl,
    status: file.status,
    createdAt: file.createdAt,
    orderCount: file._count?.orders ?? 0,
  };
}

const adminFileSelect = {
  id: true,
  title: true,
  description: true,
  priceCents: true,
  currency: true,
  numRows: true,
  sizeBytes: true,
  originalFilename: true,
  sampleUrl: true,
  status: true,
  createdAt: true,
  _count: { select: { orders: true } },
} as const;

/**
 * The catalog. Everyone gets the datasets that are ready for sale; an admin
 * additionally gets datasets in every other state (uploading / processing /
 * failed) plus management fields (purchase count, size, ...), so the same
 * endpoint backs both the storefront and the admin edit mode.
 */
filesRouter.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      : null;

    if (user?.role === 'admin') {
      const files = await prisma.file.findMany({
        where: { deletedAt: null },
        select: adminFileSelect,
        orderBy: { createdAt: 'desc' },
      });
      return res.json(files.map(toAdminFile));
    }

    const files = await prisma.file.findMany({
      // Only expose files that finished processing successfully. Files
      // that are still uploading/processing, or that failed processing,
      // have no sample/price the buyer can act on and would otherwise show
      // up as a dead end in the catalog (sample missing, "buy" failing
      // with a 404 since checkout requires a 'ready' file).
      where: { status: 'ready', deletedAt: null },
      select: publicFileSelect,
      orderBy: { createdAt: 'desc' },
    });
    res.json(files);
  } catch {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// ---------------------------------------------------------------------------
// Admin dataset management (list / edit / delete, single + bulk)
// NOTE: these must be registered before the generic `/:id/...` routes so
// that paths like `/bulk` aren't swallowed by `:id`.
// ---------------------------------------------------------------------------

/** Bulk edit: apply the same description and/or price to many datasets. */
filesRouter.patch('/bulk', requireAuth, requireAdmin, async (req, res) => {
  const parsed = z
    .object({
      ids: uuidListSchema,
      // Title is intentionally not bulk-editable: giving many datasets the
      // same title is never what an admin wants.
      description: editFieldsSchema.shape.description.optional(),
      priceCents: editFieldsSchema.shape.priceCents.optional(),
    })
    .refine((b) => b.description !== undefined || b.priceCents !== undefined, {
      message: 'Provide at least one field to update',
    })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Invalid bulk edit payload',
    });
  }

  const { ids, description, priceCents } = parsed.data;
  const data: { description?: string; priceCents?: number } = {};
  if (description !== undefined) data.description = description;
  if (priceCents !== undefined) data.priceCents = priceCents;

  const result = await prisma.file.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data,
  });
  res.json({ updated: result.count });
});


const removableFileSelect = {
  id: true,
  r2KeyFull: true,
  r2KeySample: true,
  _count: { select: { orders: true } },
} as const;

/**
 * Admin removal of a dataset.
 *
 * Purchases are never deleted. If anyone has bought the dataset it is only
 * soft-deleted (hidden from the catalog and the admin list) and its full
 * file is kept so buyers can still download it; only the public sample is
 * dropped. Datasets with no purchases at all are removed for real.
 */
async function removeDataset(file: {
  id: string;
  r2KeyFull: string;
  r2KeySample: string | null;
  _count: { orders: number };
}) {
  if (file._count.orders === 0) {
    await prisma.file.delete({ where: { id: file.id } });
    await deleteStoredObjects(file);
    return;
  }

  await prisma.file.update({
    where: { id: file.id },
    data: { deletedAt: new Date(), r2KeySample: null, sampleUrl: null },
  });
  await deleteStoredObjects({ r2KeySample: file.r2KeySample });
}

/**
 * Bulk delete. Datasets nobody has bought are removed outright; datasets
 * with purchases are only removed from the catalog — see `removeDataset`.
 */
filesRouter.post(
  '/bulk-delete',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const parsed = z.object({ ids: uuidListSchema }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid bulk delete payload' });
    }

    const files = await prisma.file.findMany({
      where: { id: { in: parsed.data.ids }, deletedAt: null },
      select: removableFileSelect,
    });
    if (files.length === 0) {
      return res.status(404).json({ error: 'No matching files found' });
    }

    for (const file of files) await removeDataset(file);
    res.json({ deleted: files.length });
  },
);

/** Edit title / description / price of a single dataset. */
filesRouter.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const idResult = uuidSchema.safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: 'Invalid file ID' });

  const parsed = editFieldsSchema.partial().safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return res.status(400).json({
      error: parsed.success
        ? 'Provide at least one field to update'
        : parsed.error.issues[0]?.message || 'Invalid file data',
    });
  }

  const existing = await prisma.file.findFirst({
    where: { id: idResult.data, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return res.status(404).json({ error: 'File not found' });

  const updated = await prisma.file.update({
    where: { id: idResult.data },
    data: parsed.data,
    select: adminFileSelect,
  });
  res.json(toAdminFile(updated));
});

/** Delete a single dataset — see `removeDataset` for the purchase rules. */
filesRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const idResult = uuidSchema.safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: 'Invalid file ID' });

  const file = await prisma.file.findFirst({
    where: { id: idResult.data, deletedAt: null },
    select: removableFileSelect,
  });
  if (!file) return res.status(404).json({ error: 'File not found' });

  await removeDataset(file);
  res.status(204).send();
});

filesRouter.get('/:id/sample-url', async (req, res) => {
  const idResult = uuidSchema.safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: 'Invalid file ID' });

  try {
    const file = await prisma.file.findUnique({ where: { id: idResult.data } });
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (!file.r2KeySample) {
      return res.status(404).json({ error: 'Sample not available' });
    }
    const url = getPublicSampleUrl(file.r2KeySample);
    res.json({ url });
  } catch {
    res.status(500).json({ error: 'Failed to retrieve sample URL' });
  }
});

filesRouter.post('/upload', requireAuth, requireAdmin, async (req, res) => {
  const parsed = uploadMetaSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid file metadata' });

  const { title, description, priceCents, originalFilename } = parsed.data;
  const r2KeyFull = `${randomUUID()}-${originalFilename}`;

  const file = await prisma.file.create({
    data: {
      title,
      description,
      priceCents,
      originalFilename,
      r2KeyFull,
      status: 'uploading',
      uploadedBy: (req as AuthedRequest).userId ?? '',
    },
  });

  const uploadUrl = await getSignedUploadUrl(r2KeyFull);
  res.status(201).json({ fileId: file.id, uploadUrl });
});

filesRouter.post(
  '/:id/process',
  requireAuth,
  requireAdmin,
  async (req, res: Response) => {
    const idResult = uuidSchema.safeParse(req.params.id);
    if (!idResult.success) return res.status(400).json({ error: 'Invalid file ID' });

    const file = await prisma.file.findUnique({ where: { id: idResult.data } });
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.status !== 'uploading') {
      return res.status(409).json({
        error: `File is in '${file.status}' state, expected 'uploading'`,
      });
    }

    try {
      await prisma.file.update({
        where: { id: file.id },
        data: { status: 'processing' },
      });

      const buffer = await getPrivateObjectBuffer(file.r2KeyFull);
      const sizeBytes = buffer.byteLength;

      const { header, sampleRows, numRows } = await parseCSVStream(buffer);

      const sampleCsv = [header, ...sampleRows].map(formatCsvRow).join('\n');
      const r2KeySample = `${file.id}_sample.csv`;

      await uploadPublicSample(r2KeySample, Buffer.from(sampleCsv));
      const sampleUrl = getPublicSampleUrl(r2KeySample);

      const updated = await prisma.file.update({
        where: { id: file.id },
        data: {
          status: 'ready',
          numRows,
          sizeBytes: BigInt(sizeBytes),
          r2KeySample,
          sampleUrl,
        },
      });

      res.json({
        id: updated.id,
        status: updated.status,
        numRows: updated.numRows,
        sampleUrl: updated.sampleUrl,
      });
    } catch (err: unknown) {
      await prisma.file.update({
        where: { id: file.id },
        data: { status: 'failed' },
      });
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(422).json({ error: `Processing failed: ${message}` });
    }
  },
);

const SAMPLE_ROW_LIMIT = 50;

async function parseCSVStream(
  buffer: Buffer,
): Promise<{ header: string[]; sampleRows: string[][]; numRows: number }> {
  return new Promise((resolve, reject) => {
    let header: string[] | null = null;
    const sampleRows: string[][] = [];
    let numRows = 0;

    const parser = parse({ skip_empty_lines: true });

    parser.on('readable', () => {
      let record: string[];
      while ((record = parser.read()) !== null) {
        if (!header) {
          header = record;
          continue;
        }
        numRows++;
        if (numRows <= SAMPLE_ROW_LIMIT) sampleRows.push(record);
      }
    });

    parser.on('error', reject);

    parser.on('end', () => {
      if (!header) {
        reject(new Error('CSV has no data rows beyond the header'));
        return;
      }
      if (numRows === 0) {
        reject(new Error('CSV has no data rows beyond the header'));
        return;
      }
      resolve({ header, sampleRows, numRows });
    });

    parser.write(buffer);
    parser.end();
  });
}

filesRouter.post('/:id/checkout', requireAuth, async (req, res) => {
  const idResult = uuidSchema.safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: 'Invalid file ID' });

  const file = await prisma.file.findUnique({ where: { id: idResult.data } });
  if (!file || file.status !== 'ready' || file.deletedAt) {
    return res.status(404).json({ error: 'File not available' });
  }

  const userId = (req as AuthedRequest).userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const alreadyOwned = await prisma.order.findFirst({
    where: { userId, fileId: file.id, status: 'paid', deletedAt: null },
    select: { id: true },
  });
  if (alreadyOwned) {
    return res
      .status(409)
      .json({ error: 'You already own this dataset — find it under My Purchases' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'Admin accounts cannot purchase datasets' });
  }

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';
  const successUrl = `${frontendUrl}/checkout/success?fileId=${file.id}`;
  const cancelUrl = `${frontendUrl}/checkout/cancel`;

  const session = await createCheckoutSession({
    fileId: file.id,
    title: file.title,
    priceCents: file.priceCents,
    currency: file.currency,
    successUrl,
    cancelUrl,
  });

  const mockPaid = isMocksMode();

  await prisma.order.create({
    data: {
      userId,
      fileId: file.id,
      amountCents: file.priceCents,
      currency: file.currency,
      stripeCheckoutSessionId: session.id,
      status: mockPaid ? 'paid' : 'pending',
      paidAt: mockPaid ? new Date() : undefined,
      stripePaymentIntentId: mockPaid ? `mock_pi_${session.id}` : undefined,
    },
  });

  res.json({ checkoutUrl: session.url });
});

filesRouter.get('/:id/download-url', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const fileId = uuidSchema.safeParse(req.params.id);
  if (!fileId.success) return res.status(400).json({ error: 'Invalid file ID' });

  const order = await prisma.order.findFirst({
    where: { userId, fileId: fileId.data, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!order)
    return res.status(403).json({ error: 'No purchase found for this file' });
  if (order.status === 'pending') {
    return res
      .status(409)
      .json({ error: 'Payment still processing, please retry shortly' });
  }
  if (order.status !== 'paid') {
    return res
      .status(403)
      .json({ error: 'This order is not valid for download' });
  }

  const file = await prisma.file.findUnique({ where: { id: fileId.data } });
  if (!file) return res.status(404).json({ error: 'File not found' });

  const url = await getSignedDownloadUrl(file.r2KeyFull, 600); // 10 min
  res.json({ url });
});
