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
  await getPool().query('TRUNCATE TABLE notes CASCADE');
}

export async function clearUsersTable() {
  await getPool().query('TRUNCATE TABLE users CASCADE');
}

export async function clearAuthenticationsTable() {
  await getPool().query('TRUNCATE TABLE authentications');
}

export async function clearCollaborationsTable() {
  await getPool().query('TRUNCATE TABLE collaborations');
}

export async function seedNote({
  id = 'note-seed',
  title = 'Catatan seed',
  body = 'Isi catatan seed',
  tags = ['seed'],
  owner = 'user-seed-note',
} = {}) {
  const result = await getPool().query({
    text: `
      INSERT INTO notes (id, title, body, tags, owner)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, body, tags, owner, created_at, updated_at
    `,
    values: [id, title, body, tags, owner],
  });

  return result.rows[0];
}

export async function seedUser({
  id = 'user-seed',
  username = 'userseed',
  fullname = 'Pengguna Seed',
  password = 'password-seed',
} = {}) {
  const result = await getPool().query({
    text: `
      INSERT INTO users (id, username, fullname, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, fullname, created_at, updated_at
    `,
    values: [id, username, fullname, password],
  });

  return result.rows[0];
}

export async function seedAuthentication({
  id = 'auth-seed',
  token = 'refresh-token-seed',
} = {}) {
  const result = await getPool().query({
    text: `
      INSERT INTO authentications (id, token)
      VALUES ($1, $2)
      RETURNING id, token, created_at, updated_at
    `,
    values: [id, token],
  });

  return result.rows[0];
}

export async function seedCollaboration({
  id = 'collab-seed',
  noteId = 'note-seed',
  userId = 'user-seed',
} = {}) {
  const result = await getPool().query({
    text: `
      INSERT INTO collaborations (id, note_id, user_id)
      VALUES ($1, $2, $3)
      RETURNING id, note_id, user_id, created_at, updated_at
    `,
    values: [id, noteId, userId],
  });

  return result.rows[0];
}

export async function closeTestDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
