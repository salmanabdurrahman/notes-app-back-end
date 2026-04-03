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
import { NoteRepository } from '../../../src/modules/notes/notes.repository.js';
import {
  clearCollaborationsTable,
  clearNotesTable,
  clearUsersTable,
  closeTestDatabase,
  seedCollaboration,
  seedNote,
  seedUser,
  setupTestDatabase,
} from '../../helpers/database.js';

describe('NoteRepository integration', () => {
  let repository;

  beforeAll(async () => {
    await setupTestDatabase();
    repository = new NoteRepository(
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

  it('should create and retrieve a note from postgres', async () => {
    await seedUser({
      id: 'user-integration',
      username: 'userintegration',
      fullname: 'User Integration',
      password: 'hashed-password',
    });

    const created = await repository.create({
      title: 'Catatan integrasi',
      body: 'Isi integrasi',
      tags: ['integration'],
      owner: 'user-integration',
    });

    const note = await repository.findById(created.id);

    expect(note).toMatchObject({
      body: 'Isi integrasi',
      id: created.id,
      tags: ['integration'],
      title: 'Catatan integrasi',
    });
  });

  it('should return only notes owned by the requested owner', async () => {
    await seedUser({
      id: 'user-a',
      username: 'usera',
      fullname: 'User A',
      password: 'hashed-password',
    });
    await seedUser({
      id: 'user-b',
      username: 'userb',
      fullname: 'User B',
      password: 'hashed-password',
    });

    await seedNote({
      id: 'note-owner-a',
      owner: 'user-a',
      title: 'Catatan A',
    });
    await seedNote({
      id: 'note-owner-b',
      owner: 'user-b',
      title: 'Catatan B',
    });

    const notes = await repository.findAll('user-a');

    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      id: 'note-owner-a',
      owner: 'user-a',
      title: 'Catatan A',
    });
  });

  it('should include shared notes for collaborator in findAll', async () => {
    await seedUser({
      id: 'user-owner',
      username: 'userowner',
      fullname: 'User Owner',
      password: 'hashed-password',
    });
    await seedUser({
      id: 'user-collaborator',
      username: 'usercollaborator',
      fullname: 'User Collaborator',
      password: 'hashed-password',
    });
    await seedNote({
      id: 'note-shared',
      owner: 'user-owner',
      title: 'Catatan Shared',
    });
    await seedCollaboration({
      id: 'collab-shared',
      noteId: 'note-shared',
      userId: 'user-collaborator',
    });

    const notes = await repository.findAll('user-collaborator');

    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      id: 'note-shared',
      owner: 'user-owner',
      title: 'Catatan Shared',
    });
  });

  it('should update persisted note data', async () => {
    await seedUser({
      id: 'user-update',
      username: 'userupdate',
      fullname: 'User Update',
      password: 'hashed-password',
    });

    const seeded = await seedNote({
      body: 'Isi awal',
      id: 'note-update',
      owner: 'user-update',
      tags: ['awal'],
      title: 'Judul awal',
    });

    const updated = await repository.updateById({
      id: seeded.id,
      title: 'Judul baru',
      body: 'Isi baru',
      tags: ['baru'],
    });

    expect(updated).toMatchObject({
      body: 'Isi baru',
      id: seeded.id,
      tags: ['baru'],
      title: 'Judul baru',
    });

    await expect(repository.findById(seeded.id)).resolves.toMatchObject({
      body: 'Isi baru',
      id: seeded.id,
      tags: ['baru'],
      title: 'Judul baru',
    });
  });

  it('should delete persisted note data', async () => {
    await seedUser({
      id: 'user-delete',
      username: 'userdelete',
      fullname: 'User Delete',
      password: 'hashed-password',
    });

    await seedNote({
      id: 'note-delete',
      owner: 'user-delete',
      title: 'Akan dihapus',
    });

    const deletedId = await repository.deleteById('note-delete');

    expect(deletedId).toBe('note-delete');
    await expect(repository.findById('note-delete')).resolves.toBeNull();
  });

  it('should return null when updating unknown note', async () => {
    const updated = await repository.updateById({
      id: 'note-404',
      title: 'Judul',
      body: 'Isi',
      tags: ['tag'],
    });

    expect(updated).toBeNull();
  });

  it('should return null when deleting unknown note', async () => {
    const deletedId = await repository.deleteById('note-404');
    expect(deletedId).toBeNull();
  });

  it('should verify note owner correctly', async () => {
    await seedUser({
      id: 'user-owner',
      username: 'userowner',
      fullname: 'User Owner',
      password: 'hashed-password',
    });

    await seedNote({
      id: 'note-owner-check',
      owner: 'user-owner',
      title: 'Ownership',
    });

    await expect(
      repository.verifyNoteOwner('note-owner-check', 'user-owner')
    ).resolves.toBe(true);
    await expect(
      repository.verifyNoteOwner('note-owner-check', 'user-other')
    ).resolves.toBe(false);
  });

  it('should verify note access using collaboration relation', async () => {
    await seedUser({
      id: 'user-owner',
      username: 'userowner',
      fullname: 'User Owner',
      password: 'hashed-password',
    });
    await seedUser({
      id: 'user-collaborator',
      username: 'usercollaborator',
      fullname: 'User Collaborator',
      password: 'hashed-password',
    });
    await seedNote({
      id: 'note-access-check',
      owner: 'user-owner',
      title: 'Access check',
    });
    await seedCollaboration({
      id: 'collab-access',
      noteId: 'note-access-check',
      userId: 'user-collaborator',
    });

    await expect(
      repository.verifyNoteAccess('note-access-check', 'user-collaborator')
    ).resolves.toBe(true);
    await expect(
      repository.verifyNoteAccess('note-access-check', 'user-other')
    ).resolves.toBe(false);
  });
});
