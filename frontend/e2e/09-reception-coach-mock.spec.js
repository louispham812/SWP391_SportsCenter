import { test, expect } from '@playwright/test';

// ===== 11-reception-checkin-eligibility.spec.js =====
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

test('filters check-in history by status and accent-insensitive search with a single main landmark', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
      token: 'e2e-recep-token',
      role: 'receptionist',
      user: { id: 3, name: 'Lê Thị Lễ Tân', role: 'RECEPTIONIST' },
    }));
  });

  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/notifications')) return route.fulfill({ json: [] });
    if (path.endsWith('/receptionist/check-ins')) {
      return route.fulfill({
        json: [
          { checkInId: 1, memberName: 'Nguyễn Anh Khoa', phone: '0934567890', checkedInAt: '2026-11-26T08:30:00', result: 'VALID' },
          { checkInId: 2, memberName: 'Trần Minh Tuấn', phone: '0911223344', checkedInAt: '2026-11-26T08:45:00', result: 'INVALID' },
        ],
      });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto('/receptionist/checkin');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByText('Nguyễn Anh Khoa')).toBeVisible();
  await expect(page.getByText('Trần Minh Tuấn')).toBeVisible();

  await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  await expect(page.getByText('Trần Minh Tuấn')).toBeVisible();
  await expect(page.getByText('Nguyễn Anh Khoa')).toHaveCount(0);

  await page.getByRole('button', { name: /Tất cả/ }).click();
  await page.getByPlaceholder('Lọc theo tên / SĐT...').fill('anh khoa');
  await expect(page.getByText('Nguyễn Anh Khoa')).toBeVisible();
  await expect(page.getByText('Trần Minh Tuấn')).toHaveCount(0);

  await page.getByRole('button', { name: 'Xóa lọc lịch sử' }).click();
  await expect(page.getByText('Trần Minh Tuấn')).toBeVisible();
});

// ===== 16-reception-classes-and-fixes.spec.js =====
test('receptionist classes page shows KPI strip, day grouping, duplicate member guard, and Vietnamese labels', async ({ page }) => {
  const now = new Date();
  const start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 90 * 60 * 1000);

  await page.addInitScript(
    ({ role, user }) => {
      sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
        token: 'e2e-receptionist-token',
        role,
        user,
      }));
    },
    { role: 'receptionist', user: { id: 3, name: 'Lê Thị Lễ Tân', email: 'reception.le@sporthub.com', role: 'RECEPTIONIST' } },
  );

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.endsWith('/bookings/receptionist-schedule')) {
      return route.fulfill({
        json: [
          {
            sessionId: 101,
            className: 'Lớp Pickleball Nâng Cao',
            sportName: 'Pickleball',
            coachName: 'Trần Văn Minh',
            facilityName: 'Sân P2',
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            bookedSlots: 1,
            maxSlots: 8,
            priceAmount: 180000,
            status: 'SCHEDULED',
          },
        ],
      });
    }
    if (path.endsWith('/classes/101/roster')) {
      return route.fulfill({
        json: [
          {
            bookingId: 55,
            memberId: 9,
            memberName: 'Nguyễn Anh Khoa',
            memberPhone: '0934567890',
            bookingStatus: 'CONFIRMED',
            attendanceStatus: 'PENDING',
          },
        ],
      });
    }
    if (path.endsWith('/receptionist/members')) {
      return route.fulfill({
        json: {
          content: [
            {
              userId: 9,
              fullName: 'Nguyễn Anh Khoa',
              phone: '0934567890',
              status: 'ACTIVE',
              activePackageName: 'Hạng Vàng',
              remainingQuotaSessions: 20,
            },
            {
              userId: 10,
              fullName: 'Hoàng Thị Ngọc',
              phone: '0938765432',
              status: 'ACTIVE',
              activePackageName: 'Hạng Vàng',
              remainingQuotaSessions: 18,
            },
          ],
        },
      });
    }
    if (path.endsWith('/notifications')) return route.fulfill({ json: [] });
    return route.fulfill({ json: {} });
  });

  await page.goto('/receptionist/classes');
  await expect(page.getByRole('heading', { name: 'Thời khóa biểu các lớp' })).toBeVisible();
  await expect(page.getByText('Tổng lớp hoạt động')).toBeVisible();
  await expect(page.getByText('Chỗ còn nhận đăng ký')).toBeVisible();

  await page.getByRole('button', { name: /Quản lý lớp/i }).click();
  await expect(page.getByText('Đã xác nhận')).toBeVisible();

  await page.getByLabel(/Tìm hội viên/i).fill('Nguyễn');
  const enrolledRow = page.getByRole('button', { name: /Nguyễn Anh Khoa/i });
  await expect(enrolledRow).toBeDisabled();
  await expect(enrolledRow).toContainText('Đã trong lớp');
  await expect(page.getByRole('button', { name: /Hoàng Thị Ngọc/i })).toBeEnabled();
});

