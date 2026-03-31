export default {
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/services/notes/notes.js'],
  restoreMocks: true,
  setupFiles: ['./tests/setup-env.js'],
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
};
