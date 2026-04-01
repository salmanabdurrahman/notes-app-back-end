import { InvariantError } from '../../core/errors/index.js';
import noteRepository from './notes.repository.js';
import sendResponse from '../../shared/utils/response.js';

export async function getAllNotes(req, res) {
  const { title = '' } = req.validated ?? req.query;

  const notes = await noteRepository.findAll();
  let filteredNotes = notes;

  if (title !== '') {
    filteredNotes = notes.filter((note) =>
      note.title.toLowerCase().includes(title.toLowerCase())
    );
  }

  return sendResponse(res, 200, 'Catatan berhasil diambil', {
    notes: filteredNotes,
  });
}

export async function getNoteById(req, res) {
  const { id } = req.params;

  const note = await noteRepository.findById(id);
  return sendResponse(res, 200, 'Catatan sukses ditampilkan', { note });
}

export async function createNote(req, res) {
  const { title, tags, body } = req.validated ?? req.body;

  const createdNote = await noteRepository.create({ title, body, tags });
  if (!createdNote?.id) {
    throw new InvariantError('Catatan gagal ditambahkan');
  }

  return sendResponse(res, 201, 'Catatan berhasil ditambahkan', {
    noteId: createdNote.id,
  });
}

export async function updateNoteById(req, res) {
  const { id } = req.params;
  const { title, tags, body } = req.validated ?? req.body;

  const updatedNote = await noteRepository.updateById({
    id,
    title,
    body,
    tags,
  });

  return sendResponse(res, 200, 'Catatan berhasil diperbarui', updatedNote);
}

export async function deleteNoteById(req, res) {
  const { id } = req.params;

  const deletedNoteId = await noteRepository.deleteById(id);
  return sendResponse(res, 200, 'Catatan berhasil dihapus', deletedNoteId);
}
