import AppError from './app-error.js';

class InvariantError extends AppError {
  constructor(message) {
    super(message);
    this.name = 'InvariantError';
  }
}

export default InvariantError;
