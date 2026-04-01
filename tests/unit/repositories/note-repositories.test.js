import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundError } from '../../../src/core/errors/index.js';
import { NoteRepository } from '../../../src/modules/notes/notes.repository.js';

describe('NoteRepository', () => {
  let mockPool;
  let repository;

  beforeEach(() => {
    mockPool = {
      end: jest.fn(),
      query: jest.fn(),
    };

    repository = new NoteRepository(mockPool);
  });

  it('should return all notes ordered by newest first', async () => {
    const rows = [{ id: 'note-1', title: 'Catatan 1' }];
    mockPool.query.mockResolvedValue({ rows });

    const notes = await repository.findAll();

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('ORDER BY created_at DESC'),
      })
    );
    expect(notes).toEqual(rows);
  });

  it('should return a note by id', async () => {
    const row = { id: 'note-1', title: 'Catatan 1' };
    mockPool.query.mockResolvedValue({ rows: [row] });

    const note = await repository.findById('note-1');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        values: ['note-1'],
      })
    );
    expect(note).toEqual(row);
  });

  it('should throw NotFoundError when note is not found by id', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    await expect(repository.findById('missing-note')).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('should create a note and return inserted row', async () => {
    const row = { id: 'generated-id', title: 'Catatan baru' };
    mockPool.query.mockResolvedValue({ rows: [row] });

    const note = await repository.create({
      title: 'Catatan baru',
      body: 'Isi catatan',
      tags: ['baru'],
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('INSERT INTO notes'),
        values: [expect.any(String), 'Catatan baru', 'Isi catatan', ['baru']],
      })
    );
    expect(note).toEqual(row);
  });

  it('should update a note with the expected parameter order', async () => {
    const row = { id: 'note-1', title: 'Judul update' };
    mockPool.query.mockResolvedValue({ rows: [row] });

    const note = await repository.updateById({
      id: 'note-1',
      title: 'Judul update',
      body: 'Isi update',
      tags: ['updated'],
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('UPDATE notes'),
        values: ['Judul update', 'Isi update', ['updated'], 'note-1'],
      })
    );
    expect(note).toEqual(row);
  });

  it('should throw NotFoundError when updated note does not exist', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    await expect(
      repository.updateById({
        id: 'note-404',
        title: 'Judul',
        body: 'Isi',
        tags: ['tag'],
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should delete a note and return its id', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: 'note-1' }] });

    const noteId = await repository.deleteById('note-1');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('DELETE FROM notes'),
        values: ['note-1'],
      })
    );
    expect(noteId).toBe('note-1');
  });

  it('should close the underlying pool', async () => {
    await repository.close();

    expect(mockPool.end).toHaveBeenCalledTimes(1);
  });
});
