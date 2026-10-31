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
      name: 'member-setup',
      testMatch: /auth\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'court-checkout',
      testMatch: /court-booking\.spec\.js/,
      dependencies: ['member-setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'schedule-readback',
      testMatch: /schedule-persistence\.spec\.js/,
      dependencies: ['court-checkout'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'class-options',
      testMatch: /class-options\.spec\.js/,
      dependencies: ['schedule-readback'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'comprehensive-roles',
      testMatch: /comprehensive-roles\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'demo-audit',
      testMatch: /demo-audit\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'maintenance-lock',
      testMatch: /maintenance-lock\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'swimming-lane-maintenance',
      testMatch: /swimming-lane-maintenance\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'final-audit',
      testMatch: /final-audit-cross-role\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'flow-e2e',
      testMatch: /flow\d+.*\.spec\.js/,
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
