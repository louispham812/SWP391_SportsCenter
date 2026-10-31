import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('1. Public & Guest Role Flows', () => {
  test('Guest can browse Landing page, Sports, Facilities, Pricing and About', async ({ page }) => {
    // 1. Landing Page
    await page.goto(`${BASE_URL}/`);
    await expect(page).toHaveTitle(/Sport/i);
    await expect(page.locator('header, nav').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 2. Sports catalog
    await page.goto(`${BASE_URL}/sports`);
    await expect(page).toHaveURL(/\/sports/);
    await expect(page.locator('main').first()).toBeVisible();

    // 3. Sport detail
    await page.goto(`${BASE_URL}/sports/badminton`);
    await expect(page).toHaveURL(/\/sports\/badminton/);
    await expect(page.locator('main').first()).toBeVisible();

    // 4. Facilities catalog
    await page.goto(`${BASE_URL}/facilities`);
    await expect(page).toHaveURL(/\/facilities/);
    await expect(page.locator('main').first()).toBeVisible();

    // 5. Pricing page
    await page.goto(`${BASE_URL}/pricing`);
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.locator('main').first()).toBeVisible();

    // 6. About page
    await page.goto(`${BASE_URL}/about`);
    await expect(page).toHaveURL(/\/about/);
    await expect(page.locator('main').first()).toBeVisible();

    // 7. Login / Register page
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByPlaceholder('name@example.com / 0912...')).toBeVisible();
    await expect(page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i })).toBeVisible();

    // Switch to Register tab
    await page.goto(`${BASE_URL}/register`);
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByPlaceholder('Nguyễn Văn A')).toBeVisible();
    await expect(page.getByPlaceholder('0912 345 678')).toBeVisible();
  });
});

test.describe('2. Member (Customer) Role Flows', () => {
  test('Member logs in and accesses all member portal features', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com / 0912...').fill('khoa.member@gmail.com');
    await page.getByPlaceholder('••••••••').fill('SportHub@123');
    await page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();

    // Verify Redirect to Member Dashboard
    await expect(page).toHaveURL(/\/member$/);
    await expect(page.getByRole('heading', { name: /Xin chào/i })).toBeVisible();

    // Packages
    await page.goto(`${BASE_URL}/member/packages`);
    await expect(page).toHaveURL(/\/member\/packages/);
    await expect(page.locator('main').first()).toBeVisible();

    // Classes
    await page.goto(`${BASE_URL}/member/classes`);
    await expect(page).toHaveURL(/\/member\/classes/);
    await expect(page.locator('main').first()).toBeVisible();

    // Booking flow entry
    await page.goto(`${BASE_URL}/member/book`);
    await expect(page).toHaveURL(/\/member\/book/);
    await expect(page.locator('main').first()).toBeVisible();

    // Court booking options
    await page.goto(`${BASE_URL}/member/book/court/sports`);
    await expect(page).toHaveURL(/\/member\/book\/court\/sports/);
    await expect(page.locator('main').first()).toBeVisible();

    // Schedule & Timetable
    await page.goto(`${BASE_URL}/member/schedule`);
    await expect(page).toHaveURL(/\/member\/schedule/);
    await expect(page.locator('main').first()).toBeVisible();

    // Attendance
    await page.goto(`${BASE_URL}/member/attendance`);
    await expect(page).toHaveURL(/\/member\/attendance/);
    await expect(page.locator('main').first()).toBeVisible();

    // Workout Plans & Coach feedback
    await page.goto(`${BASE_URL}/member/workout-plans`);
    await expect(page).toHaveURL(/\/member\/workout-plans/);
    await expect(page.locator('main').first()).toBeVisible();

    // Reviews
    await page.goto(`${BASE_URL}/member/reviews`);
    await expect(page).toHaveURL(/\/member\/reviews/);
    await expect(page.locator('main').first()).toBeVisible();

    // Transactions
    await page.goto(`${BASE_URL}/member/transactions`);
    await expect(page).toHaveURL(/\/member\/transactions/);
    await expect(page.locator('main').first()).toBeVisible();

    // AI Assistant
    await page.goto(`${BASE_URL}/member/ai-assistant`);
    await expect(page).toHaveURL(/\/member\/ai-assistant/);
    await expect(page.locator('main').first()).toBeVisible();

    // Profile & Digital Card
    await page.goto(`${BASE_URL}/member/profile`);
    await expect(page).toHaveURL(/\/member\/profile/);
    await expect(page.locator('main').first()).toBeVisible();

    // Logout
    const logoutBtn = page.getByRole('button', { name: /logout|Đăng xuất/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/login|\/$/);
    }
  });
});

