import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginMember } from './helpers.js';

test.describe('LUỒNG 2: Luồng Đặt Sân, Áp Mã Voucher & Hủy Lịch (Member đặt sân -> Áp Voucher -> Thanh toán -> Xem lịch -> Hủy lịch)', () => {
  test('Quy trình tuần tự liên thông trọn vẹn Luồng 2 trên UI thực tế', async ({ page }) => {
    test.setTimeout(90000);

    // BƯỚC 1: Đăng nhập Member
    console.log('--- BƯỚC 1: Đăng nhập Member & tìm khung giờ hợp lệ ---');
    await loginMember(page);

    const session = await page.evaluate(() => JSON.parse(
      sessionStorage.getItem('sports-center-auth-session') || 'null',
    ));
    const authHeaders = { Authorization: `Bearer ${session.token}` };

    // Lấy danh sách môn thể thao và tìm khung giờ cách hiện tại > 3 tiếng để test hủy lịch
    const sportsResponse = await page.request.get(`${apiBaseUrl}/public/content/sports`);
    expect(sportsResponse.ok()).toBeTruthy();
    const sports = await sportsResponse.json();

    let selectedSport;
    let selectedSlot;
    for (const sport of sports) {
      const slotsResponse = await page.request.get(
        `${apiBaseUrl}/booking-flow/courts?sportId=${encodeURIComponent(sport.sportId)}`,
        { headers: authHeaders },
      );
      if (!slotsResponse.ok()) continue;
      const slots = await slotsResponse.json();
      const cancellableSlot = slots.find(
        (slot) => new Date(slot.startTime).getTime() >= Date.now() + (3.5 * 60 * 60 * 1000),
      );
      if (cancellableSlot) {
        selectedSport = sport;
        selectedSlot = cancellableSlot;
        break;
      }
    }
    expect(selectedSlot, 'Phải có ít nhất 1 khung giờ trống cách hiện tại > 3.5 tiếng để kiểm thử đặt và hủy sân').toBeTruthy();
    console.log(`Đã chọn môn: ${selectedSport.name}, sân: ${selectedSlot.courtName}, giờ: ${selectedSlot.startTime}`);

    // BƯỚC 2: Thao tác đặt sân trên UI
    console.log('--- BƯỚC 2: Thao tác chọn sân và khung giờ trên UI ---');
    await page.goto(`/member/book/courts/${selectedSport.sportId}`);
    await expect(page.getByRole('heading', { name: /Chọn sân và khung giờ/i })).toBeVisible({ timeout: 7000 });

    // Chọn ngày tương ứng trên UI
    const slotDateLabel = new Date(`${selectedSlot.startTime.slice(0, 10)}T12:00:00`).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
    await page.getByRole('button', { name: slotDateLabel, exact: true }).click();

    // Chọn khung giờ trên UI
    const slotLabel = new Date(selectedSlot.startTime).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const timeSlotBtn = page.getByRole('button', { name: new RegExp(`^${slotLabel}`) }).first();
    await timeSlotBtn.click();

    // Bấm nút "Tiếp tục thanh toán"
    const nextBtn = page.getByRole('button', { name: /Tiếp tục thanh toán/i });
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    await nextBtn.click();

    // BƯỚC 3: Màn hình Checkout - Áp Voucher & Thanh toán Sandbox
    console.log('--- BƯỚC 3: Màn hình Checkout, áp Voucher và thanh toán Sandbox ---');
    await expect(page).toHaveURL(/\/member\/book\/checkout\/court\//);
    await expect(page.getByRole('heading', { name: /Xác nhận booking & thanh toán/i })).toBeVisible({ timeout: 7000 });

    // Áp mã Voucher ưu đãi trên UI
    const voucherInput = page.getByPlaceholder(/Nhập mã/i);
    if (await voucherInput.isVisible()) {
      await voucherInput.fill('SPORTSHUB10');
      await page.getByRole('button', { name: /Áp Dụng/i }).click();
      // Kiểm tra giảm giá hiển thị trên UI
      await expect(page.getByText(/Voucher ưu đãi|SPORTSHUB10/i).first()).toBeVisible({ timeout: 5000 });
      console.log('Đã áp dụng thành công mã voucher SPORTSHUB10 trên UI');
    }

    // Chọn Sandbox Mode
    await page.getByRole('button', { name: /Sandbox/i }).click();

    // Bấm Xác Nhận & Thanh Toán
    const confirmPaymentBtn = page.getByRole('button', { name: /Xác Nhận & Thanh Toán/i });
    await expect(confirmPaymentBtn).toBeVisible();
    await confirmPaymentBtn.click();

    // Chờ màn hình xác nhận booking
    await expect(page).toHaveURL(/\/member\/book\/confirmation$/);
    await expect(page.getByRole('heading', { name: /Booking đã xác nhận/i })).toBeVisible({ timeout: 7000 });
    await expect(page.getByText(/PAID/)).toBeVisible();
    console.log('Đặt sân & Thanh toán thành công trên UI');

    // BƯỚC 4: Vào /member/schedule kiểm tra và hủy đặt chỗ
    console.log('--- BƯỚC 4: Kiểm tra lịch trên UI và thực hiện hủy lịch ---');
    await page.goto('/member/schedule');
    await expect(page).toHaveURL(/\/member\/schedule/);

    // Tìm thẻ lịch sắp tới có nút Hủy của sân vừa đặt
    const activeBookingCard = page.locator('article', { hasText: selectedSlot.courtName }).filter({ hasText: /Hủy \(Hoàn 100%\)/i }).first();
    await expect(activeBookingCard).toBeVisible({ timeout: 7000 });
    console.log('Đã hiển thị lịch tập sắp tới của sân trên trang Lịch của tôi');

    // Bấm nút "Hủy (Hoàn 100%)"
    const cancelBtn = activeBookingCard.getByRole('button', { name: /Hủy \(Hoàn 100%\)/i });
    await expect(cancelBtn).toBeVisible({ timeout: 5000 });
    await cancelBtn.click();

    // Modal xác nhận hủy mở ra
    const confirmCancelBtn = page.getByRole('button', { name: /Xác Nhận Hủy \(Hoàn 100%\)/i });
    await expect(confirmCancelBtn).toBeVisible({ timeout: 5000 });
    await confirmCancelBtn.click();

    // Kiểm tra thông báo hủy thành công
    await expect(page.getByText(/Hủy đặt chỗ thành công|Đã hủy thành công/i).first()).toBeVisible({ timeout: 7000 });
    console.log('HOÀN THÀNH 100% LUỒNG 2: Đặt sân, áp Voucher & Hủy lịch!');
  });
});
