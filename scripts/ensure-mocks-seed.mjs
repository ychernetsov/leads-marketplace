import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(root, 'server/.mock-storage/dev.db');

if (!fs.existsSync(dbPath)) {
  const result = spawnSync('npm', ['run', 'db:seed:mocks'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, MOCKS: 'true' },
  });
  process.exit(result.status ?? 1);
}
