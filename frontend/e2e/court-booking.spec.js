import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginMember, logoutMember } from './helpers.js';

test.afterEach(async ({ page }) => {
  await logoutMember(page);
});

test('member selects a database court, checks out, and gets a persisted booking', async ({ page }) => {
  await loginMember(page);

  const sportsResponse = await page.request.get(`${apiBaseUrl}/public/content/sports`);
  expect(sportsResponse.ok()).toBeTruthy();
  const sports = await sportsResponse.json();
  const session = await page.evaluate(() => JSON.parse(
    sessionStorage.getItem('sports-center-auth-session') || 'null',
  ));
  const authHeaders = { Authorization: `Bearer ${session.token}` };

  let selectedSport;
  let selectedSlot;
  for (const sport of sports) {
    const slotsResponse = await page.request.get(
      `${apiBaseUrl}/booking-flow/courts?sportId=${encodeURIComponent(sport.sportId)}`,
      { headers: authHeaders },
    );
    expect(slotsResponse.ok()).toBeTruthy();
    const slots = await slotsResponse.json();
    const cancellableSlot = slots.find(
      (slot) => new Date(slot.startTime).getTime() >= Date.now() + (3 * 60 * 60 * 1000),
    );
    if (cancellableSlot) {
      selectedSport = sport;
      selectedSlot = cancellableSlot;
      break;
    }
  }
  expect(selectedSlot, 'No active court has a free slot at least three hours in the future').toBeTruthy();

  const unauthorizedResponse = await page.request.get(
    `${apiBaseUrl}/booking-flow/schedule`,
  );
  expect(unauthorizedResponse.status()).not.toBe(200);

  await page.goto(`/member/book/courts/${selectedSport.sportId}`);
  await expect(page.getByRole('heading', { name: 'Chọn sân và khung giờ' })).toBeVisible();
  const slotDateLabel = new Date(`${selectedSlot.startTime.slice(0, 10)}T12:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
  await page.getByRole('button', { name: slotDateLabel, exact: true }).click();
  const slotLabel = new Date(selectedSlot.startTime).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  await page.getByRole('button', { name: slotLabel, exact: true }).first().click();

  await expect(page).toHaveURL(/\/member\/book\/checkout\/court\//);
  await expect(page.getByRole('heading', { name: 'Xác nhận booking & thanh toán' })).toBeVisible();
  await expect(page.getByText('Chế độ thanh toán SANDBOX')).toBeVisible();
  await page.getByRole('button', { name: /Xác nhận & thanh toán/ }).click();

  await expect(page).toHaveURL(/\/member\/book\/confirmation$/);
  await expect(page.getByRole('heading', { name: 'Booking đã xác nhận' })).toBeVisible();
  await expect(page.getByText('Thanh toán PAID')).toBeVisible();

  const scheduleResponse = await page.request.get(`${apiBaseUrl}/booking-flow/schedule`, {
    headers: authHeaders,
  });
  expect(scheduleResponse.ok()).toBeTruthy();
  const schedule = await scheduleResponse.json();
  const savedBooking = schedule.find(
    (booking) => booking.bookingType === 'COURT'
      && booking.title === selectedSlot.courtName
      && booking.startTime === selectedSlot.startTime,
  );
  expect(savedBooking, 'The checkout should be visible in the member schedule read-back').toBeTruthy();

  fs.writeFileSync(
    path.join(import.meta.dirname, '.booking-test-data.json'),
    JSON.stringify({
      bookingType: savedBooking.bookingType,
      bookingId: savedBooking.bookingId,
      title: savedBooking.title,
      startTime: savedBooking.startTime,
    }, null, 2),
  );
});
