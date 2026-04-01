import { Router } from 'express';
import notesRouter from './notes/notes.route.js';

const router = Router();

router.use('/', notesRouter);

export default router;
