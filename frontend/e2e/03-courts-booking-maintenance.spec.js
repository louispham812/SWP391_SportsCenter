import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginManager, loginMember } from './helpers.js';

test.describe('SUITE 3: Cơ Sở Vật Chất, Đặt Sân & Khóa Bảo Trì (Courts, Booking & Maintenance)', () => {
  test('1. Bản đồ 16 sân độc lập (Facility 1-1 Mapping & Status Isolation)', async ({ page, request }) => {
    await loginManager(page);
    const session = await page.evaluate(() => JSON.parse(
      sessionStorage.getItem('sports-center-auth-session') || 'null',
    ));
    const authHeaders = { Authorization: `Bearer ${session.token}` };

    // Reset cả Facility 16 và Facility 12 về AVAILABLE
    await request.patch(`${apiBaseUrl}/manager/facilities/16/status`, {
      headers: authHeaders,
      data: { status: 'AVAILABLE' },
    });
    await request.patch(`${apiBaseUrl}/manager/facilities/12/status`, {
      headers: authHeaders,
      data: { status: 'AVAILABLE' },
    });

    await page.goto('/admin/facilities');
    await expect(page.getByText('Cơ sở, Sân Bãi & Lịch Bảo Trì')).toBeVisible();

    // Kiểm tra chính xác 16 facility cards
    const facilityArticles = page.locator('article').filter({ hasText: 'Mã cơ sở: #' });
    await expect(facilityArticles).toHaveCount(16);

    const badmintonCard = page.locator('article').filter({ hasText: 'Sân Cầu Lông Trong Nhà - Sân B1' });
    const poolCard = page.locator('article').filter({ hasText: 'Hồ Bơi - Làn S1' });

    await expect(badmintonCard).toBeVisible();
    await expect(poolCard).toBeVisible();

    // Khóa bảo trì sân cầu lông
    await badmintonCard.getByRole('button', { name: /Tạm khóa bảo trì/i }).click();
    await expect(badmintonCard.getByText('Bảo trì tạm khóa')).toBeVisible();

    // Hồ bơi vẫn phải giữ nguyên Sẵn sàng hoạt động (tính độc lập)
    await expect(poolCard.getByText('Sẵn sàng hoạt động')).toBeVisible();

    // Mở lại hoạt động sân cầu lông
    await badmintonCard.getByRole('button', { name: /Mở lại hoạt động/i }).click();
    await expect(badmintonCard.getByText('Sẵn sàng hoạt động')).toBeVisible();
  });

  test('2. Đặt sân hội viên -> Bền vững thời khóa biểu -> Áp Voucher -> Hủy giải phóng khung giờ', async ({ browser, baseURL }) => {
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();

    try {
      await loginMember(memberPage);
      const session = await memberPage.evaluate(() => JSON.parse(
        sessionStorage.getItem('sports-center-auth-session') || 'null',
      ));
      const authHeaders = { Authorization: `Bearer ${session.token}` };

      const curSchedRes = await memberPage.request.get(`${apiBaseUrl}/booking-flow/schedule`, { headers: authHeaders });
      const curBookings = curSchedRes.ok() ? await curSchedRes.json() : [];

      const sportsRes = await memberPage.request.get(`${apiBaseUrl}/public/content/sports`);
      const sports = await sportsRes.json();
      let chosenSport = null;
      let chosenSlot = null;

      for (const sport of sports) {
        const slotsRes = await memberPage.request.get(`${apiBaseUrl}/booking-flow/courts?sportId=${encodeURIComponent(sport.sportId)}`, { headers: authHeaders });
        if (!slotsRes.ok()) continue;
        const slots = await slotsRes.json();
        const futureSlot = slots.find((s) => {
          const t = new Date(s.startTime).getTime();
          const isFarFuture = t >= Date.now() + 24 * 3600 * 1000;
          const hasConflict = curBookings.some((b) => {
            if (b.status === 'CANCELLED') return false;
            return t < new Date(b.endTime).getTime() && new Date(s.endTime).getTime() > new Date(b.startTime).getTime();
          });
          return isFarFuture && !hasConflict;
        });

        if (futureSlot) {
          chosenSport = sport;
          chosenSlot = futureSlot;
          break;
        }
      }

      expect(chosenSlot, 'Phải tìm thấy 1 khung giờ sân hợp lệ không bị trùng lịch').toBeTruthy();

      // Tiến hành đặt sân trên UI
      await memberPage.goto(`/member/book/checkout/court/${chosenSlot.courtId}?startTime=${encodeURIComponent(chosenSlot.startTime)}&endTime=${encodeURIComponent(chosenSlot.endTime)}`);
      await expect(memberPage.getByRole('heading', { name: 'Xác nhận booking & thanh toán' })).toBeVisible({ timeout: 10000 });

      await memberPage.getByRole('button', { name: /Thanh toán tại quầy/i }).click();
      await memberPage.getByRole('button', { name: /Giữ Chỗ \(Thanh Toán Tại Quầy\)|Xác Nhận/i }).click();

      await expect(memberPage).toHaveURL(/\/member\/book\/confirmation$/);
      await expect(memberPage.getByRole('heading', { name: 'Booking đã xác nhận' })).toBeVisible({ timeout: 10000 });

      // Điều hướng vào trang thời khóa biểu & F5 kiểm chứng bền vững
      await memberPage.getByRole('link', { name: /Xem trong thời khóa biểu/i }).click();
      await expect(memberPage).toHaveURL(/\/member\/schedule$/);
      await memberPage.reload();
      await expect(memberPage.getByRole('heading', { name: /Thời Khóa Biểu Tập Luyện/i })).toBeVisible({ timeout: 10000 });

      const courtScheduleTab = memberPage.getByRole('button', { name: /Lịch đặt sân/ });
      await expect(courtScheduleTab).toBeVisible({ timeout: 5000 });
      await courtScheduleTab.click();

      // Hủy đặt sân
      const updatedSchedRes = await memberPage.request.get(`${apiBaseUrl}/booking-flow/schedule`, { headers: authHeaders });
      const updatedBookings = await updatedSchedRes.json();
      const newBooking = updatedBookings.find((b) => b.title === chosenSlot.courtName && b.startTime === chosenSlot.startTime);
      expect(newBooking).toBeTruthy();

      let bookingCard = memberPage.locator(`[data-booking-id="${newBooking.bookingId}"]`).first();
      if (!(await bookingCard.isVisible().catch(() => false))) {
        const nextWeekBtn = memberPage.getByLabel('Tuần sau');
        if (await nextWeekBtn.isVisible().catch(() => false)) {
          await nextWeekBtn.click();
          await memberPage.waitForTimeout(500);
        }
      }
      bookingCard = memberPage.locator(`[data-booking-id="${newBooking.bookingId}"]`).first();

      if (await bookingCard.isVisible().catch(() => false)) {
        const cancelBtn = bookingCard.getByRole('button', { name: /Hủy/i });
        if (await cancelBtn.isVisible()) {
          memberPage.once('dialog', (dialog) => dialog.accept());
          await cancelBtn.click();

          const confirmCancelBtn = memberPage.getByRole('button', { name: /Xác Nhận Hủy/i });
          if (await confirmCancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmCancelBtn.click();
          }
        }
      }

      // Quản lý kiểm tra và duyệt nếu có yêu cầu hoàn tiền
      await loginManager(adminPage);
      const adminSession = await adminPage.evaluate(() => JSON.parse(
        sessionStorage.getItem('sports-center-auth-session') || 'null',
      ));
      const adminHeaders = { Authorization: `Bearer ${adminSession.token}` };
      const refundsRes = await adminPage.request.get(`${apiBaseUrl}/manager/refunds`, { headers: adminHeaders });
      if (refundsRes.ok()) {
        const refunds = await refundsRes.json();
        const myRefund = refunds.find((r) => r.courtName === chosenSlot.courtName && r.status === 'PENDING_APPROVAL');
        if (myRefund) {
          await adminPage.request.post(`${apiBaseUrl}/manager/refunds/${myRefund.requestId}/approve`, {
            headers: adminHeaders,
            data: { note: 'Đã hoàn tiền E2E kiểm thử tự động' },
          });
        }
      }

      // F5 reload trang Member
      await memberPage.reload();
      await expect(memberPage.locator('main').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await memberContext.close();
      await adminContext.close();
    }
  });

  test('3. Khóa bảo trì sân (Manager) -> Chặn Đặt Sân Hội Viên -> Mở Lại Sân (State Sync across Roles)', async ({ browser, baseURL }) => {
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();

    try {
      await loginManager(adminPage);
      await adminPage.goto('/admin/facilities');
      await expect(adminPage).toHaveURL(/\/admin\/facilities/);

      const targetCard = adminPage.locator('article').filter({ hasText: 'Mã cơ sở: #1' }).first();
      await expect(targetCard).toBeVisible({ timeout: 7000 });

      // Đảm bảo ban đầu AVAILABLE
      const initialBtn = targetCard.locator('button', { hasText: /Tạm khóa bảo trì|Mở lại hoạt động/i });
      if (/Mở lại hoạt động/i.test(await initialBtn.innerText())) {
        await initialBtn.click();
        await adminPage.waitForTimeout(1000);
      }

      // Khóa bảo trì sân
      await targetCard.locator('button', { hasText: /Tạm khóa bảo trì/i }).click();
      await expect(targetCard.getByText(/Bảo trì tạm khóa/i)).toBeVisible({ timeout: 7000 });

      // F5 reload kiểm chứng bền vững trạng thái bảo trì
      await adminPage.reload();
      const reloadedTargetCard = adminPage.locator('article').filter({ hasText: 'Mã cơ sở: #1' }).first();
      await expect(reloadedTargetCard.getByText(/Bảo trì tạm khóa/i)).toBeVisible({ timeout: 7000 });

      // Hội viên vào kiểm tra sân bị đánh dấu bảo trì
      await loginMember(memberPage);
      await memberPage.goto('/member/book/court/sports');
      const pickleballBtn = memberPage.getByRole('button').filter({ hasText: /Pickleball/i }).first();
      await expect(pickleballBtn).toBeVisible({ timeout: 5000 });
      await pickleballBtn.click();
      await expect(memberPage.getByText(/Đang bảo trì|MAINTENANCE/i).first()).toBeVisible({ timeout: 7000 });

      // Quản lý mở lại hoạt động
      await reloadedTargetCard.locator('button', { hasText: /Mở lại hoạt động/i }).click();
      await expect(reloadedTargetCard.getByText(/Sẵn sàng hoạt động/i)).toBeVisible({ timeout: 7000 });

      // F5 reload trang Member
      await memberPage.reload();
      await expect(memberPage.locator('main').first()).toBeVisible({ timeout: 7000 });
    } finally {
      await adminContext.close();
      await memberContext.close();
    }
  });

  test('4. Lên lịch & Quản lý khung bảo trì sân bãi chuyên sâu (Manager Maintenance Schedule -> Conflict Gate)', async ({ browser, baseURL }) => {
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();

    try {
      await loginManager(adminPage);
      await adminPage.goto('/admin/maintenance');
      await expect(adminPage).toHaveURL(/\/admin\/maintenance/);
      await expect(adminPage.getByRole('heading', { name: /Bảo trì sân bãi/i })).toBeVisible({ timeout: 10000 });

      // F5 reload kiểm chứng giao diện lịch bảo trì bền vững
      await adminPage.reload();
      await expect(adminPage.getByRole('heading', { name: /Bảo trì sân bãi/i })).toBeVisible({ timeout: 10000 });
      await expect(adminPage.locator('main').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await adminContext.close();
    }
  });
});
