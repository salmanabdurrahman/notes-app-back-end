import { nanoid } from 'nanoid';
import { Pool } from 'pg';
import { getDatabaseUrl } from '../../config/database.js';
import collaborationRepository from '../collaborations/collaborations.repository.js';

class NoteRepository {
  constructor(pool = null, collaborationRepo = collaborationRepository) {
    this.pool = pool;
    this.isExternalPool = Boolean(pool);
    this.collaborationRepository = collaborationRepo;
  }

  getPool() {
    if (!this.pool) {
      this.pool = new Pool({ connectionString: getDatabaseUrl() });
    }

    return this.pool;
  }

  async findAll(owner) {
    const query = {
      text: `
        SELECT DISTINCT notes.id AS id,
            notes.title,
            notes.body,
            notes.tags,
            notes.owner,
            notes.created_at,
            notes.updated_at
        FROM notes
        LEFT JOIN collaborations 
          ON collaborations.note_id = notes.id
        WHERE notes.owner = $1 
          OR collaborations.user_id = $1
        ORDER BY notes.created_at DESC;
      `,
      values: [owner],
    };

    const result = await this.getPool().query(query);
    return result.rows;
  }

  async findById(id) {
    const query = {
      text: `
        SELECT n.id,
            n.title,
            n.body,
            n.tags,
            n.created_at,
            n.updated_at,
            u.username
        FROM notes n
        JOIN users u
          ON u.id = n.owner
        WHERE n.id = $1
      `,
      values: [id],
    };

    const result = await this.getPool().query(query);
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

    const result = await this.getPool().query(query);
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

    const result = await this.getPool().query(query);
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

    const result = await this.getPool().query(query);
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

    const result = await this.getPool().query(query);
    return result.rows.length > 0;
  }

  async verifyNoteAccess(noteId, userId) {
    const ownerResult = await this.verifyNoteOwner(noteId, userId);
    if (ownerResult) {
      return ownerResult;
    }

    const result = await this.collaborationRepository.verifyCollaborator({
      noteId,
      userId,
    });
    return result;
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

const noteRepository = new NoteRepository();

export { NoteRepository };
export default noteRepository;
