import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginMember, logoutMember } from './helpers.js';

test.afterEach(async ({ page }) => {
  await logoutMember(page);
});

test('member views and cancels a confirmed booking from the separate schedule', async ({ page }) => {
  const bookingData = JSON.parse(
    fs.readFileSync(path.join(import.meta.dirname, '.booking-test-data.json'), 'utf8'),
  );
  await loginMember(page);

  const session = await page.evaluate(() => JSON.parse(
    sessionStorage.getItem('sports-center-auth-session') || 'null',
  ));
  const authHeaders = { Authorization: `Bearer ${session.token}` };
  const scheduleResponse = await page.request.get(`${apiBaseUrl}/booking-flow/schedule`, {
    headers: authHeaders,
  });
  expect(scheduleResponse.ok()).toBeTruthy();
  const schedule = await scheduleResponse.json();
  expect(schedule).toContainEqual(expect.objectContaining(bookingData));

  await page.reload();
  await page.getByRole('link', { name: 'Mở thời khóa biểu' }).click();
  await expect(page).toHaveURL(/\/member\/schedule$/);
  const classScheduleTab = page.getByRole('button', { name: /Lịch lớp học/ });
  const courtScheduleTab = page.getByRole('button', { name: /Lịch đặt sân/ });
  await expect(classScheduleTab).toBeVisible();
  await expect(courtScheduleTab).toBeVisible();

  const bookingTab = bookingData.bookingType === 'CLASS' ? classScheduleTab : courtScheduleTab;
  await bookingTab.click();
  await expect(bookingTab).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(bookingData.title, { exact: true }).first()).toBeVisible();

  if (bookingData.bookingType === 'COURT') {
    const bookingCard = page.locator(`[data-booking-id="${bookingData.bookingId}"]`);
    page.once('dialog', (dialog) => dialog.accept());
    await bookingCard.getByRole('button', { name: /Hủy/i }).click();
    const confirmModalBtn = page.getByRole('button', { name: /Xác Nhận Hủy/i });
    if (await confirmModalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmModalBtn.click();
    }
    await expect(page.getByRole('status')).toContainText('Đã hủy sân');
    await expect(bookingCard).toHaveCount(0);

    const refreshedScheduleResponse = await page.request.get(`${apiBaseUrl}/booking-flow/schedule`, {
      headers: authHeaders,
    });
    expect(refreshedScheduleResponse.ok()).toBeTruthy();
    const refreshedSchedule = await refreshedScheduleResponse.json();
    expect(refreshedSchedule).not.toContainEqual(expect.objectContaining({
      bookingType: bookingData.bookingType,
      bookingId: bookingData.bookingId,
    }));
  }
});
