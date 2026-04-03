import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CollaborationRepository } from '../../../src/modules/collaborations/collaborations.repository.js';

describe('CollaborationRepository', () => {
  let mockPool;
  let repository;

  beforeEach(() => {
    mockPool = {
      end: jest.fn(),
      query: jest.fn(),
    };

    repository = new CollaborationRepository(mockPool);
  });

  it('should add collaboration and return inserted row', async () => {
    const row = {
      id: 'collab-1',
      ['note_id']: 'note-1',
      ['user_id']: 'user-2',
    };
    mockPool.query.mockResolvedValue({ rows: [row] });

    const result = await repository.addCollaboration({
      noteId: 'note-1',
      userId: 'user-2',
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('INSERT INTO collaborations'),
        values: [expect.any(String), 'note-1', 'user-2'],
      })
    );
    expect(result).toEqual(row);
  });

  it('should delete collaboration and return deleted row', async () => {
    const row = { id: 'collab-1' };
    mockPool.query.mockResolvedValue({ rows: [row] });

    const result = await repository.deleteCollaboration({
      noteId: 'note-1',
      userId: 'user-2',
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('DELETE FROM collaborations'),
        values: ['note-1', 'user-2'],
      })
    );
    expect(result).toEqual(row);
  });

  it('should return null when deleting unknown collaboration', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    await expect(
      repository.deleteCollaboration({
        noteId: 'note-1',
        userId: 'user-2',
      })
    ).resolves.toBeNull();
  });

  it('should return true when collaborator exists', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: 'collab-1' }] });

    const isCollaborator = await repository.verifyCollaborator({
      noteId: 'note-1',
      userId: 'user-2',
    });

    expect(isCollaborator).toBe(true);
  });

  it('should return false when collaborator does not exist', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const isCollaborator = await repository.verifyCollaborator({
      noteId: 'note-1',
      userId: 'user-2',
    });

    expect(isCollaborator).toBe(false);
  });

  it('should close the underlying pool', async () => {
    await repository.close();

    expect(mockPool.end).toHaveBeenCalledTimes(1);
  });
});
