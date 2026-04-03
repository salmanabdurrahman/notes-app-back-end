import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { InvariantError } from '../../../src/core/errors/index.js';
import userRepository from '../../../src/modules/users/users.repository.js';
import {
  createUser,
  getUserById,
} from '../../../src/modules/users/users.controller.js';

function createResponseMock() {
  return {
    end: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  };
}

describe('users.controller', () => {
  let res;

  beforeEach(() => {
    res = createResponseMock();
  });

  it('should create a user and return user id', async () => {
    jest.spyOn(userRepository, 'isUsernameTaken').mockResolvedValue(false);
    jest.spyOn(userRepository, 'create').mockResolvedValue({ id: 'user-1' });

    await createUser(
      {
        validated: {
          username: 'johndoe',
          fullname: 'John Doe',
          password: 'secret123',
        },
      },
      res
    );

    expect(userRepository.isUsernameTaken).toHaveBeenCalledWith('johndoe');
    expect(userRepository.create).toHaveBeenCalledWith({
      username: 'johndoe',
      fullname: 'John Doe',
      password: 'secret123',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      code: 201,
      data: { userId: 'user-1' },
      message: 'Pengguna berhasil ditambahkan',
      status: 'success',
    });
  });

  it('should throw InvariantError when username is already taken', async () => {
    jest.spyOn(userRepository, 'isUsernameTaken').mockResolvedValue(true);
    jest.spyOn(userRepository, 'create').mockResolvedValue({ id: 'user-1' });

    await expect(
      createUser(
        {
          validated: {
            username: 'johndoe',
            fullname: 'John Doe',
            password: 'secret123',
          },
        },
        res
      )
    ).rejects.toBeInstanceOf(InvariantError);

    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('should return one user by id', async () => {
    const user = {
      id: 'user-1',
      username: 'johndoe',
      fullname: 'John Doe',
    };
    jest.spyOn(userRepository, 'findById').mockResolvedValue(user);

    await getUserById({ params: { id: 'user-1' } }, res);

    expect(userRepository.findById).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: { user },
      message: 'Pengguna sukses ditampilkan',
      status: 'success',
    });
  });

  it('should throw not found error when user id is not found', async () => {
    jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

    await expect(
      getUserById({ params: { id: 'user-404' } }, res)
    ).rejects.toThrow('Gagal mengambil pengguna. Id tidak ditemukan');
  });
});
