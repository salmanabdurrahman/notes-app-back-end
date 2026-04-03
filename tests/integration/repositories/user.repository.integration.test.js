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
import { UserRepository } from '../../../src/modules/users/users.repository.js';
import {
  clearUsersTable,
  closeTestDatabase,
  seedUser,
  setupTestDatabase,
} from '../../helpers/database.js';

describe('UserRepository integration', () => {
  let repository;

  beforeAll(async () => {
    await setupTestDatabase();
    repository = new UserRepository(
      new Pool({ connectionString: getDatabaseUrl() })
    );
  });

  beforeEach(async () => {
    await clearUsersTable();
  });

  afterAll(async () => {
    if (repository) {
      await repository.close();
    }

    await closeTestDatabase();
  });

  it('should create and retrieve a user from postgres', async () => {
    const created = await repository.create({
      username: 'johndoe',
      fullname: 'John Doe',
      password: 'secret123',
    });

    const user = await repository.findById(created.id);

    expect(created).toMatchObject({
      id: expect.any(String),
      username: 'johndoe',
      fullname: 'John Doe',
    });
    expect(user).toMatchObject({
      id: created.id,
      username: 'johndoe',
      fullname: 'John Doe',
    });
  });

  it('should return null when user id does not exist', async () => {
    await expect(repository.findById('user-404')).resolves.toBeNull();
  });

  it('should verify username availability', async () => {
    await seedUser({
      id: 'user-1',
      username: 'johndoe',
      fullname: 'John Doe',
      password: 'hashed-password',
    });

    await expect(repository.isUsernameTaken('johndoe')).resolves.toBe(true);
    await expect(repository.isUsernameTaken('janedoe')).resolves.toBe(false);
  });
});
