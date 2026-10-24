import path from 'path';
import { fileURLToPath } from 'url';

export function isMocksMode(): boolean {
  return process.env.MOCKS === 'true' || process.env.MOCKS === '1';
}

export function getApiBaseUrl(): string {
  if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, '');
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  return `http://${host}:${port}`;
}

const serverRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

export const MOCK_STORAGE_ROOT = path.join(serverRoot, '.mock-storage');

export function sanitizeStorageKey(key: string): string {
  const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
  if (normalized.includes('..') || path.isAbsolute(normalized)) {
    throw new Error('Invalid storage key');
  }
  return normalized;
}
