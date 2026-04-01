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
import noteRepository from '../../src/modules/notes/notes.repository.js';
import tokenManager from '../../src/shared/utils/token-manager.js';
import {
  clearNotesTable,
  closeTestDatabase,
  seedNote,
  setupTestDatabase,
} from '../helpers/database.js';

describe('Notes API', () => {
  let accessToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearNotesTable();
    accessToken = tokenManager.generateAccessToken({ id: 'user-notes-api' });
  });

  afterAll(async () => {
    await noteRepository.close();
    await closeTestDatabase();
  });

  it('should create a note via POST /notes', async () => {
    const response = await request(app)
      .post('/notes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Catatan API',
        body: 'Isi dari API',
        tags: ['api'],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      code: 201,
      data: { noteId: expect.any(String) },
      message: 'Catatan berhasil ditambahkan',
      status: 'success',
    });
  });

  it('should reject invalid payload via POST /notes', async () => {
    const response = await request(app)
      .post('/notes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: '',
        body: 'Isi dari API',
        tags: 'invalid-tag',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      code: 400,
      data: null,
      status: 'failed',
    });
  });

  it('should return filtered notes via GET /notes?title=', async () => {
    await seedNote({
      id: 'note-1',
      title: 'Belajar Node',
    });
    await seedNote({
      id: 'note-2',
      title: 'Belajar Express',
    });
    await seedNote({
      id: 'note-3',
      title: 'Resep Masak',
    });

    const response = await request(app)
      .get('/notes')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ title: 'belajar' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      code: 200,
      message: 'Catatan berhasil diambil',
      status: 'success',
    });
    expect(response.body.data.notes).toHaveLength(2);
    expect(response.body.data.notes.map((note) => note.id)).toEqual(
      expect.arrayContaining(['note-1', 'note-2'])
    );
  });

  it('should return note detail via GET /notes/:id', async () => {
    await seedNote({
      body: 'Isi detail',
      id: 'note-detail',
      tags: ['detail'],
      title: 'Catatan detail',
    });

    const response = await request(app)
      .get('/notes/note-detail')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      code: 200,
      data: {
        note: {
          body: 'Isi detail',
          id: 'note-detail',
          tags: ['detail'],
          title: 'Catatan detail',
        },
      },
      message: 'Catatan sukses ditampilkan',
      status: 'success',
    });
  });

  it('should return 404 for missing note detail', async () => {
    const response = await request(app)
      .get('/notes/note-404')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      code: 404,
      data: null,
      message: 'Gagal mengambil catatan. Id tidak ditemukan',
      status: 'failed',
    });
  });

  it('should update note via PUT /notes/:id', async () => {
    await seedNote({
      id: 'note-update',
      title: 'Judul awal',
    });

    const response = await request(app)
      .put('/notes/note-update')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Judul baru',
        body: 'Isi baru',
        tags: ['baru'],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      code: 200,
      data: {
        body: 'Isi baru',
        id: 'note-update',
        tags: ['baru'],
        title: 'Judul baru',
      },
      message: 'Catatan berhasil diperbarui',
      status: 'success',
    });
  });

  it('should delete note via DELETE /notes/:id', async () => {
    await seedNote({
      id: 'note-delete',
      title: 'Akan dihapus',
    });

    const response = await request(app)
      .delete('/notes/note-delete')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      code: 200,
      data: 'note-delete',
      message: 'Catatan berhasil dihapus',
      status: 'success',
    });
  });

  it('should reject unauthorized request when access token is missing', async () => {
    const response = await request(app).get('/notes');

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({
      code: 401,
      data: null,
      message: 'Token tidak ditemukan',
      status: 'failed',
    });
  });
});
