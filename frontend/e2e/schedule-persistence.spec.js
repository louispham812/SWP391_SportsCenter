import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginMember, logoutMember } from './helpers.js';

test.afterEach(async ({ page }) => {
  await logoutMember(page);
});

test('dashboard and schedule read the confirmed booking back from the database', async ({ page }) => {
  const bookingData = JSON.parse(
    fs.readFileSync(path.join(import.meta.dirname, '.booking-test-data.json'), 'utf8'),
  );
  await loginMember(page);

  const session = await page.evaluate(() => JSON.parse(
    sessionStorage.getItem('sports-center-auth-session') || 'null',
  ));
  const scheduleResponse = await page.request.get(`${apiBaseUrl}/booking-flow/schedule`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(scheduleResponse.ok()).toBeTruthy();
  const schedule = await scheduleResponse.json();
  expect(schedule).toContainEqual(expect.objectContaining(bookingData));

  await page.reload();
  await expect(page.getByText(bookingData.title, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Mở thời khóa biểu' }).click();
  await expect(page).toHaveURL(/\/member\/schedule$/);
  await expect(page.getByText(bookingData.title, { exact: true })).toBeVisible();

});
