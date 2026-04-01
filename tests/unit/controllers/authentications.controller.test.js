import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  AuthenticationError,
  InvariantError,
} from '../../../src/core/errors/index.js';
import authenticationRepository from '../../../src/modules/authentications/authentications.repository.js';
import {
  createAuthentication,
  deleteAuthentication,
  updateAuthentication,
} from '../../../src/modules/authentications/authentications.controller.js';
import userRepository from '../../../src/modules/users/users.repository.js';
import tokenManager from '../../../src/shared/utils/token-manager.js';

function createResponseMock() {
  return {
    end: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  };
}

describe('authentications.controller', () => {
  let res;

  beforeEach(() => {
    res = createResponseMock();
  });

  it('should create authentication and return access and refresh token', async () => {
    jest
      .spyOn(userRepository, 'verifyCredentials')
      .mockResolvedValue({ id: 'user-1' });
    jest
      .spyOn(tokenManager, 'generateAccessToken')
      .mockReturnValue('access-token');
    jest
      .spyOn(tokenManager, 'generateRefreshToken')
      .mockReturnValue('refresh-token');
    jest
      .spyOn(authenticationRepository, 'storeRefreshToken')
      .mockResolvedValue({
        id: 'auth-1',
        token: 'refresh-token',
      });

    await createAuthentication(
      {
        validated: {
          username: 'johndoe',
          password: 'secret123',
        },
      },
      res
    );

    expect(userRepository.verifyCredentials).toHaveBeenCalledWith(
      'johndoe',
      'secret123'
    );
    expect(authenticationRepository.storeRefreshToken).toHaveBeenCalledWith(
      'refresh-token'
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      code: 201,
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
      message: 'Login berhasil',
      status: 'success',
    });
  });

  it('should throw AuthenticationError when credentials are invalid', async () => {
    jest.spyOn(userRepository, 'verifyCredentials').mockResolvedValue(null);

    await expect(
      createAuthentication(
        {
          validated: {
            username: 'johndoe',
            password: 'wrong-password',
          },
        },
        res
      )
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should refresh access token when refresh token is valid', async () => {
    jest
      .spyOn(authenticationRepository, 'isRefreshTokenExists')
      .mockResolvedValue(true);
    jest
      .spyOn(tokenManager, 'verifyRefreshToken')
      .mockReturnValue({ id: 'user-1' });
    jest
      .spyOn(tokenManager, 'generateAccessToken')
      .mockReturnValue('new-access-token');

    await updateAuthentication(
      {
        validated: {
          refreshToken: 'refresh-token',
        },
      },
      res
    );

    expect(authenticationRepository.isRefreshTokenExists).toHaveBeenCalledWith(
      'refresh-token'
    );
    expect(tokenManager.verifyRefreshToken).toHaveBeenCalledWith(
      'refresh-token'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: {
        accessToken: 'new-access-token',
      },
      message: 'Access token berhasil diperbarui',
      status: 'success',
    });
  });

  it('should throw InvariantError when refresh token is not registered', async () => {
    jest
      .spyOn(authenticationRepository, 'isRefreshTokenExists')
      .mockResolvedValue(false);

    await expect(
      updateAuthentication(
        {
          validated: {
            refreshToken: 'missing-token',
          },
        },
        res
      )
    ).rejects.toBeInstanceOf(InvariantError);
  });

  it('should revoke refresh token when deleting authentication', async () => {
    jest
      .spyOn(authenticationRepository, 'isRefreshTokenExists')
      .mockResolvedValue(true);
    jest
      .spyOn(authenticationRepository, 'deleteRefreshToken')
      .mockResolvedValue('refresh-token');

    await deleteAuthentication(
      {
        validated: {
          refreshToken: 'refresh-token',
        },
      },
      res
    );

    expect(authenticationRepository.deleteRefreshToken).toHaveBeenCalledWith(
      'refresh-token'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 200,
      data: null,
      message: 'Logout berhasil',
      status: 'success',
    });
  });

  it('should throw InvariantError when deleting unknown refresh token', async () => {
    jest
      .spyOn(authenticationRepository, 'isRefreshTokenExists')
      .mockResolvedValue(false);

    await expect(
      deleteAuthentication(
        {
          validated: {
            refreshToken: 'missing-token',
          },
        },
        res
      )
    ).rejects.toBeInstanceOf(InvariantError);
  });
});
