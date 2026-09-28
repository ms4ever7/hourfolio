module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./src/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/restyle|react-native-svg)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-mmkv$': '<rootDir>/src/test/mocks/mmkv.ts',
  },
  testPathIgnorePatterns: ['/node_modules/'],
};
