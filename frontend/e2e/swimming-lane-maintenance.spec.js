import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginManager, loginMember, logoutMember } from './helpers.js';

test.describe('Swimming Lane Maintenance Synchronization', () => {
  test('Manager toggles maintenance on Hồ Bơi - Làn S1, Member sees Làn bơi 01 locked and labeled Đang bảo trì', async ({ page }) => {
    // Step 1: Login as Manager and reset Facility 18 to AVAILABLE via API
    await loginManager(page);
    const session = await page.evaluate(() => JSON.parse(
      sessionStorage.getItem('sports-center-auth-session') || 'null',
    ));
    const mgrAuthHeaders = { Authorization: `Bearer ${session.token}` };

    await page.request.patch(`${apiBaseUrl}/manager/facilities/18/status`, {
      headers: mgrAuthHeaders,
      data: { status: 'AVAILABLE' },
    });

    await page.goto('/admin/facilities');
    await expect(page.getByText('Cơ sở, Sân Bãi & Lịch Bảo Trì')).toBeVisible();

    // Ensure Facility 18 (Hồ Bơi - Làn S1) is visible and Available
    const poolFacilityCard = page.locator('article').filter({ hasText: 'Hồ Bơi - Làn S1' });
    await expect(poolFacilityCard).toBeVisible();
    await expect(poolFacilityCard.getByText('Sẵn sàng hoạt động')).toBeVisible();

    // Step 2: Manager clicks "Tạm khóa bảo trì" on Hồ Bơi - Làn S1
    await expect(poolFacilityCard.getByRole('button', { name: /Tạm khóa bảo trì/i })).toBeVisible();
    await poolFacilityCard.getByRole('button', { name: /Tạm khóa bảo trì/i }).click();

    // Verify facility card updates to "Bảo trì tạm khóa" and button becomes "Mở lại hoạt động"
    await expect(poolFacilityCard.getByText('Bảo trì tạm khóa')).toBeVisible();
    await expect(poolFacilityCard.getByRole('button', { name: /Mở lại hoạt động/i })).toBeVisible();

    // Step 3: Switch to Member and check /member/book/courts/9 (Bơi lội)
    await logoutMember(page);
    await loginMember(page);

    await page.goto('/member/book/courts/9');
    await expect(page.getByText('Chọn sân và khung giờ')).toBeVisible();

    // Locate Court 16 section (Làn bơi 01)
    const court16Section = page.locator('section').filter({ hasText: 'Làn bơi 01' });
    await expect(court16Section).toBeVisible();

    // Verify Làn bơi 01 clearly shows "Đang bảo trì - Tạm ngưng nhận đặt"
    await expect(court16Section.getByText(/Đang bảo trì - Tạm ngưng nhận đặt/i)).toBeVisible();
    await expect(court16Section.getByText(/Sân \/ Làn bơi này đang trong kế hoạch bảo dưỡng định kỳ/i)).toBeVisible();

    // Verify slot buttons in Làn bơi 01 are disabled with "Bảo trì"
    const maintenanceSlots = court16Section.locator('text=Bảo trì');
    const countMaint = await maintenanceSlots.count();
    expect(countMaint).toBeGreaterThan(0);

    // Verify Court 17 (Làn bơi 02) is NOT in maintenance and still has available slots
    const court17Section = page.locator('section').filter({ hasText: 'Làn bơi 02' });
    await expect(court17Section).toBeVisible();
    await expect(court17Section.getByText(/Đang bảo trì/i)).not.toBeVisible();

    // Step 4: Member checks /facilities page
    await page.goto('/facilities');
    await expect(page.getByText('Hệ Thống Tiện Ích & Cơ Sở Vật Chất')).toBeVisible();

    const poolFacilityPublic = page.locator('article').filter({ hasText: 'Hồ bơi - Làn S1' });
    await expect(poolFacilityPublic).toBeVisible();
    await expect(poolFacilityPublic.getByText('ĐANG BẢO TRÌ').first()).toBeVisible();

    // Step 5: Switch back to Manager and restore Hồ Bơi - Làn S1 to AVAILABLE
    await logoutMember(page);
    await loginManager(page);
    await page.goto('/admin/facilities');

    const poolCardRestore = page.locator('article').filter({ hasText: 'Hồ Bơi - Làn S1' });
    await expect(poolCardRestore.getByRole('button', { name: /Mở lại hoạt động/i })).toBeVisible();
    await poolCardRestore.getByRole('button', { name: /Mở lại hoạt động/i }).click();

    await expect(poolCardRestore.getByText('Sẵn sàng hoạt động')).toBeVisible();
    await expect(poolCardRestore.getByRole('button', { name: /Tạm khóa bảo trì/i })).toBeVisible();

    // Step 6: Verify Member view shows Làn bơi 01 restored to active
    await logoutMember(page);
    await loginMember(page);
    await page.goto('/member/book/courts/9');

    const court16Restored = page.locator('section').filter({ hasText: 'Làn bơi 01' });
    await expect(court16Restored).toBeVisible();
    await expect(court16Restored.getByText(/Đang bảo trì - Tạm ngưng nhận đặt/i)).not.toBeVisible();
  });
});
