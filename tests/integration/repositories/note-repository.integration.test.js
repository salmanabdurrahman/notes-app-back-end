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
import { NotFoundError } from '../../../src/core/errors/index.js';
import { NoteRepository } from '../../../src/modules/notes/notes.repository.js';
import {
  clearNotesTable,
  closeTestDatabase,
  seedNote,
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
    await clearNotesTable();
  });

  afterAll(async () => {
    if (repository) {
      await repository.close();
    }

    await closeTestDatabase();
  });

  it('should create and retrieve a note from postgres', async () => {
    const created = await repository.create({
      title: 'Catatan integrasi',
      body: 'Isi integrasi',
      tags: ['integration'],
    });

    const note = await repository.findById(created.id);

    expect(note).toMatchObject({
      body: 'Isi integrasi',
      id: created.id,
      tags: ['integration'],
      title: 'Catatan integrasi',
    });
  });

  it('should update persisted note data', async () => {
    const seeded = await seedNote({
      body: 'Isi awal',
      id: 'note-update',
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
    await seedNote({
      id: 'note-delete',
      title: 'Akan dihapus',
    });

    const deletedId = await repository.deleteById('note-delete');

    expect(deletedId).toBe('note-delete');
    await expect(repository.findById('note-delete')).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
