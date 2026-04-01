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
import { notePayloadSchema, noteQuerySchema } from './notes.schema.js';

const router = express.Router();

router
  .route('/notes')
  .get(validateQuery(noteQuerySchema), getAllNotes)
  .post(validateBody(notePayloadSchema), createNote);

router
  .route('/notes/:id')
  .get(getNoteById)
  .put(validateBody(notePayloadSchema), updateNoteById)
  .delete(deleteNoteById);

export default router;
