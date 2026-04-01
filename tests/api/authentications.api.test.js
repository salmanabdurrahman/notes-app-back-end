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
import authenticationRepository from '../../src/modules/authentications/authentications.repository.js';
import userRepository from '../../src/modules/users/users.repository.js';
import {
  clearAuthenticationsTable,
  clearUsersTable,
  closeTestDatabase,
  setupTestDatabase,
} from '../helpers/database.js';

const validUserPayload = {
  username: 'johndoe',
  fullname: 'John Doe',
  password: 'secret123',
};

async function registerUser() {
  return request(app).post('/users').send(validUserPayload);
}

describe('Authentications API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearAuthenticationsTable();
    await clearUsersTable();
  });

  afterAll(async () => {
    await userRepository.close();
    await authenticationRepository.close();
    await closeTestDatabase();
  });

  it('should login and return access and refresh token via POST /authentications', async () => {
    await registerUser();

    const response = await request(app).post('/authentications').send({
      username: validUserPayload.username,
      password: validUserPayload.password,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      code: 201,
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
      message: 'Login berhasil',
      status: 'success',
    });
  });

  it('should reject invalid credentials via POST /authentications', async () => {
    await registerUser();

    const response = await request(app).post('/authentications').send({
      username: validUserPayload.username,
      password: 'invalid-password',
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({
      code: 401,
      data: null,
      message: 'Login gagal. Periksa kembali username dan password',
      status: 'failed',
    });
  });

  it('should refresh access token via PUT /authentications', async () => {
    await registerUser();
    const loginResponse = await request(app).post('/authentications').send({
      username: validUserPayload.username,
      password: validUserPayload.password,
    });

    const response = await request(app).put('/authentications').send({
      refreshToken: loginResponse.body.data.refreshToken,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      code: 200,
      data: {
        accessToken: expect.any(String),
      },
      message: 'Access token berhasil diperbarui',
      status: 'success',
    });
  });

  it('should reject unknown refresh token via PUT /authentications', async () => {
    const response = await request(app).put('/authentications').send({
      refreshToken: 'missing-refresh-token',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      code: 400,
      data: null,
      message: 'Refresh token tidak valid',
      status: 'failed',
    });
  });

  it('should logout and revoke refresh token via DELETE /authentications', async () => {
    await registerUser();
    const loginResponse = await request(app).post('/authentications').send({
      username: validUserPayload.username,
      password: validUserPayload.password,
    });
    const { refreshToken } = loginResponse.body.data;

    const logoutResponse = await request(app).delete('/authentications').send({
      refreshToken,
    });

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.body).toEqual({
      code: 200,
      data: null,
      message: 'Logout berhasil',
      status: 'success',
    });

    const refreshResponse = await request(app).put('/authentications').send({
      refreshToken,
    });
    expect(refreshResponse.statusCode).toBe(400);
  });

  it('should reject invalid payload via PUT /authentications', async () => {
    const response = await request(app).put('/authentications').send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      code: 400,
      data: null,
      status: 'failed',
    });
  });
});
