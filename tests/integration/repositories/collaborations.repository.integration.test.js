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
import { CollaborationRepository } from '../../../src/modules/collaborations/collaborations.repository.js';
import {
  clearCollaborationsTable,
  clearNotesTable,
  clearUsersTable,
  closeTestDatabase,
  seedNote,
  seedUser,
  setupTestDatabase,
} from '../../helpers/database.js';

describe('CollaborationRepository integration', () => {
  let repository;

  beforeAll(async () => {
    await setupTestDatabase();
    repository = new CollaborationRepository(
      new Pool({ connectionString: getDatabaseUrl() })
    );
  });

  beforeEach(async () => {
    await clearCollaborationsTable();
    await clearNotesTable();
    await clearUsersTable();
  });

  afterAll(async () => {
    if (repository) {
      await repository.close();
    }

    await closeTestDatabase();
  });

  it('should add collaboration and verify collaborator', async () => {
    await seedUser({
      id: 'owner-1',
      username: 'owner1',
      fullname: 'Owner One',
      password: 'hashed-password',
    });
    await seedUser({
      id: 'collab-user-1',
      username: 'collab1',
      fullname: 'Collaborator One',
      password: 'hashed-password',
    });
    await seedNote({
      id: 'note-1',
      owner: 'owner-1',
      title: 'Shared note',
    });

    const created = await repository.addCollaboration({
      noteId: 'note-1',
      userId: 'collab-user-1',
    });

    expect(created).toMatchObject({
      id: expect.any(String),
      ['note_id']: 'note-1',
      ['user_id']: 'collab-user-1',
    });

    await expect(
      repository.verifyCollaborator({
        noteId: 'note-1',
        userId: 'collab-user-1',
      })
    ).resolves.toBe(true);
  });

  it('should delete existing collaboration', async () => {
    await seedUser({
      id: 'owner-1',
      username: 'owner1',
      fullname: 'Owner One',
      password: 'hashed-password',
    });
    await seedUser({
      id: 'collab-user-1',
      username: 'collab1',
      fullname: 'Collaborator One',
      password: 'hashed-password',
    });
    await seedNote({
      id: 'note-1',
      owner: 'owner-1',
      title: 'Shared note',
    });
    await repository.addCollaboration({
      noteId: 'note-1',
      userId: 'collab-user-1',
    });

    const deleted = await repository.deleteCollaboration({
      noteId: 'note-1',
      userId: 'collab-user-1',
    });

    expect(deleted).toMatchObject({
      id: expect.any(String),
    });
    await expect(
      repository.verifyCollaborator({
        noteId: 'note-1',
        userId: 'collab-user-1',
      })
    ).resolves.toBe(false);
  });

  it('should return null when deleting unknown collaboration', async () => {
    await expect(
      repository.deleteCollaboration({
        noteId: 'note-1',
        userId: 'collab-user-1',
      })
    ).resolves.toBeNull();
  });
});
