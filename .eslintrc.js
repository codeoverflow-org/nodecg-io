module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: "module",
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    // Don't traverse fs up to root.
    // This caused problems when nodecg-io was cloned into a NodeCG installation as it then
    // tried to lint nodecg-io with that config.
    root: true, 
    rules: {
        // Use experimental version of unused vars, because the stable one
        // even warns about unused vars with an underscore before them, which is the typescript notation
        // for unused variables.
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars-experimental": "warn",

        // We simply have empty functions at some places, so we ignore this rule.
        "@typescript-eslint/no-empty-function": ["warn", { allow: ["arrowFunctions"] }],

        // Instead of console the integrated nodecg logger should be used.
        "no-console": ["warn"],
    },
};
