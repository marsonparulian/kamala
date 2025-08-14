module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/../order/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/../../tsconfig.clasp.json",
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/../../jest.setup.js"],
};
