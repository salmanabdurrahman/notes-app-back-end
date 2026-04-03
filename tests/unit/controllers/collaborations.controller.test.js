import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  InvariantError,
  NotFoundError,
} from '../../../src/core/errors/index.js';
import collaborationRepository from '../../../src/modules/collaborations/collaborations.repository.js';
import {
  addCollaboration,
  deleteCollaboration,
} from '../../../src/modules/collaborations/collaborations.controller.js';
import noteRepository from '../../../src/modules/notes/notes.repository.js';

function createResponseMock() {
  return {
    end: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  };
}

describe('collaborations.controller', () => {
  let res;

  beforeEach(() => {
    res = createResponseMock();
  });

  it('should add collaboration and return collaboration id', async () => {
    jest.spyOn(noteRepository, 'verifyNoteOwner').mockResolvedValue(true);
    jest
      .spyOn(collaborationRepository, 'addCollaboration')
      .mockResolvedValue({ id: 'collab-1' });

    await addCollaboration(
      {
        user: { id: 'owner-1' },
        validated: {
          noteId: 'note-1',
          userId: 'user-2',
        },
      },
      res
    );

    expect(noteRepository.verifyNoteOwner).toHaveBeenCalledWith(
      'note-1',
      'owner-1'
    );
    expect(collaborationRepository.addCollaboration).toHaveBeenCalledWith({
      noteId: 'note-1',
      userId: 'user-2',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      code: 201,
      data: { collaborationId: 'collab-1' },
      message: 'Kolaborasi berhasil ditambahkan',
      status: 'success',
    });
  });

  it('should throw NotFoundError when note does not belong to requester', async () => {
    jest.spyOn(noteRepository, 'verifyNoteOwner').mockResolvedValue(false);
    jest
      .spyOn(collaborationRepository, 'addCollaboration')
      .mockResolvedValue({ id: 'collab-1' });

    await expect(
      addCollaboration(
        {
          user: { id: 'owner-1' },
          validated: {
            noteId: 'note-1',
            userId: 'user-2',
          },
        },
        res
      )
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(collaborationRepository.addCollaboration).not.toHaveBeenCalled();
  });

  it('should throw InvariantError when collaboration insertion fails', async () => {
    jest.spyOn(noteRepository, 'verifyNoteOwner').mockResolvedValue(true);
    jest
      .spyOn(collaborationRepository, 'addCollaboration')
      .mockResolvedValue(null);

    await expect(
      addCollaboration(
        {
          user: { id: 'owner-1' },
          validated: {
            noteId: 'note-1',
            userId: 'user-2',
          },
        },
        res
      )
    ).rejects.toBeInstanceOf(InvariantError);
  });

  it('should delete collaboration and return success response', async () => {
    jest.spyOn(noteRepository, 'verifyNoteOwner').mockResolvedValue(true);
    jest
      .spyOn(collaborationRepository, 'deleteCollaboration')
      .mockResolvedValue({ id: 'collab-1' });

    await deleteCollaboration(
      {
        user: { id: 'owner-1' },
        validated: {
          noteId: 'note-1',
          userId: 'user-2',
        },
      },
      res
    );

    expect(collaborationRepository.deleteCollaboration).toHaveBeenCalledWith({
      noteId: 'note-1',
      userId: 'user-2',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: null,
      message: 'Kolaborasi berhasil dihapus',
      status: 'success',
    });
  });

  it('should throw NotFoundError when collaboration deletion target is missing', async () => {
    jest.spyOn(noteRepository, 'verifyNoteOwner').mockResolvedValue(true);
    jest
      .spyOn(collaborationRepository, 'deleteCollaboration')
      .mockResolvedValue(null);

    await expect(
      deleteCollaboration(
        {
          user: { id: 'owner-1' },
          validated: {
            noteId: 'note-1',
            userId: 'user-2',
          },
        },
        res
      )
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
