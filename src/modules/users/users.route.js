import express from 'express';
import { createUser, getUserById } from './users.controller.js';
import validateBody from '../../core/middlewares/validate-body.js';
import { userPayloadSchema } from './users.schema.js';

const router = express.Router();

router.route('/users').post(validateBody(userPayloadSchema), createUser);

router.route('/users/:id').get(getUserById);

export default router;
