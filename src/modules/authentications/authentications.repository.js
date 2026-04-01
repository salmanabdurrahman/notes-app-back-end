import { nanoid } from 'nanoid';
import { Pool } from 'pg';
import { NotFoundError } from '../../core/errors/index.js';
import { getDatabaseUrl } from '../../config/database.js';

class AuthenticationRepository {
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

  async storeRefreshToken(token) {
    const id = nanoid(16);

    const query = {
      text: `
        INSERT INTO authentications (id, token)
        VALUES ($1, $2)
        RETURNING id, token, created_at, updated_at
      `,
      values: [id, token],
    };

    const result = await this.getPool().query(query);
    return result.rows[0];
  }

  async deleteRefreshToken(token) {
    const query = {
      text: `
        DELETE FROM authentications
        WHERE token = $1
        RETURNING token
      `,
      values: [token],
    };

    const result = await this.getPool().query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus token. Token tidak ditemukan');
    }

    return result.rows[0].token;
  }

  async isRefreshTokenExists(token) {
    const query = {
      text: `
        SELECT token
        FROM authentications
        WHERE token = $1
      `,
      values: [token],
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

const authenticationRepository = new AuthenticationRepository();

export { AuthenticationRepository };
export default authenticationRepository;
