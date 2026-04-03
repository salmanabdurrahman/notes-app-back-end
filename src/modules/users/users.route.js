import express from 'express';
import {
  createUser,
  getUserById,
  getUserByUsername,
} from './users.controller.js';
import validateBody from '../../core/middlewares/validate-body.js';
import validateQuery from '../../core/middlewares/validate-query.js';
import { userPayloadSchema, userQuerySchema } from './users.schema.js';

const router = express.Router();

router
  .route('/users')
  .post(validateBody(userPayloadSchema), createUser)
  .get(validateQuery(userQuerySchema), getUserByUsername);

router.route('/users/:id').get(getUserById);

export default router;
