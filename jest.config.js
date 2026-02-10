module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!src/db/**'
  ],
  coverageDirectory: 'coverage',
  globalTeardown: './tests/globalTeardown.js',
  testTimeout: 30000,
  // Use a unique port for test server
  globals: {
    TEST_PORT: 4999
  }
};
