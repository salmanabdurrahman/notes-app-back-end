import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../../core/errors/index.js';

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_KEY);
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_KEY);
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
  } catch {
    throw new AuthenticationError('Token tidak valid');
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_KEY);
  } catch {
    throw new AuthenticationError('Token tidak valid');
  }
}

const tokenManager = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

export default tokenManager;
