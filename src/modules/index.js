import { Router } from 'express';
import notesRouter from './notes/notes.route.js';
import usersRouter from './users/users.route.js';
import authenticationsRouter from './authentications/authentications.route.js';
import collaborationsRouter from './collaborations/collaborations.route.js';

const router = Router();

router.use('/', notesRouter);
router.use('/', usersRouter);
router.use('/', authenticationsRouter);
router.use('/', collaborationsRouter);

export default router;
