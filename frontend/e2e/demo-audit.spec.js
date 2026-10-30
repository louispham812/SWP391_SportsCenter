import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

function setupAudit(page, title) {
  const netErrors = [];
  const consoleErrors = [];

  page.on('response', (res) => {
    if (res.status() >= 400 && res.url().includes('/api/v1/')) {
      netErrors.push(`[${res.status()}] ${res.url().replace('http://127.0.0.1:8080/api/v1', '')}`);
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('downloadable font')) {
        consoleErrors.push(text);
      }
    }
  });

  return {
    async check(path, name) {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      const text = await page.innerText('body');
      const zeros = [];
      if (text.includes('0 ₫')) zeros.push('Has 0 ₫ text');
      if (text.includes('undefined')) zeros.push('Has "undefined" string');
      if (text.includes('NaN')) zeros.push('Has "NaN" string');
      console.log(`PAGE [${title} - ${name}]: NetErrors=${netErrors.length}, ConsoleErrors=${consoleErrors.length}, Flags=${zeros.join(', ') || 'None'}`);
    },
    report() {
      return { title, netErrors, consoleErrors };
    }
  };
}

test('Audit Member Portal', async ({ page }) => {
  const audit = setupAudit(page, 'MEMBER');
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('name@example.com / 0912...').fill('khoa.member@gmail.com');
  await page.getByPlaceholder('••••••••').fill('SportHub@123');
  await page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();
  await expect(page).toHaveURL(/\/member$/);

  await audit.check('/member', 'Dashboard');
  await audit.check('/member/packages', 'Packages');
  await audit.check('/member/classes', 'Classes');
  await audit.check('/member/schedule', 'Schedule');
  await audit.check('/member/attendance', 'Attendance');
  await audit.check('/member/workout-plans', 'WorkoutPlans');
  await audit.check('/member/transactions', 'Transactions');
  await audit.check('/member/reviews', 'Reviews');
  await audit.check('/member/ai-assistant', 'AIAssistant');
  await audit.check('/member/profile', 'Profile');
});

test('Audit Receptionist Portal', async ({ page }) => {
  const audit = setupAudit(page, 'RECEPTIONIST');
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('name@example.com / 0912...').fill('reception.le@sporthub.com');
  await page.getByPlaceholder('••••••••').fill('SportHub@123');
  await page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();
  await expect(page).toHaveURL(/\/receptionist$/);

  await audit.check('/receptionist', 'Dashboard');
  await audit.check('/receptionist/checkin', 'CheckIn');
  await audit.check('/receptionist/pos', 'POS');
  await audit.check('/receptionist/equipment', 'Equipment');
  await audit.check('/receptionist/members', 'Members');
  await audit.check('/receptionist/classes', 'Classes');
  await audit.check('/receptionist/shift', 'ShiftReport');
  await audit.check('/receptionist/profile', 'Profile');
});

test('Audit Coach Portal', async ({ page }) => {
  const audit = setupAudit(page, 'COACH');
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('name@example.com / 0912...').fill('coach.minh@sporthub.com');
  await page.getByPlaceholder('••••••••').fill('SportHub@123');
  await page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();
  await expect(page).toHaveURL(/\/coach$/);

  await audit.check('/coach', 'Dashboard');
  await audit.check('/coach/schedule', 'Schedule');
  await audit.check('/coach/students', 'Students');
  await audit.check('/coach/attendance', 'Attendance');
  await audit.check('/coach/income', 'Income');
  await audit.check('/coach/reviews', 'Reviews');
  await audit.check('/coach/notifications', 'Notifications');
  await audit.check('/coach/profile', 'Profile');
});

test('Audit Admin Portal', async ({ page }) => {
  const audit = setupAudit(page, 'ADMIN');
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('name@example.com / 0912...').fill('manager@sporthub.com');
  await page.getByPlaceholder('••••••••').fill('SportHub@123');
  await page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await audit.check('/admin', 'Dashboard');
  await audit.check('/admin/members', 'Members');
  await audit.check('/admin/staff', 'Staff');
  await audit.check('/admin/staff-approvals', 'StaffApprovals');
  await audit.check('/admin/facilities', 'Facilities');
  await audit.check('/admin/packages', 'Packages');
  await audit.check('/admin/broadcast', 'Broadcast');
  await audit.check('/admin/audit-logs', 'AuditLogs');
  await audit.check('/admin/settings', 'Settings');
});
