import { Router } from 'express';
import notesRouter from './notes/notes.route.js';
import usersRouter from './users/users.route.js';

const router = Router();

router.use('/', notesRouter);
router.use('/', usersRouter);

export default router;