test.describe('3. Receptionist (Staff) Role Flows', () => {
  test('Receptionist logs in and accesses all reception desk workflows', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com / 0912...').fill('reception.le@sporthub.com');
    await page.getByPlaceholder('••••••••').fill('SportHub@123');
    await page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();

    // Verify Redirect to Receptionist Dashboard
    await expect(page).toHaveURL(/\/receptionist$/);
    await expect(page.locator('main').first()).toBeVisible();

    // Check-in desk
    await page.goto(`${BASE_URL}/receptionist/checkin`);
    await expect(page).toHaveURL(/\/receptionist\/checkin/);
    await expect(page.locator('main').first()).toBeVisible();

    // POS counter
    await page.goto(`${BASE_URL}/receptionist/pos`);
    await expect(page).toHaveURL(/\/receptionist\/pos/);
    await expect(page.locator('main').first()).toBeVisible();

    // Equipment rental
    await page.goto(`${BASE_URL}/receptionist/equipment`);
    await expect(page).toHaveURL(/\/receptionist\/equipment/);
    await expect(page.locator('main').first()).toBeVisible();

    // Member search & management
    await page.goto(`${BASE_URL}/receptionist/members`);
    await expect(page).toHaveURL(/\/receptionist\/members/);
    await expect(page.locator('main').first()).toBeVisible();

    // Class timetable & rosters
    await page.goto(`${BASE_URL}/receptionist/classes`);
    await expect(page).toHaveURL(/\/receptionist\/classes/);
    await expect(page.locator('main').first()).toBeVisible();

    // Shift report
    await page.goto(`${BASE_URL}/receptionist/shift`);
    await expect(page).toHaveURL(/\/receptionist\/shift/);
    await expect(page.locator('main').first()).toBeVisible();

    // Profile
    await page.goto(`${BASE_URL}/receptionist/profile`);
    await expect(page).toHaveURL(/\/receptionist\/profile/);
    await expect(page.locator('main').first()).toBeVisible();

    // Logout
    const logoutBtn = page.getByRole('button', { name: /logout|Đăng xuất/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/login|\/$/);
    }
  });
});

test.describe('4. Coach Role Flows', () => {
  test('Coach logs in and accesses all coaching workflows', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com / 0912...').fill('coach.minh@sporthub.com');
    await page.getByPlaceholder('••••••••').fill('SportHub@123');
    await page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();

    // Verify Redirect to Coach Dashboard
    await expect(page).toHaveURL(/\/coach$/);
    await expect(page.locator('main').first()).toBeVisible();

    // Teaching schedule
    await page.goto(`${BASE_URL}/coach/schedule`);
    await expect(page).toHaveURL(/\/coach\/schedule/);
    await expect(page.locator('main').first()).toBeVisible();

    // Enrolled students
    await page.goto(`${BASE_URL}/coach/students`);
    await expect(page).toHaveURL(/\/coach\/students/);
    await expect(page.locator('main').first()).toBeVisible();

    // Student attendance
    await page.goto(`${BASE_URL}/coach/attendance`);
    await expect(page).toHaveURL(/\/coach\/attendance/);
    await expect(page.locator('main').first()).toBeVisible();

    // Income & commission
    await page.goto(`${BASE_URL}/coach/income`);
    await expect(page).toHaveURL(/\/coach\/income/);
    await expect(page.locator('main').first()).toBeVisible();

    // Student reviews
    await page.goto(`${BASE_URL}/coach/reviews`);
    await expect(page).toHaveURL(/\/coach\/reviews/);
    await expect(page.locator('main').first()).toBeVisible();

    // Notifications
    await page.goto(`${BASE_URL}/coach/notifications`);
    await expect(page).toHaveURL(/\/coach\/notifications/);
    await expect(page.locator('main').first()).toBeVisible();

    // Profile & Credentials
    await page.goto(`${BASE_URL}/coach/profile`);
    await expect(page).toHaveURL(/\/coach\/profile/);
    await expect(page.locator('main').first()).toBeVisible();

    // Logout
    const logoutBtn = page.getByRole('button', { name: /logout|Đăng xuất/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/login|\/$/);
    }
  });
});

test.describe('5. Manager / Admin Role Flows', () => {
  test('Manager logs in and accesses all administration workflows', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com / 0912...').fill('manager@sporthub.com');
    await page.getByPlaceholder('••••••••').fill('SportHub@123');
    await page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();

    // Verify Redirect to Admin Dashboard
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('main').first()).toBeVisible();

    // Member management
    await page.goto(`${BASE_URL}/admin/members`);
    await expect(page).toHaveURL(/\/admin\/members/);
    await expect(page.locator('main').first()).toBeVisible();

    // Staff management
    await page.goto(`${BASE_URL}/admin/staff`);
    await expect(page).toHaveURL(/\/admin\/staff/);
    await expect(page.locator('main').first()).toBeVisible();

    // Staff approvals
    await page.goto(`${BASE_URL}/admin/staff-approvals`);
    await expect(page).toHaveURL(/\/admin\/staff-approvals/);
    await expect(page.locator('main').first()).toBeVisible();

    // Facilities & Courts
    await page.goto(`${BASE_URL}/admin/facilities`);
    await expect(page).toHaveURL(/\/admin\/facilities/);
    await expect(page.locator('main').first()).toBeVisible();

    // Membership Packages
    await page.goto(`${BASE_URL}/admin/packages`);
    await expect(page).toHaveURL(/\/admin\/packages/);
    await expect(page.locator('main').first()).toBeVisible();

    // Broadcast announcements
    await page.goto(`${BASE_URL}/admin/broadcast`);
    await expect(page).toHaveURL(/\/admin\/broadcast/);
    await expect(page.locator('main').first()).toBeVisible();

    // Security & Audit logs
    await page.goto(`${BASE_URL}/admin/audit-logs`);
    await expect(page).toHaveURL(/\/admin\/audit-logs/);
    await expect(page.locator('main').first()).toBeVisible();

    // Center settings
    await page.goto(`${BASE_URL}/admin/settings`);
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.locator('main').first()).toBeVisible();

    // Logout
    const logoutBtn = page.getByRole('button', { name: /logout|Đăng xuất/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/login|\/$/);
    }
  });
});
