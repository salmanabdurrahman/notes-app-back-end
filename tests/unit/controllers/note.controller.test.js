import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import noteRepository from '../../../src/modules/notes/notes.repository.js';
import {
  createNote,
  deleteNoteById,
  getAllNotes,
  getNoteById,
  updateNoteById,
} from '../../../src/modules/notes/notes.controller.js';

function createResponseMock() {
  return {
    end: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  };
}

describe('note-controller', () => {
  let res;

  beforeEach(() => {
    res = createResponseMock();
  });

  it('should return all notes', async () => {
    const notes = [
      { id: 'note-1', title: 'Belajar Node' },
      { id: 'note-2', title: 'Belajar Express' },
    ];
    jest.spyOn(noteRepository, 'findAll').mockResolvedValue(notes);

    await getAllNotes({ query: {}, user: { id: 'user-1' } }, res);

    expect(noteRepository.findAll).toHaveBeenCalledTimes(1);
    expect(noteRepository.findAll).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: { notes },
      message: 'Catatan berhasil diambil',
      status: 'success',
    });
  });

  it('should filter notes by title case-insensitively', async () => {
    jest.spyOn(noteRepository, 'findAll').mockResolvedValue([
      { id: 'note-1', title: 'Belajar Node' },
      { id: 'note-2', title: 'Resep Masak' },
      { id: 'note-3', title: 'BELAJAR Express' },
    ]);

    await getAllNotes(
      { validated: { title: 'belajar' }, user: { id: 'user-1' } },
      res
    );

    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: {
        notes: [
          { id: 'note-1', title: 'Belajar Node' },
          { id: 'note-3', title: 'BELAJAR Express' },
        ],
      },
      message: 'Catatan berhasil diambil',
      status: 'success',
    });
  });

  it('should return one note by id', async () => {
    const note = { id: 'note-1', title: 'Belajar Node' };
    jest.spyOn(noteRepository, 'verifyNoteAccess').mockResolvedValue(true);
    jest.spyOn(noteRepository, 'findById').mockResolvedValue(note);

    await getNoteById(
      { params: { id: 'note-1' }, user: { id: 'user-1' } },
      res
    );

    expect(noteRepository.verifyNoteAccess).toHaveBeenCalledWith(
      'note-1',
      'user-1'
    );
    expect(noteRepository.findById).toHaveBeenCalledWith('note-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: { note },
      message: 'Catatan sukses ditampilkan',
      status: 'success',
    });
  });

  it('should throw not found when note id is not found', async () => {
    jest.spyOn(noteRepository, 'verifyNoteAccess').mockResolvedValue(true);
    jest.spyOn(noteRepository, 'findById').mockResolvedValue(null);

    await expect(
      getNoteById({ params: { id: 'note-404' }, user: { id: 'user-1' } }, res)
    ).rejects.toThrow('Gagal mengambil catatan. Id tidak ditemukan');
  });

  it('should throw not found when user does not own the note detail', async () => {
    jest.spyOn(noteRepository, 'verifyNoteAccess').mockResolvedValue(false);
    jest.spyOn(noteRepository, 'findById').mockResolvedValue({
      id: 'note-1',
      title: 'Belajar Node',
    });

    await expect(
      getNoteById({ params: { id: 'note-1' }, user: { id: 'user-2' } }, res)
    ).rejects.toThrow('Catatan tidak ditemukan');

    expect(noteRepository.findById).not.toHaveBeenCalled();
  });

  it('should create a note and return note id', async () => {
    jest.spyOn(noteRepository, 'create').mockResolvedValue({ id: 'note-1' });

    await createNote(
      {
        validated: {
          body: 'Isi catatan',
          tags: ['test'],
          title: 'Catatan baru',
        },
        user: { id: 'user-1' },
      },
      res
    );

    expect(noteRepository.create).toHaveBeenCalledWith({
      body: 'Isi catatan',
      owner: 'user-1',
      tags: ['test'],
      title: 'Catatan baru',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      code: 201,
      data: { noteId: 'note-1' },
      message: 'Catatan berhasil ditambahkan',
      status: 'success',
    });
  });

  it('should update a note by id', async () => {
    const note = { id: 'note-1', title: 'Catatan update' };
    jest.spyOn(noteRepository, 'verifyNoteAccess').mockResolvedValue(true);
    jest.spyOn(noteRepository, 'updateById').mockResolvedValue(note);

    await updateNoteById(
      {
        params: { id: 'note-1' },
        validated: {
          body: 'Isi update',
          tags: ['updated'],
          title: 'Catatan update',
        },
        user: { id: 'user-1' },
      },
      res
    );

    expect(noteRepository.verifyNoteAccess).toHaveBeenCalledWith(
      'note-1',
      'user-1'
    );
    expect(noteRepository.updateById).toHaveBeenCalledWith({
      body: 'Isi update',
      id: 'note-1',
      tags: ['updated'],
      title: 'Catatan update',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: note,
      message: 'Catatan berhasil diperbarui',
      status: 'success',
    });
  });

  it('should throw not found when user does not own the note update target', async () => {
    jest.spyOn(noteRepository, 'verifyNoteAccess').mockResolvedValue(false);
    jest.spyOn(noteRepository, 'updateById').mockResolvedValue({
      id: 'note-1',
    });

    await expect(
      updateNoteById(
        {
          params: { id: 'note-1' },
          validated: {
            body: 'Isi update',
            tags: ['updated'],
            title: 'Catatan update',
          },
          user: { id: 'user-2' },
        },
        res
      )
    ).rejects.toThrow('Gagal memperbarui catatan. Id tidak ditemukan');

    expect(noteRepository.updateById).not.toHaveBeenCalled();
  });

  it('should delete a note by id', async () => {
    jest.spyOn(noteRepository, 'verifyNoteAccess').mockResolvedValue(true);
    jest.spyOn(noteRepository, 'deleteById').mockResolvedValue('note-1');

    await deleteNoteById(
      { params: { id: 'note-1' }, user: { id: 'user-1' } },
      res
    );

    expect(noteRepository.verifyNoteAccess).toHaveBeenCalledWith(
      'note-1',
      'user-1'
    );
    expect(noteRepository.deleteById).toHaveBeenCalledWith('note-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: 'note-1',
      message: 'Catatan berhasil dihapus',
      status: 'success',
    });
  });

  it('should throw not found when user does not own the note delete target', async () => {
    jest.spyOn(noteRepository, 'verifyNoteAccess').mockResolvedValue(false);
    jest.spyOn(noteRepository, 'deleteById').mockResolvedValue('note-1');

    await expect(
      deleteNoteById({ params: { id: 'note-1' }, user: { id: 'user-2' } }, res)
    ).rejects.toThrow('Gagal menghapus catatan. Id tidak ditemukan');

    expect(noteRepository.deleteById).not.toHaveBeenCalled();
  });
});
