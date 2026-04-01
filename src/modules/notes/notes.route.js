import express from 'express';
import {
  createNote,
  deleteNoteById,
  getAllNotes,
  getNoteById,
  updateNoteById,
} from './notes.controller.js';
import validateBody from '../../core/middlewares/validate-body.js';
import validateQuery from '../../core/middlewares/validate-query.js';
import authenticateToken from '../../core/middlewares/auth.js';
import { notePayloadSchema, noteQuerySchema } from './notes.schema.js';

const router = express.Router();

router
  .route('/notes')
  .get(authenticateToken, validateQuery(noteQuerySchema), getAllNotes)
  .post(authenticateToken, validateBody(notePayloadSchema), createNote);

router
  .route('/notes/:id')
  .get(authenticateToken, getNoteById)
  .put(authenticateToken, validateBody(notePayloadSchema), updateNoteById)
  .delete(authenticateToken, deleteNoteById);

export default router;
