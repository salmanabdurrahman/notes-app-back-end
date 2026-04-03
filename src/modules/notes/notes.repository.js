import { nanoid } from 'nanoid';
import { Pool } from 'pg';
import { getDatabaseUrl } from '../../config/database.js';

class NoteRepository {
  constructor(pool = new Pool({ connectionString: getDatabaseUrl() })) {
    this.pool = pool;
  }

  async findAll(owner) {
    const query = {
      text: `
        SELECT id, title, body, tags, owner, created_at, updated_at
        FROM notes
        WHERE owner = $1
        ORDER BY created_at DESC
      `,
      values: [owner],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }

  async findById(id) {
    const query = {
      text: `
        SELECT id, title, body, tags, created_at, updated_at
        FROM notes
        WHERE id = $1
      `,
      values: [id],
    };

    const result = await this.pool.query(query);
    return result.rows[0] ?? null;
  }

  async create({ title, body, tags, owner }) {
    const id = nanoid(16);

    const query = {
      text: `
        INSERT INTO notes (id, title, body, tags, owner)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, body, tags, owner, created_at, updated_at
      `,
      values: [id, title, body, tags, owner],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async updateById({ id, title, body, tags }) {
    const query = {
      text: `
        UPDATE notes
        SET title = $1,
            body = $2,
            tags = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, title, body, tags, created_at, updated_at
      `,
      values: [title, body, tags, id],
    };

    const result = await this.pool.query(query);
    return result.rows[0] ?? null;
  }

  async deleteById(id) {
    const query = {
      text: `
        DELETE FROM notes
        WHERE id = $1
        RETURNING id
      `,
      values: [id],
    };

    const result = await this.pool.query(query);
    return result.rows[0]?.id ?? null;
  }

  async verifyNoteOwner(id, owner) {
    const query = {
      text: `
        SELECT id
        FROM notes
        WHERE id = $1 AND owner = $2
      `,
      values: [id, owner],
    };

    const result = await this.pool.query(query);
    return result.rows.length > 0;
  }

  async close() {
    await this.pool.end();
  }
}

const noteRepository = new NoteRepository();

export { NoteRepository };
export default noteRepository;
