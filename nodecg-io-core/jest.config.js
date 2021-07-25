module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/extension/__tests__/**/*.ts", "!**/extension/__tests__/mocks.ts"],
};