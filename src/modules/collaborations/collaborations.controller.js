import { InvariantError, NotFoundError } from '../../core/errors/index.js';
import collaborationRepository from './collaborations.repository.js';
import noteRepository from '../notes/notes.repository.js';
import sendResponse from '../../shared/utils/response.js';

export async function addCollaboration(req, res) {
  const { noteId, userId } = req.validated ?? req.body;

  const isOwner = await noteRepository.verifyNoteOwner(noteId, req.user.id);
  if (!isOwner) {
    throw new NotFoundError('Catatan tidak ditemukan');
  }

  const collaboration = await collaborationRepository.addCollaboration({
    noteId,
    userId,
  });
  if (!collaboration?.id) {
    throw new InvariantError('Kolaborasi gagal ditambahkan');
  }

  return sendResponse(res, 201, 'Kolaborasi berhasil ditambahkan', {
    collaborationId: collaboration.id,
  });
}

export async function deleteCollaboration(req, res) {
  const { noteId, userId } = req.validated ?? req.body;

  const isOwner = await noteRepository.verifyNoteOwner(noteId, req.user.id);
  if (!isOwner) {
    throw new NotFoundError('Catatan tidak ditemukan');
  }

  const deletedCollaboration =
    await collaborationRepository.deleteCollaboration({
      noteId,
      userId,
    });
  if (!deletedCollaboration) {
    throw new NotFoundError('Kolaborasi gagal dihapus. Id tidak ditemukan');
  }

  return sendResponse(res, 200, 'Kolaborasi berhasil dihapus', null);
}