test('receptionist profile password change sends expected AuthController payload', async ({ page }) => {
  let sentBody = null;
  await page.addInitScript(() => {
    sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
      token: 'e2e-rec-token',
      role: 'receptionist',
      user: { id: 3, name: 'Lê Thị Lễ Tân', email: 'reception.le@sporthub.com', role: 'RECEPTIONIST' },
    }));
  });

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.endsWith('/receptionist/profile')) {
      return route.fulfill({
        json: {
          userId: 3,
          fullName: 'Lê Thị Lễ Tân',
          email: 'reception.le@sporthub.com',
          phone: '0912345678',
          stats: {},
        },
      });
    }
    if (path.endsWith('/auth/change-password') && route.request().method() === 'POST') {
      sentBody = route.request().postDataJSON();
      return route.fulfill({ json: { message: 'Đổi mật khẩu thành công' } });
    }
    if (path.endsWith('/notifications')) return route.fulfill({ json: [] });
    return route.fulfill({ json: {} });
  });

  await page.goto('/receptionist/profile');
  await page.getByRole('button', { name: /Bảo mật & Mật khẩu/i }).click();
  const pwInput = page.locator('#rec-current-pw');
  await expect(pwInput).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Hiện mật khẩu hiện tại' }).click();
  await expect(pwInput).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ẩn mật khẩu hiện tại' }).click();
  await expect(pwInput).toHaveAttribute('type', 'password');

  const inputs = page.locator('input[type="password"]');
  await inputs.nth(0).fill('SportHub@123');
  await inputs.nth(1).fill('NewPass@2026');
  await inputs.nth(2).fill('NewPass@2026');
  await page.getByRole('button', { name: /Đổi Mật Khẩu|Cập Nhật Mật Khẩu/i }).click();

  await expect.poll(() => sentBody).toEqual({
    email: 'reception.le@sporthub.com',
    oldPassword: 'SportHub@123',
    newPassword: 'NewPass@2026',
    confirmPassword: 'NewPass@2026',
  });
});

test('coach attendance page pre-selects session from query parameter', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
      token: 'e2e-coach-token',
      role: 'coach',
      user: { id: 5, name: 'Trần Văn Minh', role: 'COACH' },
    }));
  });

  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/bookings/classes')) {
      return route.fulfill({
        json: [
          { sessionId: 201, className: 'Lớp Sáng', startTime: '2026-11-29T08:00:00', endTime: '2026-11-29T09:30:00' },
          { sessionId: 202, className: 'Lớp Chiều', startTime: '2026-11-29T17:00:00', endTime: '2026-11-29T18:30:00' },
        ],
      });
    }
    if (path.endsWith('/classes/202/roster')) {
      return route.fulfill({
        json: [{ bookingId: 90, memberId: 9, memberName: 'Nguyễn Anh Khoa', bookingStatus: 'CONFIRMED', attendanceStatus: 'PENDING' }],
      });
    }
    if (path.endsWith('/notifications')) return route.fulfill({ json: [] });
    return route.fulfill({ json: [] });
  });

  await page.goto('/coach/attendance?sessionId=202');
  await expect(page.getByText('Nguyễn Anh Khoa')).toBeVisible();
});

test('receptionist shift report date stepper shifts report date by one day', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
      token: 'e2e-rec-token',
      role: 'receptionist',
      user: { id: 3, name: 'Lê Thị Lễ Tân', email: 'reception.le@sporthub.com', role: 'RECEPTIONIST' },
    }));
  });

  const requestedDates = [];
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.endsWith('/notifications')) return route.fulfill({ json: [] });
    if (path.endsWith('/receptionist/report')) {
      requestedDates.push(url.searchParams.get('date'));
      return route.fulfill({
        json: { totalRevenue: 500000, completedPayments: 2, newMembers: 1, paymentMethods: [], payments: [] },
      });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto('/receptionist/shift');
  const dateInput = page.getByLabel('Ngày ca trực');
  const initialDate = await dateInput.inputValue();
  await page.getByRole('button', { name: 'Ngày trước' }).click();
  const prevDate = await dateInput.inputValue();
  expect(prevDate).not.toBe(initialDate);
  await expect.poll(() => requestedDates.includes(prevDate)).toBe(true);
  await page.getByRole('button', { name: 'Ngày sau' }).click();
  await expect(dateInput).toHaveValue(initialDate);
});

