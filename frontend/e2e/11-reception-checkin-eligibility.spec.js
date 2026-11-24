import { test, expect } from '@playwright/test';

async function openCheckIn(page, { eligible = false, activePackages = [], court = false, rejectionReason } = {}) {
  let checkedIn = false;
  const reason = rejectionReason || 'Không có lịch đã xác nhận trong khung giờ hiện tại.';
  await page.addInitScript(() => {
    sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
      token: 'checkin-ui-test', role: 'receptionist',
      user: { id: 3, name: 'Lễ tân', role: 'RECEPTIONIST' },
    }));
  });
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    let body = [];
    if (url.pathname.endsWith('/lookup-card')) {
      body = {
        userId: 17, fullName: 'TÔ TUẤN', status: 'ACTIVE', tierBadge: 'HỘI VIÊN MỚI', activePackages,
        todayBookings: [{ bookingId: 4, bookingType: court ? 'COURT' : 'CLASS', title: 'abc',
          startTime: '2026-11-19T22:46:00', endTime: '2026-11-19T22:56:00',
          status: checkedIn && court ? 'CHECKED_IN' : 'CONFIRMED' }],
      };
    } else if (url.pathname.endsWith('/check-in-eligibility')) {
      body = { eligible: eligible && !checkedIn, reason: checkedIn ? 'Hội viên vừa mới check-in trong vòng 5 phút qua.' : eligible ? 'Lịch thanh toán lẻ hợp lệ.' : reason };
    } else if (url.pathname.endsWith('/check-ins') && route.request().method() === 'POST') {
      checkedIn = true;
      body = { checkInId: 1, memberId: 17, memberName: 'TÔ TUẤN', result: 'VALID' };
    } else if (url.pathname.endsWith('/members')) {
      body = { content: [{ userId: 17, fullName: 'TÔ TUẤN' }] };
    }
    await route.fulfill({ json: body });
  });
  await page.goto('/receptionist/checkin');
  await page.getByPlaceholder('Quét mã QR thẻ hội viên hoặc quẹt thẻ từ RFID...').fill('17');
  await page.getByRole('button', { name: 'Tra Cứu Thẻ' }).click();
  await expect(page.getByText('Xác nhận học viên vào tập', { exact: true })).toBeVisible();
}

test('blocks check-in without an eligible booking even with an active package', async ({ page }) => {
  await openCheckIn(page, { activePackages: [{ membershipId: 1, packageName: 'Gói tháng', daysRemaining: 5 }] });
  await expect(page.getByRole('button', { name: 'Chưa thể xác nhận vào tập', exact: true })).toBeDisabled();
  await expect(page.getByText('Chưa có lịch có thể check-in lúc này', { exact: true })).toBeVisible();
  await page.getByText('Thông tin gói tập (1 gói còn hạn)', { exact: true }).click();
  await expect(page.getByText(/Còn hạn 5 ngày/)).toBeVisible();
  await expect(page.getByText('Đã xác nhận đặt chỗ', { exact: true })).toBeVisible();
});

test('allows a paid single class without a package and refreshes eligibility after check-in', async ({ page }) => {
  await openCheckIn(page, { eligible: true });
  await expect(page.getByText('Có thể cho học viên vào tập', { exact: true })).toBeVisible();
  const button = page.getByRole('button', { name: 'Xác nhận vào tập', exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByRole('status')).toContainText('ĐIỂM DANH THÀNH CÔNG');
  await expect(page.getByRole('button', { name: 'Chưa thể xác nhận vào tập', exact: true })).toBeDisabled();
  await expect(page.getByText('Học viên vừa được check-in', { exact: true })).toBeVisible();
});

test('blocks an ineligible court booking button', async ({ page }) => {
  await openCheckIn(page, { court: true });
  await expect(page.getByRole('button', { name: 'Check-in sân này', exact: true })).toBeDisabled();
});

test('uses the selected profile eligibility for manual check-in', async ({ page }) => {
  await openCheckIn(page);
  await page.getByRole('button', { name: 'Đóng hồ sơ' }).click();
  await page.locator('#member-search').fill('Tuấn');
  await page.getByRole('button', { name: /TÔ TUẤN.*#17/ }).click();
  await expect(page.getByText('Xác nhận học viên vào tập', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chưa thể xác nhận vào tập', exact: true })).toBeDisabled();
});


test('explains a released class reservation without asking the receptionist to sell another package', async ({ page }) => {
  await openCheckIn(page, { rejectionReason: 'Quota buổi học không còn được giữ.', activePackages: [
    { membershipId: 1, packageName: 'Khóa Pickleball', daysRemaining: 41, remainingSessions: 2, heldSessions: 0, usedSessions: 8 },
  ] });
  await expect(page.getByText('Cần kiểm tra lượt tập của lịch này', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mở danh sách lớp' })).toHaveAttribute('href', '/receptionist/classes');
  await expect(page.getByRole('link', { name: 'Mở quầy thu ngân →', exact: true })).toHaveCount(0);
  await expect(page.getByText('Quota buổi học không còn được giữ.', { exact: true })).toHaveCount(0);
  await page.getByText('Thông tin gói tập (1 gói còn hạn)', { exact: true }).click();
  await expect(page.getByText(/Có thể đặt thêm: 2 buổi/)).toBeVisible();
  await expect(page.getByText(/Đã giữ cho lịch: 0 buổi/)).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('checkin-guide.png'), fullPage: true });
});
