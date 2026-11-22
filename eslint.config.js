import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', '.astro/', 'node_modules/', '.superpowers/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
  },
  {
    files: ['src/scripts/**/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },
];
