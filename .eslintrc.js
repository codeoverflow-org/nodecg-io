module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: "module",
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier/@typescript-eslint",
        "plugin:prettier/recommended",
    ],
    rules: {
        // Use experimental version of unused vars, because the stable one
        // even warns about unused vars with an underscore before them, which is the typescript notation
        // for unused variables.
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars-experimental": "warn",

        // We simply have empty functions at some places, so we ignore this rule.
        "@typescript-eslint/no-empty-function": ["warn", { allow: ["arrowFunctions"] }],

        "no-prototype-builtins": "off"
    },
};
