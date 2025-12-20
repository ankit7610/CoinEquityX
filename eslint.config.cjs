const globals = {
  fetch: 'readonly',
  Response: 'readonly',
  Request: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  localStorage: 'readonly',
  window: 'readonly',
  document: 'readonly'
};

const unusedVarsRule = ['warn', { args: 'none', ignoreRestSiblings: true }];

module.exports = [
  {
    ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**', 'coverage/**']
  },
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals
    },
    rules: {
      'no-unused-vars': unusedVarsRule
    }
  },
  {
    files: ['frontend/**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals
    },
    rules: {
      'no-unused-vars': unusedVarsRule
    }
  },
  {
    files: ['frontend/tests/**/*.{js,mjs}', 'backend/__tests__/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals
    },
    rules: {
      'no-unused-vars': unusedVarsRule
    }
  }
];
