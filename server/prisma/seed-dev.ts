import '../src/load-env.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from '../src/lib/auth.js';
import { prisma } from '../src/lib/prisma.js';
import { getPublicSampleUrl } from '../src/lib/r2.js';
import {
  uploadPublicSample,
  writePrivateObject,
} from '../src/lib/r2.mock.js';

if (process.env.MOCKS !== 'true' && process.env.MOCKS !== '1') {
  console.error('Set MOCKS=true when running seed-dev (or use npm run db:seed:mocks).');
  process.exit(1);
}

const DEV_PASSWORD = 'devpassword1';

const devUsers = [
  { email: 'admin@dev.local', role: 'admin' as const },
  { email: 'buyer1@dev.local', role: 'regular' as const },
  { email: 'buyer2@dev.local', role: 'regular' as const },
];

const catalogDatasets = [
  'retail_sales_2024',
  'weather_stations_us',
  'flight_delays_2023',
  'housing_prices_metro',
  'ecommerce_orders_2024',
];

const prismaRoot = path.dirname(fileURLToPath(import.meta.url));
const placeholdersDir = path.join(
  prismaRoot,
  '../scripts/placeholder-files',
);

function titleCase(name: string) {
  return name
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function countDataRows(csv: string): number {
  const lines = csv.trim().split('\n');
  return Math.max(0, lines.length - 1);
}

async function main() {
  const passwordHash = await hashPassword(DEV_PASSWORD);

  for (const u of devUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        passwordHash,
        role: u.role,
      },
      update: {
        passwordHash,
        role: u.role,
      },
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: 'admin@dev.local' },
  });

  await prisma.order.deleteMany();
  await prisma.file.deleteMany();

  for (const name of catalogDatasets) {
    const samplePath = path.join(placeholdersDir, `${name}_sample.csv`);
    const csv = await fs.readFile(samplePath, 'utf8');
    const buffer = Buffer.from(csv, 'utf8');
    const r2KeyFull = `${name}_full.csv`;
    const r2KeySample = `${name}_sample.csv`;

    await writePrivateObject(r2KeyFull, buffer);
    await uploadPublicSample(r2KeySample, buffer);

    await prisma.file.create({
      data: {
        title: titleCase(name),
        description: `Dev mock dataset: ${titleCase(name).toLowerCase()}.`,
        priceCents: 400,
        currency: 'usd',
        numRows: countDataRows(csv),
        sizeBytes: BigInt(buffer.byteLength),
        originalFilename: `${name}.csv`,
        r2KeyFull,
        r2KeySample,
        sampleUrl: getPublicSampleUrl(r2KeySample),
        status: 'ready',
        uploadedBy: admin.id,
      },
    });
  }

  console.log('Dev seed complete.');
  console.log('Users (password for all: devpassword1):');
  for (const u of devUsers) {
    console.log(`  - ${u.email} (${u.role})`);
  }
  console.log(`Catalog: ${catalogDatasets.length} ready files with local mock storage.`);
}

main().finally(() => prisma.$disconnect());
