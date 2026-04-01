import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundError } from '../../../src/core/errors/index.js';
import { AuthenticationRepository } from '../../../src/modules/authentications/authentications.repository.js';

describe('AuthenticationRepository', () => {
  let mockPool;
  let repository;

  beforeEach(() => {
    mockPool = {
      end: jest.fn(),
      query: jest.fn(),
    };

    repository = new AuthenticationRepository(mockPool);
  });

  it('should store refresh token and return inserted row', async () => {
    const row = { id: 'auth-1', token: 'refresh-token' };
    mockPool.query.mockResolvedValue({ rows: [row] });

    const result = await repository.storeRefreshToken('refresh-token');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('INSERT INTO authentications'),
        values: [expect.any(String), 'refresh-token'],
      })
    );
    expect(result).toEqual(row);
  });

  it('should delete refresh token and return token value', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ token: 'refresh-token' }] });

    const deletedToken = await repository.deleteRefreshToken('refresh-token');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('DELETE FROM authentications'),
        values: ['refresh-token'],
      })
    );
    expect(deletedToken).toBe('refresh-token');
  });

  it('should throw NotFoundError when deleting unknown refresh token', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    await expect(
      repository.deleteRefreshToken('missing-token')
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should return true when refresh token exists', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ token: 'refresh-token' }] });

    const isExists = await repository.isRefreshTokenExists('refresh-token');

    expect(isExists).toBe(true);
  });

  it('should return false when refresh token does not exist', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const isExists = await repository.isRefreshTokenExists('missing-token');

    expect(isExists).toBe(false);
  });

  it('should close the underlying pool', async () => {
    await repository.close();

    expect(mockPool.end).toHaveBeenCalledTimes(1);
  });
});
