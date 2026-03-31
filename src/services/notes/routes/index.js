import express from 'express';
import createNoteController from '../controller/note-controller.js';
import noteRepository from '../repositories/index.js';
import validate from '../../../middlewares/validate.js';
import validateQuery from '../../../middlewares/validate-query.js';
import {
  notePayloadSchema,
  noteQuerySchema,
} from '../../../services/notes/validator/schema.js';

function createNotesRouter({ repository = noteRepository } = {}) {
  const router = express.Router();
  const controller = createNoteController(repository);

  router
    .route('/notes')
    .get(validateQuery(noteQuerySchema), controller.getAllNotes)
    .post(validate(notePayloadSchema), controller.createNote);

  router
    .route('/notes/:id')
    .get(controller.getNoteById)
    .put(validate(notePayloadSchema), controller.editNoteById)
    .delete(controller.deleteNoteById);

  return router;
}

export { createNotesRouter };
export default createNotesRouter();
