import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import userRepository from '../../src/modules/users/users.repository.js';
import {
  clearUsersTable,
  closeTestDatabase,
  seedUser,
  setupTestDatabase,
} from '../helpers/database.js';

describe('Users API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearUsersTable();
  });

  afterAll(async () => {
    await userRepository.close();
    await closeTestDatabase();
  });

  it('should create a user via POST /users', async () => {
    const response = await request(app).post('/users').send({
      username: 'johndoe',
      fullname: 'John Doe',
      password: 'secret123',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      code: 201,
      data: { userId: expect.any(String) },
      message: 'Pengguna berhasil ditambahkan',
      status: 'success',
    });
  });

  it('should reject invalid payload via POST /users', async () => {
    const response = await request(app).post('/users').send({
      username: 'ab',
      fullname: 'Jo',
      password: '123',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      code: 400,
      data: null,
      status: 'failed',
    });
  });

  it('should reject duplicate username via POST /users', async () => {
    await seedUser({
      id: 'user-dup',
      username: 'johndoe',
      fullname: 'John Doe',
      password: 'hashed-password',
    });

    const response = await request(app).post('/users').send({
      username: 'johndoe',
      fullname: 'John Duplicate',
      password: 'secret123',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      code: 400,
      data: null,
      message: 'Pengguna gagal ditambahkan. Username sudah digunakan',
      status: 'failed',
    });
  });

  it('should return user detail via GET /users/:id', async () => {
    await seedUser({
      id: 'user-detail',
      username: 'janedoe',
      fullname: 'Jane Doe',
      password: 'hashed-password',
    });

    const response = await request(app).get('/users/user-detail');

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      code: 200,
      data: {
        user: {
          id: 'user-detail',
          username: 'janedoe',
          fullname: 'Jane Doe',
        },
      },
      message: 'Pengguna sukses ditampilkan',
      status: 'success',
    });
    expect(response.body.data.user.password).toBeUndefined();
  });

  it('should return 404 for missing user detail', async () => {
    const response = await request(app).get('/users/user-404');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      code: 404,
      data: null,
      message: 'Gagal mengambil pengguna. Id tidak ditemukan',
      status: 'failed',
    });
  });
});
