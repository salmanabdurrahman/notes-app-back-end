import sendResponse from '../../shared/utils/response.js';
import { AppError } from './index.js';

function errorHandler(err, req, res, next) {
  void req;
  void next;

  if (err instanceof AppError) {
    return sendResponse(res, err.statusCode, err.message, null);
  }

  if (err.isJoi) {
    return sendResponse(res, 400, err.details[0].message, null);
  }

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error('Unhandled error:', err);
  return sendResponse(res, status, message, null);
}

export default errorHandler;
