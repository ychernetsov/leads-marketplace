import { Router } from 'express';
import jwt from 'jsonwebtoken';
import {
  readPublicObject,
  writePrivateObject,
} from '../lib/r2.mock.js';
import { getMockStorageRoot, sanitizeStorageKey } from '../lib/mocks.js';
import fs from 'fs/promises';
import path from 'path';

export const mocksRouter = Router();

mocksRouter.put('/r2/private/:key', async (req, res) => {
  try {
    const key = sanitizeStorageKey(decodeURIComponent(req.params.key));
    const body = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      return res.status(400).json({ error: 'Empty upload body' });
    }
    await writePrivateObject(key, body);
    res.status(204).send();
  } catch {
    res.status(400).json({ error: 'Invalid upload' });
  }
});

mocksRouter.get('/r2/download', async (req, res) => {
  const token = req.query.token;
  if (typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing token' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server misconfigured' });

  try {
    const payload = jwt.verify(token, secret) as {
      key?: string;
      purpose?: string;
    };
    if (payload.purpose !== 'mock-download' || !payload.key) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    const filePath = path.join(
      getMockStorageRoot(),
      'private',
      sanitizeStorageKey(payload.key),
    );
    const data = await fs.readFile(filePath);
    const filename = path.basename(payload.key);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(data);
  } catch {
    res.status(403).json({ error: 'Invalid or expired download link' });
  }
});

mocksRouter.get('/r2/public/:key', async (req, res) => {
  try {
    const key = sanitizeStorageKey(decodeURIComponent(req.params.key));
    const data = await readPublicObject(key);
    res.setHeader('Content-Type', 'text/csv');
    res.send(data);
  } catch {
    res.status(404).json({ error: 'Sample not found' });
  }
});
