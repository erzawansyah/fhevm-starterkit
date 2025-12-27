const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  {
    ignores: [
      "node_modules",
      "base",
      "starters",
      "workspace",
      "dist",
      "coverage",
    ],
  },
  {
    files: ["scripts/**/*.ts", "lib/**/*.ts", "starterkit.config.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      quotes: ["error", "double", { avoidEscape: true }],
      semi: ["error", "always"],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
