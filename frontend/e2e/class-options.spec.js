import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginMember, logoutMember } from './helpers.js';

function removeLocalTestData() {
  for (const fileName of ['.member-test-data.json', '.booking-test-data.json']) {
    const filePath = path.join(import.meta.dirname, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

test.afterEach(async ({ page }) => {
  await logoutMember(page);
});

test('member checks out a database class and gets a persisted schedule entry', async ({ page }) => {
  await loginMember(page);

  const session = await page.evaluate(() => JSON.parse(
    sessionStorage.getItem('sports-center-auth-session') || 'null',
  ));
  const headers = { Authorization: `Bearer ${session?.token}` };
  const sportsResponse = await page.request.get(`${apiBaseUrl}/public/content/sports`);
  expect(sportsResponse.ok()).toBeTruthy();
  const sports = await sportsResponse.json();
  expect(sports.length).toBeGreaterThan(0);

  let selectedSport = sports[0];
  let availableClasses = [];
  let selectedClass;
  let quote;
  for (const sport of sports) {
    const response = await page.request.get(
      `${apiBaseUrl}/booking-flow/classes?sportId=${encodeURIComponent(sport.sportId)}`,
      { headers },
    );
    expect(response.ok()).toBeTruthy();
    const results = await response.json();
    const eligibleClasses = results.filter(
      (classSession) => classSession.bookedSlots < classSession.maxSlots
        && !['BOOKED', 'CONFIRMED'].includes(classSession.memberBookingStatus)
        && new Date(classSession.startTime).getTime() >= Date.now() + (3 * 60 * 60 * 1000),
    );
    for (const eligibleClass of eligibleClasses) {
      const quoteResponse = await page.request.get(
        `${apiBaseUrl}/booking-flow/quote?bookingType=CLASS&itemId=${eligibleClass.sessionId}`,
        { headers },
      );
      if (!quoteResponse.ok()) continue;
      quote = await quoteResponse.json();
      selectedSport = sport;
      availableClasses = results;
      selectedClass = eligibleClass;
      break;
    }
    if (selectedClass) {
      break;
    }
    if (results.length && availableClasses.length === 0) {
      selectedSport = sport;
      availableClasses = results;
    }
  }

  await page.goto('/member/book/class/sports');
  await expect(page.getByRole('heading', { name: 'Chọn môn thể thao' })).toBeVisible();
  await page.getByRole('button').filter({ hasText: selectedSport.name }).first().click();
  await expect(page).toHaveURL(/\/member\/book\/classes\/\d+$/);
  if (!selectedClass) {
    if (availableClasses.length === 0) {
      await expect(page.getByText('Chưa có lớp sắp diễn ra cho bộ môn này.')).toBeVisible();
    } else {
      await expect(page.locator('article')).toHaveCount(availableClasses.length);
    }
    removeLocalTestData();
    test.skip(true, 'SportsCenterDB has no upcoming class with an available seat for this member.');
  }

  const classIndex = availableClasses.findIndex(
    (classSession) => classSession.sessionId === selectedClass.sessionId,
  );
  expect(quote, 'No upcoming class with an available slot and valid checkout data was found').toBeTruthy();
  expect(Number(quote.originalAmount ?? quote.amount)).toBe(Number(selectedClass.priceAmount));

  const classCards = page.locator('article');
  await expect(classCards).toHaveCount(availableClasses.length);
  await classCards.nth(classIndex).getByRole('button', { name: /Chọn lớp & thanh toán/ }).click();
  await expect(page).toHaveURL(new RegExp(`/member/book/checkout/class/${selectedClass.sessionId}$`));
  await expect(page.getByRole('heading', { name: 'Xác nhận booking & thanh toán' })).toBeVisible();
  await expect(page.getByText(selectedClass.className, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Sandbox/i }).click();
  await page.getByRole('button', { name: /Xác Nhận & Thanh Toán/i }).click();

  await expect(page).toHaveURL(/\/member\/book\/confirmation$/);
  await expect(page.getByRole('heading', { name: 'Booking đã xác nhận' })).toBeVisible();
  await expect(page.getByText(/PAID/)).toBeVisible();
  await expect(page.getByText(selectedClass.className, { exact: true })).toBeVisible();

  const scheduleResponse = await page.request.get(`${apiBaseUrl}/booking-flow/schedule`, {
    headers,
  });
  expect(scheduleResponse.ok()).toBeTruthy();
  const schedule = await scheduleResponse.json();
  const savedBooking = schedule.find(
    (booking) => booking.bookingType === 'CLASS'
      && booking.title === selectedClass.className
      && booking.startTime === selectedClass.startTime,
  );
  expect(savedBooking, 'The class checkout should be visible in the member schedule read-back').toBeTruthy();

  await page.reload();
  await page.goto('/member/schedule');
  await page.getByRole('button', { name: /Lịch lớp học/ }).click();

  const classDate = new Date(selectedClass.startTime);
  const today = new Date();
  const classDay = Date.UTC(classDate.getFullYear(), classDate.getMonth(), classDate.getDate());
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntilClass = Math.floor((classDay - todayDay) / (24 * 60 * 60 * 1000));
  const weekOffset = Math.floor((daysUntilClass + ((today.getDay() + 6) % 7)) / 7);
  for (let week = 0; week < weekOffset; week += 1) {
    await page.getByRole('button', { name: 'Tuần sau' }).click();
  }
  await expect(page.getByText(selectedClass.className, { exact: true }).first()).toBeVisible();

  const bookingCard = page.locator(`[data-booking-id="${savedBooking.bookingId}"]`);
  page.once('dialog', (dialog) => dialog.accept());
  await bookingCard.getByRole('button', { name: /Hủy/i }).click();
  const confirmModalBtn = page.getByRole('button', { name: /Xác Nhận Hủy/i });
  if (await confirmModalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmModalBtn.click();
  }
  await expect(page.getByRole('status')).toContainText('Đã hủy lớp học');
  await expect(bookingCard).toHaveCount(0);

  const cancelledScheduleResponse = await page.request.get(`${apiBaseUrl}/booking-flow/schedule`, {
    headers,
  });
  expect(cancelledScheduleResponse.ok()).toBeTruthy();
  const cancelledSchedule = await cancelledScheduleResponse.json();
  expect(cancelledSchedule).not.toContainEqual(expect.objectContaining({
    bookingType: savedBooking.bookingType,
    bookingId: savedBooking.bookingId,
  }));

  removeLocalTestData();
});
