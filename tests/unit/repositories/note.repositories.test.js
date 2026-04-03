import { beforeEach, describe, expect, it, jest } from '@jest/globals';
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

    const notes = await repository.findAll('user-1');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('ORDER BY created_at DESC'),
        values: ['user-1'],
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

  it('should return null when note is not found by id', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    await expect(repository.findById('missing-note')).resolves.toBeNull();
  });

  it('should create a note and return inserted row', async () => {
    const row = { id: 'generated-id', title: 'Catatan baru' };
    mockPool.query.mockResolvedValue({ rows: [row] });

    const note = await repository.create({
      title: 'Catatan baru',
      body: 'Isi catatan',
      tags: ['baru'],
      owner: 'user-1',
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('INSERT INTO notes'),
        values: [
          expect.any(String),
          'Catatan baru',
          'Isi catatan',
          ['baru'],
          'user-1',
        ],
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

  it('should return null when updated note does not exist', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const note = await repository.updateById({
      id: 'note-404',
      title: 'Judul',
      body: 'Isi',
      tags: ['tag'],
    });

    expect(note).toBeNull();
  });

  it('should return null when deleted note does not exist', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const noteId = await repository.deleteById('note-404');
    expect(noteId).toBeNull();
  });

  it('should return true when owner verification is valid', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: 'note-1' }] });

    const isOwner = await repository.verifyNoteOwner('note-1', 'user-1');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        values: ['note-1', 'user-1'],
      })
    );
    expect(isOwner).toBe(true);
  });

  it('should return false when owner verification is invalid', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const isOwner = await repository.verifyNoteOwner('note-1', 'user-2');

    expect(isOwner).toBe(false);
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
