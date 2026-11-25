import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: { args: ['--disable-gpu', '--disable-gpu-rasterization', '--disable-font-subpixel-positioning'] },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run preview',
      url: 'http://127.0.0.1:4173/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'node tests/browser/lib/serve-baseline.mjs --port 4174',
      url: 'http://127.0.0.1:4174/index.html',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
