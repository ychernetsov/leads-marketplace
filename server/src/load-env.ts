import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/** Server package root (server/), whether running from src/ or dist/server/. */
export function resolveServerRoot(): string {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  if (path.basename(thisDir) === 'server' && path.basename(path.dirname(thisDir)) === 'dist') {
    return path.join(thisDir, '../../server');
  }
  return path.join(thisDir, '..');
}

const serverRoot = resolveServerRoot();
const workspaceRoot = path.join(serverRoot, '..');

dotenv.config({ path: path.join(workspaceRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env') });

export function isMocksEnv(): boolean {
  return process.env.MOCKS === 'true' || process.env.MOCKS === '1';
}

export function getMocksStorageDir(): string {
  return path.join(resolveServerRoot(), '.mock-storage');
}

/** Mocks mode: local SQLite + fixed JWT — no Docker Postgres or root .env secrets. */
export function applyMocksDefaults(): void {
  if (!isMocksEnv()) return;

  process.env.JWT_SECRET = 'mocks-dev-jwt-not-for-production';
  process.env.FRONTEND_URL = 'http://localhost:4200';
  if (!process.env.API_URL?.trim()) {
    process.env.API_URL = 'http://localhost:4200/api';
  }

  const storageDir = getMocksStorageDir();
  fs.mkdirSync(storageDir, { recursive: true });
  const dbPath = path.join(storageDir, 'dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
}

applyMocksDefaults();
