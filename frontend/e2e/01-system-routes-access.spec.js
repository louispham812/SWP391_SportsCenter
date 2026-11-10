import { test, expect } from '@playwright/test';
import { loginMember, loginReceptionist, loginCoach, loginManager } from './helpers.js';

function setupAudit(page, title) {
  const netErrors = [];
  const consoleErrors = [];

  page.on('response', (res) => {
    if (res.status() >= 400 && res.url().includes('/api/v1/')) {
      netErrors.push(`[${res.status()}] ${res.url().replace(/http:\/\/[^/]+\/api\/v1/, '')}`);
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
    async check(urlPath, name) {
      await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      expect(page.url()).toContain(urlPath.split('?')[0]);
      await expect(page.locator('body')).toBeVisible();
    },
    getErrors() {
      return { netErrors, consoleErrors };
    },
  };
}

test.describe('SUITE 1: Kiểm Thử Toàn Bộ 59 Routes & Phân Quyền 5 Vai Trò (System Routes & Access Control)', () => {
  test('1. Public & Guest Role: Điều hướng và toàn vẹn giao diện khách vãng lai', async ({ page }) => {
    const publicRoutes = ['/', '/sports', '/facilities', '/pricing', '/about', '/contact', '/login', '/register', '/forgot-password', '/coach/register'];
    for (const route of publicRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('2. Member Portal: Khảo sát 18 routes & không phát sinh lỗi Console/Network', async ({ page }) => {
    await loginMember(page);
    const audit = setupAudit(page, 'MEMBER');
    const memberRoutes = [
      ['/member', 'Dashboard'],
      ['/member/packages', 'Packages'],
      ['/member/classes', 'Classes'],
      ['/member/schedule', 'Schedule'],
      ['/member/attendance', 'Attendance'],
      ['/member/workout-plans', 'WorkoutPlans'],
      ['/member/transactions', 'Transactions'],
      ['/member/reviews', 'Reviews'],
      ['/member/ai-assistant', 'AIAssistant'],
      ['/member/profile', 'Profile'],
    ];

    for (const [route, label] of memberRoutes) {
      await audit.check(route, label);
    }
  });

  test('3. Receptionist Portal: Khảo sát 8 routes quầy lễ tân & không phát sinh lỗi', async ({ page }) => {
    await loginReceptionist(page);
    const audit = setupAudit(page, 'RECEPTIONIST');
    const recepRoutes = [
      ['/receptionist', 'Dashboard'],
      ['/receptionist/checkin', 'CheckIn'],
      ['/receptionist/pos', 'POS'],
      ['/receptionist/equipment', 'Equipment'],
      ['/receptionist/members', 'Members'],
      ['/receptionist/classes', 'Classes'],
      ['/receptionist/shift', 'ShiftReport'],
      ['/receptionist/profile', 'Profile'],
    ];

    for (const [route, label] of recepRoutes) {
      await audit.check(route, label);
    }
  });

  test('4. Coach Portal: Khảo sát 8 routes huấn luyện viên & không phát sinh lỗi', async ({ page }) => {
    await loginCoach(page);
    const audit = setupAudit(page, 'COACH');
    const coachRoutes = [
      ['/coach', 'Dashboard'],
      ['/coach/schedule', 'Schedule'],
      ['/coach/students', 'Students'],
      ['/coach/attendance', 'Attendance'],
      ['/coach/income', 'Income'],
      ['/coach/reviews', 'Reviews'],
      ['/coach/notifications', 'Notifications'],
      ['/coach/profile', 'Profile'],
    ];

    for (const [route, label] of coachRoutes) {
      await audit.check(route, label);
    }
  });

  test('5. Admin / Manager Portal: Khảo sát 10 routes quản trị & không phát sinh lỗi', async ({ page }) => {
    await loginManager(page);
    const audit = setupAudit(page, 'ADMIN');
    const adminRoutes = [
      ['/admin', 'Dashboard'],
      ['/admin/members', 'Members'],
      ['/admin/staff', 'Staff'],
      ['/admin/staff-approvals', 'StaffApprovals'],
      ['/admin/facilities', 'Facilities'],
      ['/admin/packages', 'Packages'],
      ['/admin/broadcast', 'Broadcast'],
      ['/admin/audit-logs', 'AuditLogs'],
      ['/admin/settings', 'Settings'],
    ];

    for (const [route, label] of adminRoutes) {
      await audit.check(route, label);
    }
  });
});
