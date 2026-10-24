import '../load-env.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client.js';
import { isMocksMode } from './mocks.js';

function createPrismaClient(): PrismaClient {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  if (isMocksMode() || url.startsWith('file:')) {
    const filePath = url.replace(/^file:/, '');
    const adapter = new PrismaBetterSqlite3({ url: filePath });
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();
