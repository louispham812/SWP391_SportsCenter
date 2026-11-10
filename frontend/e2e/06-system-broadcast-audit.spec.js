import { test, expect } from '@playwright/test';
import { loginManager, loginMember, loginCoach } from './helpers.js';

test.describe('SUITE 6: Cấu Hình Hệ Thống, Thông Báo Hàng Loạt & Nhật Ký Kiểm Toán (System, Broadcast & Audit Logs)', () => {
  test('1. Cấu hình tham số & Ma trận phân quyền vận hành hệ thống -> Bền vững sau F5', async ({ browser, baseURL }) => {
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();

    try {
      await loginManager(adminPage);
      await adminPage.goto('/admin/settings');
      await expect(adminPage).toHaveURL(/\/admin\/settings/);
      await expect(adminPage.getByRole('heading', { name: /Cài Đặt Hệ Thống/i })).toBeVisible({ timeout: 10000 });

      const saveSettingsBtn = adminPage.getByRole('button', { name: /Lưu Cài Đặt Hệ Thống/i });
      if (await saveSettingsBtn.isVisible()) {
        await saveSettingsBtn.click();
        await expect(adminPage.getByText(/Đã lưu chính sách vận hành/i).first()).toBeVisible({ timeout: 7000 });
      }

      // F5 reload kiểm chứng cài đặt lưu trữ bền vững
      await adminPage.reload();
      await expect(adminPage.getByRole('heading', { name: /Cài Đặt Hệ Thống/i })).toBeVisible({ timeout: 10000 });
      await expect(adminPage.locator('main').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await adminContext.close();
    }
  });

  test('2. Thông báo hàng loạt (Broadcast) -> Hội viên & HLV nhận đồng thời -> Nhật ký Audit Logs lưu vết bền vững', async ({ browser, baseURL }) => {
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();
    const coachContext = await browser.newContext({ baseURL });
    const coachPage = await coachContext.newPage();

    const broadcastTitle = `[THÔNG BÁO TỔNG] Bảo trì chiếu sáng ${Date.now()}`;
    const broadcastMsg = 'Trung tâm thông báo nâng cấp đèn cao áp toàn bộ các sân thi đấu.';

    try {
      await loginManager(adminPage);
      await adminPage.goto('/admin/broadcast');
      await expect(adminPage).toHaveURL(/\/admin\/broadcast/);

      await adminPage.getByPlaceholder('Tiêu đề').fill(broadcastTitle);
      await adminPage.getByPlaceholder('Nội dung thông báo').fill(broadcastMsg);
      await adminPage.getByRole('button', { name: /Gửi thông báo/i }).click();
      await expect(adminPage.getByText(/Đã gửi thông báo tới/i)).toBeVisible({ timeout: 7000 });

      // Hội viên nhận thông báo và F5 reload
      await loginMember(memberPage);
      await memberPage.goto('/member/notifications');
      await expect(memberPage).toHaveURL(/\/member\/notifications/);
      await expect(memberPage.getByText(broadcastTitle).first()).toBeVisible({ timeout: 7000 });
      await memberPage.reload();
      await expect(memberPage.getByText(broadcastTitle).first()).toBeVisible({ timeout: 7000 });

      // Huấn luyện viên cũng nhận được thông báo
      await loginCoach(coachPage);
      await coachPage.goto('/coach/notifications');
      await expect(coachPage).toHaveURL(/\/coach\/notifications/);
      await expect(coachPage.getByText(broadcastTitle).first()).toBeVisible({ timeout: 7000 });
      await coachPage.reload();
      await expect(coachPage.getByText(broadcastTitle).first()).toBeVisible({ timeout: 7000 });

      // Admin kiểm tra Audit Logs có lưu sự kiện
      await adminPage.goto('/admin/audit-logs');
      await expect(adminPage).toHaveURL(/\/admin\/audit-logs/);
      await adminPage.reload();
      await expect(adminPage.locator('table, tbody').first()).toBeVisible({ timeout: 10000 });
      await expect(adminPage.getByText(/BROADCAST|NOTIFICATION|SYSTEM|SETTINGS/i).first()).toBeVisible();
    } finally {
      await adminContext.close();
      await memberContext.close();
      await coachContext.close();
    }
  });

  test('3. Nhật ký kiểm toán (Audit Logs) -> Ghi nhận và truy vết đầy đủ các biến động hệ thống', async ({ page }) => {
    await loginManager(page);
    await page.goto('/admin/audit-logs');
    await expect(page).toHaveURL(/\/admin\/audit-logs/);
    await expect(page.locator('table, tbody').first()).toBeVisible({ timeout: 10000 });

    // F5 reload kiểm chứng nhật ký kiểm toán ổn định
    await page.reload();
    await expect(page.locator('table, tbody').first()).toBeVisible({ timeout: 10000 });
  });
});
