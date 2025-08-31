module.exports = {
  testEnvironment: 'node', // E2E tests need Node environment, not jsdom
  testMatch: ['**/tests/e2e/**/*.test.js', '**/tests/e2e/**/*.spec.js'],
  testTimeout: 30000,
  setupFilesAfterEnv: [],
  moduleNameMapper: {},
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};