import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
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
  ],
  webServer: [
    {
      command: 'mvn -f ../backend/pom.xml spring-boot:run',
      url: 'http://127.0.0.1:8080/api/v1/public/content/sports',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
