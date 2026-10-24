import { getMocksStorageDir } from '../load-env.js';

export function isMocksMode(): boolean {
  return process.env.MOCKS === 'true' || process.env.MOCKS === '1';
}

export function getApiBaseUrl(): string {
  if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, '');
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  return `http://${host}:${port}`;
}

export function getMockStorageRoot(): string {
  return getMocksStorageDir();
}

export function sanitizeStorageKey(key: string): string {
  const normalized = key.replace(/\\/g, '/').replace(/^(\.\.(\/|$))+/, '');
  if (normalized.includes('..') || normalized.startsWith('/')) {
    throw new Error('Invalid storage key');
  }
  return normalized;
}
