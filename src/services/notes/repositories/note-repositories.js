import { nanoid } from 'nanoid';
import { Pool } from 'pg';
import { NotFoundError } from '../../../exceptions/index.js';
import { getDatabaseUrl } from '../../../config/database.js';

class NoteRepository {
  constructor(pool = new Pool({ connectionString: getDatabaseUrl() })) {
    this.pool = pool;
  }

  async getNotes() {
    const query = {
      text: `
        SELECT id, title, body, tags, created_at, updated_at
        FROM notes
        ORDER BY created_at DESC
      `,
    };

    const result = await this.pool.query(query);
    return result.rows;
  }

  async getNoteById(id) {
    const query = {
      text: `
        SELECT id, title, body, tags, created_at, updated_at
        FROM notes
        WHERE id = $1
      `,
      values: [id],
    };

    const result = await this.pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal mengambil catatan. Id tidak ditemukan');
    }

    return result.rows[0];
  }

  async createNote({ title, body, tags }) {
    const id = nanoid(16);

    const query = {
      text: `
        INSERT INTO notes (id, title, body, tags)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, body, tags, created_at, updated_at
      `,
      values: [id, title, body, tags],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async editNote({ id, title, body, tags }) {
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
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui catatan. Id tidak ditemukan');
    }

    return result.rows[0];
  }

  async deleteNote(id) {
    const query = {
      text: `
        DELETE FROM notes
        WHERE id = $1
        RETURNING id
      `,
      values: [id],
    };

    const result = await this.pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus catatan. Id tidak ditemukan');
    }

    return result.rows[0].id;
  }

  async close() {
    await this.pool.end();
  }
}

const noteRepository = new NoteRepository();

export { NoteRepository };
export default noteRepository;
