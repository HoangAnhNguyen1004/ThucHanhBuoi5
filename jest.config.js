module.exports = {
  preset: '@react-native/jest-preset',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.cache/',
    '/ChatBuoi5/',
    '/scripts/',
  ],
  cacheDirectory: '<rootDir>/.cache/jest',
};
