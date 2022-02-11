/** @type {import("eslint").ESLint.Options} */
module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: "module",
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    // Don't traverse fs up to root.
    // This caused problems when nodecg-io was cloned into a NodeCG installation as it then
    // tried to lint nodecg-io with that config.
    root: true,
    rules: {
        // Allow for unused function arguments when they are prefixed with an underscore.
        // This is the TypeScript convention to mark unused arguments.
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

        // We simply have empty functions at some places, so we ignore this rule.
        "@typescript-eslint/no-empty-function": ["warn", { allow: ["arrowFunctions"] }],

        // Instead of console the integrated nodecg logger should be used.
        "no-console": ["warn"],

        // Enforce triple equals for comparisons
        "eqeqeq": ["warn"],
    },
};
