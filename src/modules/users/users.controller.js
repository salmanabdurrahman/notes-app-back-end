import { InvariantError, NotFoundError } from '../../core/errors/index.js';
import userRepository from './users.repository.js';
import sendResponse from '../../shared/utils/response.js';

export async function createUser(req, res) {
  const { username, fullname, password } = req.validated ?? req.body;

  const isUsernameTaken = await userRepository.isUsernameTaken(username);
  if (isUsernameTaken) {
    throw new InvariantError(
      'Pengguna gagal ditambahkan. Username sudah digunakan'
    );
  }

  const createdUser = await userRepository.create({
    username,
    fullname,
    password,
  });
  if (!createdUser?.id) {
    throw new InvariantError('Pengguna gagal ditambahkan');
  }

  return sendResponse(res, 201, 'Pengguna berhasil ditambahkan', {
    userId: createdUser.id,
  });
}

export async function getUserById(req, res) {
  const { id } = req.params;

  const user = await userRepository.findById(id);
  if (!user) {
    throw new NotFoundError('Gagal mengambil pengguna. Id tidak ditemukan');
  }

  return sendResponse(res, 200, 'Pengguna sukses ditampilkan', { user });
}

export async function getUserByUsername(req, res) {
  const { username } = req.validated ?? req.query;

  const user = await userRepository.getUserByUsername(username);
  if (!user) {
    throw new NotFoundError(
      'Gagal mengambil pengguna. Username tidak ditemukan'
    );
  }

  return sendResponse(res, 200, 'Pengguna sukses ditampilkan', { user });
}
