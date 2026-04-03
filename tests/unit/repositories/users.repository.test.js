import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import { UserRepository } from '../../../src/modules/users/users.repository.js';

describe('UserRepository', () => {
  let mockPool;
  let repository;

  beforeEach(() => {
    mockPool = {
      end: jest.fn(),
      query: jest.fn(),
    };

    repository = new UserRepository(mockPool);
  });

  it('should return a user by id', async () => {
    const row = { id: 'user-1', username: 'johndoe', fullname: 'John Doe' };
    mockPool.query.mockResolvedValue({ rows: [row] });

    const user = await repository.findById('user-1');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        values: ['user-1'],
      })
    );
    expect(user).toEqual(row);
  });

  it('should return null when user is not found by id', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    await expect(repository.findById('missing-user')).resolves.toBeNull();
  });

  it('should create a user with hashed password and return inserted row', async () => {
    const row = { id: 'user-1', username: 'johndoe', fullname: 'John Doe' };
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');
    mockPool.query.mockResolvedValue({ rows: [row] });

    const user = await repository.create({
      username: 'johndoe',
      fullname: 'John Doe',
      password: 'secret123',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('INSERT INTO users'),
        values: [expect.any(String), 'johndoe', 'John Doe', 'hashed-password'],
      })
    );
    expect(user).toEqual(row);
  });

  it('should return true when username is already taken', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ username: 'johndoe' }] });

    const isTaken = await repository.isUsernameTaken('johndoe');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        values: ['johndoe'],
      })
    );
    expect(isTaken).toBe(true);
  });

  it('should return false when username is available', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const isTaken = await repository.isUsernameTaken('janedoe');

    expect(isTaken).toBe(false);
  });

  it('should return a user by username', async () => {
    const row = { id: 'user-1', username: 'johndoe', fullname: 'John Doe' };
    mockPool.query.mockResolvedValue({ rows: [row] });

    const user = await repository.getUserByUsername('johndoe');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.objectContaining({
        values: ['johndoe'],
      })
    );
    expect(user).toEqual(row);
  });

  it('should return null when user is not found by username', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    await expect(
      repository.getUserByUsername('missing-user')
    ).resolves.toBeNull();
  });

  it('should close the underlying pool', async () => {
    await repository.close();

    expect(mockPool.end).toHaveBeenCalledTimes(1);
  });
});
