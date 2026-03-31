import { Router } from 'express';
import { createNotesRouter } from '../services/notes/routes/index.js';

function createRoutes({ noteRepository } = {}) {
  const router = Router();

  router.use('/', createNotesRouter({ repository: noteRepository }));

  return router;
}

export { createRoutes };
export default createRoutes();
