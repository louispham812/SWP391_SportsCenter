import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginManager, loginMember, logoutMember } from './helpers.js';

test.describe('Admin Facilities 1-1 Mapping & Independent Synchronization', () => {
  test('Admin sees 16 facilities matching member courts 1-1; toggling Facility 16 does not touch Facility 12 and vice versa', async ({ page, request }) => {
    // Step 1: Login Manager
    await loginManager(page);
    const session = await page.evaluate(() => JSON.parse(
      sessionStorage.getItem('sports-center-auth-session') || 'null',
    ));
    const authHeaders = { Authorization: `Bearer ${session.token}` };

    // Reset both Facility 16 and Facility 12 to AVAILABLE
    await request.patch(`${apiBaseUrl}/manager/facilities/16/status`, {
      headers: authHeaders,
      data: { status: 'AVAILABLE' },
    });
    await request.patch(`${apiBaseUrl}/manager/facilities/12/status`, {
      headers: authHeaders,
      data: { status: 'AVAILABLE' },
    });

    // Step 2: Verify Admin Facilities page
    await page.goto('/admin/facilities');
    await expect(page.getByText('Cơ sở, Sân Bãi & Lịch Bảo Trì')).toBeVisible();

    // Check facility cards count: must be exactly 16
    const facilityArticles = page.locator('article').filter({ hasText: 'Mã cơ sở: #' });
    await expect(facilityArticles).toHaveCount(16);

    // Locate Facility 16 card (Sân Cầu Lông Trong Nhà - Sân B1) and Facility 12 card (Hồ Bơi - Làn S1)
    const badmintonCard = page.locator('article').filter({ hasText: 'Sân Cầu Lông Trong Nhà - Sân B1' });
    const poolCard = page.locator('article').filter({ hasText: 'Hồ Bơi - Làn S1' });

    await expect(badmintonCard).toBeVisible();
    await expect(badmintonCard.getByText('Sẵn sàng hoạt động')).toBeVisible();
    await expect(poolCard).toBeVisible();
    await expect(poolCard.getByText('Sẵn sàng hoạt động')).toBeVisible();

    // Step 3: Toggle Facility 8 to MAINTENANCE
    await badmintonCard.getByRole('button', { name: /Tạm khóa bảo trì/i }).click();

    // Verify Facility 8 is now "Bảo trì tạm khóa"
    await expect(badmintonCard.getByText('Bảo trì tạm khóa')).toBeVisible();

    // CRITICAL INDEPENDENCE CHECK: Facility 12 MUST STILL BE "Sẵn sàng hoạt động"!
    await expect(poolCard.getByText('Sẵn sàng hoạt động')).toBeVisible();
    await expect(poolCard.getByText('Bảo trì tạm khóa')).not.toBeVisible();

    // Verify on Member Booking for Badminton (Court 10: Sân cầu lông 01 should be MAINTENANCE)
    const courtSlotsBadminton = await request.get(`${apiBaseUrl}/booking-flow/courts?sportId=6`);
    expect(courtSlotsBadminton.ok()).toBeTruthy();
    const badSlots = await courtSlotsBadminton.json();
    const court10Slots = badSlots.filter((s) => s.courtId === 10);
    expect(court10Slots.length).toBeGreaterThan(0);
    expect(court10Slots.every((s) => s.status === 'MAINTENANCE')).toBeTruthy();

    // Verify Swimming (Court 16: Làn bơi 01) is STILL AVAILABLE and NOT affected!
    const courtSlotsSwim = await request.get(`${apiBaseUrl}/booking-flow/courts?sportId=9`);
    expect(courtSlotsSwim.ok()).toBeTruthy();
    const swimSlots = await courtSlotsSwim.json();
    const court16Avail = swimSlots.filter((s) => s.courtId === 16 && (!s.status || s.status === 'AVAILABLE'));
    expect(court16Avail.length).toBeGreaterThan(0);

    // Step 4: Toggle Facility 12 to MAINTENANCE
    await poolCard.getByRole('button', { name: /Tạm khóa bảo trì/i }).click();
    await expect(poolCard.getByText('Bảo trì tạm khóa')).toBeVisible();

    // Restore Facility 8 to AVAILABLE
    await badmintonCard.getByRole('button', { name: /Mở lại hoạt động/i }).click();
    await expect(badmintonCard.getByText('Sẵn sàng hoạt động')).toBeVisible();

    // CRITICAL INDEPENDENCE CHECK: Facility 12 MUST STILL BE "Bảo trì tạm khóa"!
    await expect(poolCard.getByText('Bảo trì tạm khóa')).toBeVisible();
    await expect(poolCard.getByText('Sẵn sàng hoạt động')).not.toBeVisible();

    // Restore Facility 12 to AVAILABLE for clean teardown
    await poolCard.getByRole('button', { name: /Mở lại hoạt động/i }).click();
    await expect(poolCard.getByText('Sẵn sàng hoạt động')).toBeVisible();
  });
});
