import express from 'express';
import {
  addCollaboration,
  deleteCollaboration,
} from './collaborations.controller.js';
import validateBody from '../../core/middlewares/validate-body.js';
import authenticateToken from '../../core/middlewares/auth.js';
import { collaborationPayloadSchema } from './collaborations.schema.js';

const router = express.Router();

router
  .route('/collaborations')
  .post(
    authenticateToken,
    validateBody(collaborationPayloadSchema),
    addCollaboration
  )
  .delete(
    authenticateToken,
    validateBody(collaborationPayloadSchema),
    deleteCollaboration
  );

export default router;
