import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundError } from '../../../src/exceptions/index.js';
import createNoteController from '../../../src/services/notes/controller/note-controller.js';

function createResponseMock() {
  return {
    end: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  };
}

describe('note-controller', () => {
  let noteRepository;
  let controller;
  let res;

  beforeEach(() => {
    noteRepository = {
      createNote: jest.fn(),
      deleteNote: jest.fn(),
      editNote: jest.fn(),
      getNoteById: jest.fn(),
      getNotes: jest.fn(),
    };

    controller = createNoteController(noteRepository);
    res = createResponseMock();
  });

  it('should return all notes', async () => {
    const notes = [
      { id: 'note-1', title: 'Belajar Node' },
      { id: 'note-2', title: 'Belajar Express' },
    ];
    noteRepository.getNotes.mockResolvedValue(notes);

    await controller.getAllNotes({ query: {} }, res);

    expect(noteRepository.getNotes).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: { notes },
      message: 'Catatan berhasil diambil',
      status: 'success',
    });
  });

  it('should filter notes by title case-insensitively', async () => {
    noteRepository.getNotes.mockResolvedValue([
      { id: 'note-1', title: 'Belajar Node' },
      { id: 'note-2', title: 'Resep Masak' },
      { id: 'note-3', title: 'BELAJAR Express' },
    ]);

    await controller.getAllNotes({ validated: { title: 'belajar' } }, res);

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
    noteRepository.getNoteById.mockResolvedValue(note);

    await controller.getNoteById({ params: { id: 'note-1' } }, res);

    expect(noteRepository.getNoteById).toHaveBeenCalledWith('note-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: { note },
      message: 'Catatan sukses ditampilkan',
      status: 'success',
    });
  });

  it('should propagate repository error when note id is not found', async () => {
    noteRepository.getNoteById.mockRejectedValue(
      new NotFoundError('Gagal mengambil catatan. Id tidak ditemukan')
    );

    await expect(
      controller.getNoteById({ params: { id: 'note-404' } }, res)
    ).rejects.toThrow('Gagal mengambil catatan. Id tidak ditemukan');
  });

  it('should create a note and return note id', async () => {
    noteRepository.createNote.mockResolvedValue({ id: 'note-1' });

    await controller.createNote(
      {
        validated: {
          body: 'Isi catatan',
          tags: ['test'],
          title: 'Catatan baru',
        },
      },
      res
    );

    expect(noteRepository.createNote).toHaveBeenCalledWith({
      body: 'Isi catatan',
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
    noteRepository.editNote.mockResolvedValue(note);

    await controller.editNoteById(
      {
        params: { id: 'note-1' },
        validated: {
          body: 'Isi update',
          tags: ['updated'],
          title: 'Catatan update',
        },
      },
      res
    );

    expect(noteRepository.editNote).toHaveBeenCalledWith({
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

  it('should delete a note by id', async () => {
    noteRepository.deleteNote.mockResolvedValue('note-1');

    await controller.deleteNoteById({ params: { id: 'note-1' } }, res);

    expect(noteRepository.deleteNote).toHaveBeenCalledWith('note-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: 'note-1',
      message: 'Catatan berhasil dihapus',
      status: 'success',
    });
  });
});
