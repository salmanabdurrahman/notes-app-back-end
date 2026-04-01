import express from 'express';
import validateBody from '../../core/middlewares/validate-body.js';
import {
  createAuthentication,
  deleteAuthentication,
  updateAuthentication,
} from './authentications.controller.js';
import {
  loginPayloadSchema,
  refreshTokenPayloadSchema,
  revokeTokenPayloadSchema,
} from './authentications.schema.js';

const router = express.Router();

router
  .route('/authentications')
  .post(validateBody(loginPayloadSchema), createAuthentication)
  .put(validateBody(refreshTokenPayloadSchema), updateAuthentication)
  .delete(validateBody(revokeTokenPayloadSchema), deleteAuthentication);

export default router;
