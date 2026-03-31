import path from 'path';
import { fileURLToPath } from 'url';
import { runner } from 'node-pg-migrate';
import { Pool } from 'pg';
import {
  getAdminDatabaseUrl,
  getDatabaseName,
  getDatabaseUrl,
} from '../../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../migrations');

let pool;
let isMigrated = false;

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: getDatabaseUrl() });
  }

  return pool;
}

function escapeIdentifier(identifier) {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsupported database identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

export async function ensureTestDatabaseExists() {
  const databaseUrl = getDatabaseUrl();
  const databaseName = getDatabaseName(databaseUrl);
  const existingDatabasePool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    await existingDatabasePool.query('SELECT 1');
    await existingDatabasePool.end();
    return;
  } catch (error) {
    await existingDatabasePool.end().catch(() => {});

    if (error.code !== '3D000') {
      throw error;
    }
  }

  const adminPool = new Pool({
    connectionString: getAdminDatabaseUrl(databaseUrl),
  });

  try {
    const result = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName]
    );

    if (!result.rowCount) {
      await adminPool.query(
        `CREATE DATABASE ${escapeIdentifier(databaseName)}`
      );
    }
  } finally {
    await adminPool.end();
  }
}

export async function setupTestDatabase() {
  if (isMigrated) {
    return;
  }

  await ensureTestDatabaseExists();
  await runner({
    databaseUrl: getDatabaseUrl(),
    dir: migrationsDir,
    direction: 'up',
    log: () => {},
    migrationsTable: 'pgmigrations',
  });

  isMigrated = true;
}

export async function clearNotesTable() {
  await getPool().query('TRUNCATE TABLE notes');
}

export async function seedNote({
  id = 'note-seed',
  title = 'Catatan seed',
  body = 'Isi catatan seed',
  tags = ['seed'],
} = {}) {
  const result = await getPool().query({
    text: `
      INSERT INTO notes (id, title, body, tags)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, body, tags, created_at, updated_at
    `,
    values: [id, title, body, tags],
  });

  return result.rows[0];
}

export async function closeTestDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
