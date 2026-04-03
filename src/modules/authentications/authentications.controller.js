import {
  InvariantError,
  AuthenticationError,
} from '../../core/errors/index.js';
import authenticationRepository from './authentications.repository.js';
import userRepository from '../users/users.repository.js';
import tokenManager from '../../shared/utils/token-manager.js';
import sendResponse from '../../shared/utils/response.js';

export async function createAuthentication(req, res) {
  const { username, password } = req.validated ?? req.body;

  const user = await userRepository.verifyCredentials(username, password);
  if (!user) {
    throw new AuthenticationError(
      'Login gagal. Periksa kembali username dan password'
    );
  }

  const accessToken = tokenManager.generateAccessToken({ id: user.id });
  const refreshToken = tokenManager.generateRefreshToken({ id: user.id });

  await authenticationRepository.storeRefreshToken(refreshToken);

  return sendResponse(res, 201, 'Login berhasil', {
    accessToken,
    refreshToken,
  });
}

export async function updateAuthentication(req, res) {
  const { refreshToken } = req.validated ?? req.body;

  const isTokenExists =
    await authenticationRepository.isRefreshTokenExists(refreshToken);
  if (!isTokenExists) {
    throw new InvariantError('Refresh token tidak valid');
  }

  const { id } = tokenManager.verifyRefreshToken(refreshToken);
  const accessToken = tokenManager.generateAccessToken({ id });

  return sendResponse(res, 200, 'Access token berhasil diperbarui', {
    accessToken,
  });
}

export async function deleteAuthentication(req, res) {
  const { refreshToken } = req.validated ?? req.body;

  const isTokenExists =
    await authenticationRepository.isRefreshTokenExists(refreshToken);
  if (!isTokenExists) {
    throw new InvariantError('Refresh token tidak valid');
  }

  const deletedToken =
    await authenticationRepository.deleteRefreshToken(refreshToken);
  if (!deletedToken) {
    throw new InvariantError('Refresh token tidak valid');
  }

  return sendResponse(res, 200, 'Logout berhasil', null);
}
