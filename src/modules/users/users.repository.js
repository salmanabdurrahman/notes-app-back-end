import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { NotFoundError } from '../../core/errors/index.js';
import { getDatabaseUrl } from '../../config/database.js';

class UserRepository {
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

  async findById(id) {
    const query = {
      text: `
        SELECT id, username, fullname, created_at, updated_at
        FROM users
        WHERE id = $1
      `,
      values: [id],
    };

    const result = await this.getPool().query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal mengambil pengguna. Id tidak ditemukan');
    }

    return result.rows[0];
  }

  async create({ username, fullname, password }) {
    const id = nanoid(16);
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = {
      text: `
        INSERT INTO users (id, username, fullname, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, fullname, created_at, updated_at
      `,
      values: [id, username, fullname, hashedPassword],
    };

    const result = await this.getPool().query(query);
    return result.rows[0];
  }

  async isUsernameTaken(username) {
    const query = {
      text: `
        SELECT username
        FROM users
        WHERE username = $1
      `,
      values: [username],
    };

    const result = await this.getPool().query(query);
    return result.rows.length > 0;
  }

  async verifyCredentials(username, password) {
    const query = {
      text: `
        SELECT id, username, fullname, password
        FROM users
        WHERE username = $1
      `,
      values: [username],
    };

    const result = await this.getPool().query(query);
    if (!result.rows.length) {
      return null;
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
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

const userRepository = new UserRepository();

export { UserRepository };
export default userRepository;
