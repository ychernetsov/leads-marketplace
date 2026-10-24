import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const serverRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(serverRoot, '..');

dotenv.config({ path: path.join(workspaceRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env') });

export function isMocksEnv(): boolean {
  return process.env.MOCKS === 'true' || process.env.MOCKS === '1';
}

/** Mocks mode: local SQLite + fixed JWT — no Docker Postgres or root .env secrets. */
export function applyMocksDefaults(): void {
  if (!isMocksEnv()) return;

  process.env.JWT_SECRET = 'mocks-dev-jwt-not-for-production';

  const storageDir = path.join(serverRoot, '.mock-storage');
  fs.mkdirSync(storageDir, { recursive: true });
  const dbPath = path.join(storageDir, 'dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
}

applyMocksDefaults();
