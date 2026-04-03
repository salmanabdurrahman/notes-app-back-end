export default {
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  restoreMocks: true,
  setupFiles: ['./tests/setup-env.js'],
  setupFilesAfterEnv: ['./tests/setup-after-env.js'],
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
};
