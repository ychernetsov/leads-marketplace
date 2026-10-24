import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  getPrivateObjectBuffer,
  getPublicSampleUrl,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  uploadPublicSample,
} from '../lib/r2.js';
import z from 'zod';
import { requireAuth, AuthedRequest } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
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

filesRouter.get('/', async (_req, res) => {
  try {
    const files = await prisma.file.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        currency: true,
        numRows: true,
        sampleUrl: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(files);
  } catch {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
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
  if (!file || file.status !== 'ready') {
    return res.status(404).json({ error: 'File not available' });
  }

  const userId = (req as AuthedRequest).userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

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
    where: { userId, fileId: fileId.data },
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

filesRouter.get('/orders/mine', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const orders = await prisma.order.findMany({
    where: { userId, status: 'paid' },
    include: { file: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    orders.map((o) => ({
      id: o.id,
      fileId: o.fileId,
      fileTitle: o.file.title,
      paidAt: o.paidAt,
    })),
  );
});
