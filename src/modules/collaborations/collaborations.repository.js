import { nanoid } from 'nanoid';
import { Pool } from 'pg';
import { getDatabaseUrl } from '../../config/database.js';

class CollaborationRepository {
  constructor(pool = null) {
    this.pool = pool;
    this.isExternalPool = Boolean(pool);
  }

  getPool() {
    if (!this.pool) {
      this.pool = new Pool({ connectionString: getDatabaseUrl() });
    }

    return this.pool;
  }

  async addCollaboration({ noteId, userId }) {
    const id = nanoid(16);

    const query = {
      text: `
        INSERT INTO collaborations (id, note_id, user_id)
        VALUES ($1, $2, $3)
        RETURNING id, note_id, user_id, created_at, updated_at
      `,
      values: [id, noteId, userId],
    };

    const result = await this.getPool().query(query);
    return result.rows[0];
  }

  async deleteCollaboration({ noteId, userId }) {
    const query = {
      text: `
        DELETE FROM collaborations
        WHERE note_id = $1 AND user_id = $2
        RETURNING id
      `,
      values: [noteId, userId],
    };

    const result = await this.getPool().query(query);
    return result.rows[0] ?? null;
  }

  async verifyCollaborator({ noteId, userId }) {
    const query = {
      text: `
        SELECT id
        FROM collaborations
        WHERE note_id = $1 AND user_id = $2
      `,
      values: [noteId, userId],
    };

    const result = await this.getPool().query(query);
    return result.rows.length > 0;
  }

  async close() {
    if (!this.pool) {
      return;
    }

    await this.pool.end();
    if (!this.isExternalPool) {
      this.pool = null;
    }
  }
}

const collaborationRepository = new CollaborationRepository();

export { CollaborationRepository };
export default collaborationRepository;
