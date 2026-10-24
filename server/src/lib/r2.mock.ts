import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import {
  getApiBaseUrl,
  getMockStorageRoot,
  sanitizeStorageKey,
} from './mocks.js';

function privatePath(key: string) {
  return path.join(getMockStorageRoot(), 'private', sanitizeStorageKey(key));
}

function publicPath(key: string) {
  return path.join(getMockStorageRoot(), 'public', sanitizeStorageKey(key));
}

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function getSignedUploadUrl(key: string, _expiresInSeconds = 900) {
  const safe = sanitizeStorageKey(key);
  const base = getApiBaseUrl();
  return `${base}/_mocks/r2/private/${encodeURIComponent(safe)}`;
}

export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds: number,
) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  const token = jwt.sign(
    { key: sanitizeStorageKey(key), purpose: 'mock-download' },
    secret,
    { expiresIn: expiresInSeconds },
  );
  return `${getApiBaseUrl()}/_mocks/r2/download?token=${encodeURIComponent(token)}`;
}

export async function getPrivateObjectBuffer(key: string): Promise<Buffer> {
  return fs.readFile(privatePath(key));
}

export async function getPrivateObjectSize(key: string): Promise<number> {
  const stat = await fs.stat(privatePath(key));
  return stat.size;
}

export async function uploadPublicSample(key: string, body: Buffer) {
  const dest = publicPath(key);
  await ensureDir(dest);
  await fs.writeFile(dest, body);
}

export function getPublicSampleUrl(key: string) {
  const safe = sanitizeStorageKey(key);
  return `${getApiBaseUrl()}/_mocks/r2/public/${encodeURIComponent(safe)}`;
}

export async function writePrivateObject(key: string, body: Buffer) {
  const dest = privatePath(key);
  await ensureDir(dest);
  await fs.writeFile(dest, body);
}

export async function readPublicObject(key: string): Promise<Buffer> {
  return fs.readFile(publicPath(key));
}