test('coach attendance supports accent-insensitive search, mark-all-present, and bulk save', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
      token: 'e2e-coach-token',
      role: 'coach',
      user: { id: 5, name: 'Trần Văn Minh', role: 'COACH' },
    }));
  });

  const now = Date.now();
  const start = new Date(now - 60 * 60 * 1000).toISOString();
  const end = new Date(now + 60 * 60 * 1000).toISOString();
  const savedIds = [];

  await page.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path.endsWith('/notifications')) return route.fulfill({ json: [] });
    if (path.endsWith('/bookings/classes')) {
      return route.fulfill({
        json: [{ sessionId: 301, className: 'Lớp Yoga Chiều', startTime: start, endTime: end }],
      });
    }
    if (path.endsWith('/classes/301/roster')) {
      return route.fulfill({
        json: [
          { bookingId: 801, memberId: 11, memberName: 'Nguyễn Văn An', bookingStatus: 'CONFIRMED', attendanceStatus: 'PENDING' },
          { bookingId: 802, memberId: 12, memberName: 'Lê Thị Bình', bookingStatus: 'CONFIRMED', attendanceStatus: 'PENDING' },
        ],
      });
    }
    const attendanceMatch = path.match(/\/bookings\/(\d+)\/attendance$/);
    if (attendanceMatch && (req.method() === 'PUT' || req.method() === 'PATCH' || req.method() === 'POST')) {
      savedIds.push(Number(attendanceMatch[1]));
      return route.fulfill({ json: { attendanceStatus: 'PRESENT', coachNote: '' } });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto('/coach/attendance?sessionId=301');
  await expect(page.getByText('Nguyễn Văn An')).toBeVisible();
  await expect(page.getByText('Lê Thị Bình')).toBeVisible();

  await page.getByPlaceholder('Tìm học viên trong lớp...').fill('van an');
  await expect(page.getByText('Nguyễn Văn An')).toBeVisible();
  await expect(page.getByText('Lê Thị Bình')).toHaveCount(0);
  await page.getByRole('button', { name: 'Xóa tìm học viên' }).click();
  await expect(page.getByText('Lê Thị Bình')).toBeVisible();

  await page.getByRole('button', { name: 'Có mặt tất cả (chưa điểm danh)' }).click();
  const saveAllBtn = page.getByRole('button', { name: 'Lưu tất cả thay đổi (2)' });
  await expect(saveAllBtn).toBeVisible();
  await saveAllBtn.click();

  await expect.poll(() => savedIds).toEqual([801, 802]);
  await expect(page.getByText('Đã lưu điểm danh cho 2 học viên.').first()).toBeVisible();
});

test('coach schedule bulk availability buttons toggle all 7 days', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
      token: 'e2e-coach-token',
      role: 'coach',
      user: { id: 5, name: 'Trần Văn Minh', role: 'COACH' },
    }));
  });

  const savedPayloads = [];
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path.endsWith('/notifications')) return route.fulfill({ json: [] });
    if (path.endsWith('/bookings/coach-schedule')) return route.fulfill({ json: [] });
    if (path.endsWith('/coach/availability')) {
      if (req.method() === 'PUT') {
        const body = req.postDataJSON();
        savedPayloads.push(JSON.parse(body.availabilityJson));
        return route.fulfill({ json: { status: 'OK' } });
      }
      return route.fulfill({ json: { availabilityJson: '[]' } });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto('/coach/schedule');
  await page.getByRole('tab', { name: /Khai báo lịch rảnh/i }).click();

  await page.getByRole('button', { name: 'Tắt tất cả' }).click();
  await expect.poll(() => savedPayloads.length).toBe(1);
  expect(savedPayloads[0]).toHaveLength(7);
  expect(savedPayloads[0].every((d) => !d.morning && !d.afternoon && !d.evening)).toBe(true);

  await page.getByRole('button', { name: 'Bật tất cả' }).click();
  await expect.poll(() => savedPayloads.length).toBe(2);
  expect(savedPayloads[1].every((d) => d.morning && d.afternoon && d.evening)).toBe(true);
});

