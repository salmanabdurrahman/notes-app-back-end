import Joi from 'joi';

export const loginPayloadSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const refreshTokenPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const revokeTokenPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
