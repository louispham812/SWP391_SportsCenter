import { defineConfig, devices } from '@playwright/test';

const apiBaseUrl = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:8080/api/v1';
const appBaseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const apiPort = new URL(apiBaseUrl).port || '8080';
const appPort = new URL(appBaseUrl).port || '5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: appBaseUrl,
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'domain-e2e',
      testMatch: /\d{2}-.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `mvn -f ../backend/pom.xml spring-boot:run -Dspring-boot.run.arguments=--server.port=${apiPort}`,
      url: `${apiBaseUrl}/public/content/sports`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${appPort}`,
      url: appBaseUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
