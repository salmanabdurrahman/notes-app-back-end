import tokenManager from '../../shared/utils/token-manager.js';
import { AuthenticationError } from '../../core/errors/index.js';

async function authenticateToken(req, res, next) {
  void res;

  const authorizationHeader = req.headers.authorization;
  const token = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : null;

  if (!token) {
    return next(new AuthenticationError('Token tidak ditemukan'));
  }

  try {
    req.user = tokenManager.verifyAccessToken(token);
    return next();
  } catch (err) {
    return next(err);
  }
}

export default authenticateToken;
