import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3201' },
  webServer: {
    command: 'node server/index.js',
    env: { DIST_DIR: 'dist', PORT: '3201', HOST: '127.0.0.1' },
    url: 'http://127.0.0.1:3201/api/health',
    reuseExistingServer: false,
  },
});
