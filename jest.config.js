export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  resolver: 'jest-ts-webcompat-resolver',
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
};
