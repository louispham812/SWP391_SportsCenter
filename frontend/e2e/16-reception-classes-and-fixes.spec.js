import { test, expect } from '@playwright/test';

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
