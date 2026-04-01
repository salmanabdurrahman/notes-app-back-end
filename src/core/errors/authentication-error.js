import AppError from './app-error.js';

class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export default AuthenticationError;
