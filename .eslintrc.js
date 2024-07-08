module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["plugin:prettier/recommended", "prettier", "eslint:recommended"],
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: "tsconfig.json",
  },
  env: {
    es6: true,
    node: true,
  },
  rules: {
    semi: "off",
    "@typescript-eslint/semi": "error",
    "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
  },
};
