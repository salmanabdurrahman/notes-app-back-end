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
import collaborationRepository from '../../src/modules/collaborations/collaborations.repository.js';
import noteRepository from '../../src/modules/notes/notes.repository.js';
import userRepository from '../../src/modules/users/users.repository.js';
import tokenManager from '../../src/shared/utils/token-manager.js';
import {
  clearCollaborationsTable,
  clearNotesTable,
  clearUsersTable,
  closeTestDatabase,
  seedCollaboration,
  seedNote,
  seedUser,
  setupTestDatabase,
} from '../helpers/database.js';

describe('Collaborations API', () => {
  let ownerAccessToken;
  let anotherAccessToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearCollaborationsTable();
    await clearNotesTable();
    await clearUsersTable();

    await seedUser({
      id: 'user-owner-collab-api',
      username: 'ownercollabapi',
      fullname: 'Owner Collab API',
      password: 'hashed-password',
    });
    await seedUser({
      id: 'user-collab-api',
      username: 'collabapi',
      fullname: 'Collaborator API',
      password: 'hashed-password',
    });
    await seedUser({
      id: 'user-another-collab-api',
      username: 'anothercollabapi',
      fullname: 'Another User API',
      password: 'hashed-password',
    });

    ownerAccessToken = tokenManager.generateAccessToken({
      id: 'user-owner-collab-api',
    });
    anotherAccessToken = tokenManager.generateAccessToken({
      id: 'user-another-collab-api',
    });
  });

  afterAll(async () => {
    await noteRepository.close();
    await collaborationRepository.close();
    await userRepository.close();
    await closeTestDatabase();
  });

  it('should add collaboration via POST /collaborations', async () => {
    await seedNote({
      id: 'note-shared-api',
      owner: 'user-owner-collab-api',
      title: 'Shared API note',
    });

    const response = await request(app)
      .post('/collaborations')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        noteId: 'note-shared-api',
        userId: 'user-collab-api',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      code: 201,
      data: { collaborationId: expect.any(String) },
      message: 'Kolaborasi berhasil ditambahkan',
      status: 'success',
    });
  });

  it('should delete collaboration via DELETE /collaborations', async () => {
    await seedNote({
      id: 'note-shared-api',
      owner: 'user-owner-collab-api',
      title: 'Shared API note',
    });
    await seedCollaboration({
      id: 'collab-delete-api',
      noteId: 'note-shared-api',
      userId: 'user-collab-api',
    });

    const response = await request(app)
      .delete('/collaborations')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        noteId: 'note-shared-api',
        userId: 'user-collab-api',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      code: 200,
      data: null,
      message: 'Kolaborasi berhasil dihapus',
      status: 'success',
    });
  });

  it('should return 404 when non owner adds collaboration', async () => {
    await seedNote({
      id: 'note-owner-only-api',
      owner: 'user-owner-collab-api',
      title: 'Owner API note',
    });

    const response = await request(app)
      .post('/collaborations')
      .set('Authorization', `Bearer ${anotherAccessToken}`)
      .send({
        noteId: 'note-owner-only-api',
        userId: 'user-collab-api',
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      code: 404,
      data: null,
      message: 'Catatan tidak ditemukan',
      status: 'failed',
    });
  });

  it('should return 404 when non owner deletes collaboration', async () => {
    await seedNote({
      id: 'note-owner-only-api',
      owner: 'user-owner-collab-api',
      title: 'Owner API note',
    });
    await seedCollaboration({
      id: 'collab-owner-only',
      noteId: 'note-owner-only-api',
      userId: 'user-collab-api',
    });

    const response = await request(app)
      .delete('/collaborations')
      .set('Authorization', `Bearer ${anotherAccessToken}`)
      .send({
        noteId: 'note-owner-only-api',
        userId: 'user-collab-api',
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      code: 404,
      data: null,
      message: 'Catatan tidak ditemukan',
      status: 'failed',
    });
  });

  it('should reject invalid payload via POST /collaborations', async () => {
    const response = await request(app)
      .post('/collaborations')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        noteId: '',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      code: 400,
      data: null,
      status: 'failed',
    });
  });

  it('should return 404 when collaborator user id is not found', async () => {
    await seedNote({
      id: 'note-missing-user',
      owner: 'user-owner-collab-api',
      title: 'Owner API note',
    });

    const response = await request(app)
      .post('/collaborations')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        noteId: 'note-missing-user',
        userId: 'user-not-exists',
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      code: 404,
      data: null,
      message: 'Pengguna tidak ditemukan',
      status: 'failed',
    });
  });

  it('should reject unauthorized request when access token is missing', async () => {
    const response = await request(app).post('/collaborations').send({
      noteId: 'note-1',
      userId: 'user-1',
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({
      code: 401,
      data: null,
      message: 'Token tidak ditemukan',
      status: 'failed',
    });
  });
});
