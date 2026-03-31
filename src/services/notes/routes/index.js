import express from 'express';
import {
  createNote,
  deleteNoteById,
  editNoteById,
  getAllNotes,
  getNoteById,
} from '../controller/note-controller.js';
import validate from '../../../middlewares/validate.js';
import validateQuery from '../../../middlewares/validate-query.js';
import {
  notePayloadSchema,
  noteQuerySchema,
} from '../../../services/notes/validator/schema.js';

const router = express.Router();

router
  .route('/notes')
  .get(validateQuery(noteQuerySchema), getAllNotes)
  .post(validate(notePayloadSchema), createNote);

router
  .route('/notes/:id')
  .get(getNoteById)
  .put(validate(notePayloadSchema), editNoteById)
  .delete(deleteNoteById);

export default router;
