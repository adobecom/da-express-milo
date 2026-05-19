module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: { browser: true, mocha: true },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'no-param-reassign': [2, { props: false }],
    'linebreak-style': ['error', 'unix'],
    'no-await-in-loop': 0,
    'max-statements-per-line': ['error', { max: 2 }],
    'import/extensions': ['error', { js: 'always' }],
    'object-curly-newline': 'off',
    'no-return-assign': ['error', 'except-parens'],
    'no-unused-expressions': 0,
    'chai-friendly/no-unused-expressions': 'off',
    'import/no-cycle': 1,
    'import/no-extraneous-dependencies': 0,
    'no-restricted-syntax': 0,
  },
  overrides: [
    {
      files: ['test/**/*.js'],
      rules: { 'no-console': 'off' },
    },
    {
      // Overrides for nala test
      files: ['nala/**/*.cjs', 'nala/**/*.test.cjs'],
      rules: {
        'no-console': 0,
        'import/no-extraneous-dependencies': 0,
        'max-len': 0,
        'chai-friendly/no-unused-expressions': 0,
        'no-plusplus': 0,
        'import/no-cycle': 0,
        'import/extensions': 0,
        'no-unused-vars': 'warn',
        'no-useless-escape': 0,
      },
    },
  ],
  plugins: [
    'chai-friendly',
  ],
  ignorePatterns: ['*.min.js', '*.min.es.js', '*.config.js', '**/templates-as-a-service/library/'],
};
