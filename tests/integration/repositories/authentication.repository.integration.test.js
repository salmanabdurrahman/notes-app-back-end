import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { Pool } from 'pg';
import { getDatabaseUrl } from '../../../src/config/database.js';
import { AuthenticationRepository } from '../../../src/modules/authentications/authentications.repository.js';
import {
  clearAuthenticationsTable,
  closeTestDatabase,
  seedAuthentication,
  setupTestDatabase,
} from '../../helpers/database.js';

describe('AuthenticationRepository integration', () => {
  let repository;

  beforeAll(async () => {
    await setupTestDatabase();
    repository = new AuthenticationRepository(
      new Pool({ connectionString: getDatabaseUrl() })
    );
  });

  beforeEach(async () => {
    await clearAuthenticationsTable();
  });

  afterAll(async () => {
    if (repository) {
      await repository.close();
    }

    await closeTestDatabase();
  });

  it('should store refresh token and verify its existence', async () => {
    const stored = await repository.storeRefreshToken('refresh-token');

    expect(stored).toMatchObject({
      id: expect.any(String),
      token: 'refresh-token',
    });
    await expect(
      repository.isRefreshTokenExists('refresh-token')
    ).resolves.toBe(true);
  });

  it('should delete stored refresh token', async () => {
    await seedAuthentication({
      id: 'auth-1',
      token: 'refresh-token',
    });

    const deletedToken = await repository.deleteRefreshToken('refresh-token');

    expect(deletedToken).toBe('refresh-token');
    await expect(
      repository.isRefreshTokenExists('refresh-token')
    ).resolves.toBe(false);
  });

  it('should return null when deleting missing refresh token', async () => {
    await expect(
      repository.deleteRefreshToken('missing-token')
    ).resolves.toBeNull();
  });
});
