// Bridge file for ESLint v9 flat config to reuse existing .eslintrc
// See https://eslint.org/docs/latest/use/configure/migration-guide#using-a-compatibility-config
const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  ...compat.config({ extends: ['./.eslintrc.cjs'] }),
];
