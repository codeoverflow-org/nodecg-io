/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["<rootDir>/extension/__tests__/**/*.ts", "!**/extension/__tests__/mocks.ts"],
    // Exclude mocks.ts from coverage. It doesn't matter because it is mock code not used
    // but required to make TypeScript compile it.
    coveragePathIgnorePatterns: ["<rootDir>/extension/__tests__/"],
};

export default config;
