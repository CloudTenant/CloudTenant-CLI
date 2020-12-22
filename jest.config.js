module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '.git', '/dist/'],
  moduleNameMapper: {
    '@src(.*)$': '<rootDir>/src/$1',
    '@core(.*)$': '<rootDir>/src/core/$1',
    '@modules(.*)$': '<rootDir>/src/modules/$1',
    '@common(.*)$': '<rootDir>/src/common/$1',
  },
  setupFiles: ['./setupJest.ts'],
  automock: false,
};
