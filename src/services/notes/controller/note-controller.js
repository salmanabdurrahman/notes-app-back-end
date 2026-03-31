import { InvariantError } from '../../../exceptions/index.js';
import noteRepository from '../repositories/note-repositories.js';
import response from '../../../utils/response.js';

export async function getAllNotes(req, res) {
  const { title = '' } = req.validated ?? req.query;
  const notes = await noteRepository.getNotes();
  let filteredNotes = notes;

  if (title !== '') {
    filteredNotes = notes.filter((note) =>
      note.title.toLowerCase().includes(title.toLowerCase())
    );
  }

  return response(res, 200, 'Catatan berhasil diambil', {
    notes: filteredNotes,
  });
}

export async function getNoteById(req, res) {
  const { id } = req.params;

  const note = await noteRepository.getNoteById(id);
  return response(res, 200, 'Catatan sukses ditampilkan', { note });
}

export async function createNote(req, res) {
  const { title, tags, body } = req.validated ?? req.body;

  const note = await noteRepository.createNote({ title, body, tags });
  if (!note?.id) {
    throw new InvariantError('Catatan gagal ditambahkan');
  }

  return response(res, 201, 'Catatan berhasil ditambahkan', {
    noteId: note.id,
  });
}

export async function editNoteById(req, res) {
  const { id } = req.params;
  const { title, tags, body } = req.validated ?? req.body;

  const note = await noteRepository.editNote({ id, title, body, tags });
  return response(res, 200, 'Catatan berhasil diperbarui', note);
}

export async function deleteNoteById(req, res) {
  const { id } = req.params;

  const noteId = await noteRepository.deleteNote(id);
  return response(res, 200, 'Catatan berhasil dihapus', noteId);
}
