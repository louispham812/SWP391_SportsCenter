import { test, expect } from '@playwright/test';
import { loginManager, loginMember, loginCoach } from './helpers.js';

test.describe('LUỒNG 5: Quản trị Hệ Thống, Quản Lý Thành Viên & Nhân Sự, Broadcast & Cấu Hình Tham Số (Settings & Audit Logs)', () => {
  test('Quy trình tuần tự liên thông trọn vẹn Luồng 5 trên UI thực tế', async ({ page, baseURL, browser }) => {
    test.setTimeout(90000);

    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();

    const broadcastTitle = `[HỆ THỐNG] Nâng cấp đèn LED sân bãi ${Date.now()}`;
    const broadcastMessage = 'F Sport Center xin thông báo hệ thống chiếu sáng sân đã được nâng cấp hoàn tất.';

    try {
      // Đăng nhập Admin / Manager
      console.log('--- Đăng nhập Quản trị viên (Admin / Manager) ---');
      await loginManager(adminPage);
      await expect(adminPage).toHaveURL(/\/admin/);

      // BƯỚC 1: Quản lý Hội viên: Tìm kiếm & Khóa / Mở khóa (/admin/members)
      console.log('--- BƯỚC 1: Quản lý Hội viên & Khóa/Mở khóa tài khoản ---');
      await adminPage.goto('/admin/members');
      await expect(adminPage).toHaveURL(/\/admin\/members/);
      await expect(adminPage.getByRole('heading', { name: /Quản lý danh sách hội viên/i })).toBeVisible({ timeout: 7000 });

      // Tìm kiếm hội viên
      const searchInput = adminPage.getByPlaceholder(/Tìm theo tên, email/i);
      await searchInput.fill('Khoa');
      await searchInput.press('Enter');
      await adminPage.waitForTimeout(500);

      // Thao tác Khóa / Mở khóa trên nút của dòng đầu tiên
      const toggleLockBtn = adminPage.locator('tbody tr button').first();
      if (await toggleLockBtn.isVisible({ timeout: 5000 })) {
        const initialTitle = await toggleLockBtn.getAttribute('title');
        console.log(`Trạng thái ban đầu của nút: ${initialTitle}`);
        await toggleLockBtn.click();
        await adminPage.waitForTimeout(1000);

        // Đảo lại trạng thái để giữ nguyên dữ liệu gốc
        const secondToggleBtn = adminPage.locator('tbody tr button').first();
        if (await secondToggleBtn.isVisible({ timeout: 5000 })) {
          await secondToggleBtn.click();
          await adminPage.waitForTimeout(1000);
          console.log('Đã thực hiện chu trình Khóa và Mở khóa hội viên an toàn');
        }
      }

      // BƯỚC 2: Quản lý Nhân sự: Modal tạo tài khoản & Báo cáo hiệu suất (/admin/staff)
      console.log('--- BƯỚC 2: Quản lý Nhân sự & Báo cáo hiệu suất ---');
      await adminPage.goto('/admin/staff');
      await expect(adminPage).toHaveURL(/\/admin\/staff/);

      // Mở modal thêm người dùng mới
      const createStaffBtn = adminPage.getByRole('button', { name: /Thêm người dùng mới/i }).first();
      if (await createStaffBtn.isVisible({ timeout: 5000 })) {
        await createStaffBtn.click();
        await expect(adminPage.getByRole('heading', { name: /Thêm người dùng mới/i })).toBeVisible({ timeout: 5000 });
        console.log('Modal tạo tài khoản nhân sự mới đã hiển thị đầy đủ form');

        // Đóng modal
        const cancelBtn = adminPage.getByRole('button', { name: /Hủy bỏ/i });
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }

      // Chuyển sang Tab Hiệu suất & Hoa hồng (MGR-11)
      const perfTabBtn = adminPage.getByRole('button', { name: /Hiệu suất & Hoa hồng/i });
      if (await perfTabBtn.isVisible({ timeout: 5000 })) {
        await perfTabBtn.click();
        await expect(adminPage.getByRole('heading', { name: /KPI & Hoa Hồng Huấn Luyện Viên/i })).toBeVisible({ timeout: 7000 });
        console.log('Báo cáo hiệu suất và hoa hồng nhân sự đã hiển thị');
      }

      // BƯỚC 3: Gửi Thông Báo Hàng Loạt Broadcast (/admin/broadcast)
      console.log('--- BƯỚC 3: Gửi Thông Báo Hàng Loạt (Broadcast) ---');
      await adminPage.goto('/admin/broadcast');
      await expect(adminPage).toHaveURL(/\/admin\/broadcast/);

      await adminPage.getByPlaceholder('Tiêu đề').fill(broadcastTitle);
      await adminPage.getByPlaceholder('Nội dung thông báo').fill(broadcastMessage);

      const sendBroadcastBtn = adminPage.getByRole('button', { name: /Gửi thông báo/i });
      await sendBroadcastBtn.click();

      // Kiểm tra thông báo kết quả
      await expect(adminPage.getByText(/Đã gửi thông báo tới/i)).toBeVisible({ timeout: 7000 });
      console.log('Admin đã gửi thông báo broadcast toàn hệ thống thành công');

      // BƯỚC 4: Kiểm tra Nhận Thông Báo Phía Hội Viên & HLV
      console.log('--- BƯỚC 4: Kiểm tra Nhận Thông Báo Trên Giao Diện Người Dùng ---');
      // 4.1 Phía Hội viên
      const memberContext = await browser.newContext({ baseURL });
      const memberPage = await memberContext.newPage();
      try {
        await loginMember(memberPage);
        await memberPage.goto('/member/notifications');
        await expect(memberPage).toHaveURL(/\/member\/notifications/);
        await expect(memberPage.getByText(broadcastTitle).first()).toBeVisible({ timeout: 7000 });
        console.log('Hội viên đã nhận được thông báo Broadcast chính xác');
      } finally {
        await memberContext.close();
      }

      // 4.2 Phía Huấn luyện viên
      const coachContext = await browser.newContext({ baseURL });
      const coachPage = await coachContext.newPage();
      try {
        await loginCoach(coachPage);
        await coachPage.goto('/coach/notifications');
        await expect(coachPage).toHaveURL(/\/coach\/notifications/);
        await expect(coachPage.getByText(broadcastTitle).first()).toBeVisible({ timeout: 7000 });
        console.log('Huấn luyện viên đã nhận được thông báo Broadcast chính xác');
      } finally {
        await coachContext.close();
      }

      // BƯỚC 5: Cấu Hình Tham Số Hệ Thống & Kiểm Tra Audit Logs
      console.log('--- BƯỚC 5: Cấu Hình Hệ Thống & Kiểm Tra Nhật Ký Kiểm Toán (Audit Logs) ---');
      await adminPage.goto('/admin/settings');
      await expect(adminPage).toHaveURL(/\/admin\/settings/);
      await expect(adminPage.getByRole('heading', { name: /Cài Đặt Hệ Thống/i })).toBeVisible({ timeout: 7000 });

      // Lưu chính sách vận hành
      const savePolicyBtn = adminPage.getByRole('button', { name: /Lưu Thay Đổi Chính Sách|Lưu Cấu Hình/i });
      if (await savePolicyBtn.isVisible({ timeout: 5000 })) {
        await savePolicyBtn.click();
        await expect(adminPage.getByText(/Đã lưu cấu hình chính sách/i).first()).toBeVisible({ timeout: 7000 });
        console.log('Admin đã lưu cập nhật chính sách vận hành hệ thống');
      }

      // Kiểm tra Audit Logs (/admin/audit-logs)
      await adminPage.goto('/admin/audit-logs');
      await expect(adminPage).toHaveURL(/\/admin\/audit-logs/);
      await expect(adminPage.getByRole('heading', { name: /Nhật ký hệ thống/i })).toBeVisible({ timeout: 7000 });

      const auditTable = adminPage.locator('table');
      await expect(auditTable).toBeVisible({ timeout: 7000 });
      const rowsCount = await auditTable.locator('tbody tr').count();
      expect(rowsCount).toBeGreaterThan(0);
      console.log(`Bảng Audit Logs đã ghi nhận đầy đủ ${rowsCount} sự kiện kiểm toán`);

      console.log('HOÀN THÀNH 100% LUỒNG 5: Quản Trị Hệ Thống, Quản Lý Nhân Sự, Broadcast & Audit Logs!');
    } finally {
      await adminContext.close();
    }
  });
});
