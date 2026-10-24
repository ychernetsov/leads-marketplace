import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import Database from 'better-sqlite3';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(root, 'server/.mock-storage/dev.db');

function needsSeed() {
  if (!fs.existsSync(dbPath)) return true;
  let db;
  try {
    db = new Database(dbPath, { readonly: true });
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
      )
      .get();
    if (!tables) return true;
    const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();
    return count === 0;
  } catch {
    return true;
  } finally {
    db?.close();
  }
}

if (needsSeed()) {
  console.log('[mocks] Seeding SQLite dev users + catalog…');
  const result = spawnSync('npm', ['run', 'db:seed:mocks'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, MOCKS: 'true' },
  });
  process.exit(result.status ?? 1);
}
