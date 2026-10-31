import { test, expect } from '@playwright/test';
import { loginManager, loginMember } from './helpers.js';

test.describe('LUỒNG 1: Luồng Gói Tập & Voucher (Admin tạo -> Member mua -> Admin duyệt -> Member nhận quyền lợi)', () => {
  test('Quy trình tuần tự liên thông trọn vẹn Luồng 1 trên UI thực tế', async ({ baseURL, browser }) => {
    test.setTimeout(90000);
    const testPkgName = `Gói VIP Auto ${Date.now().toString().slice(-4)}`;
    const voucherCode = `VC_${Date.now().toString().slice(-4)}`;

    const adminContext = await browser.newContext({ baseURL });
    const memberContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();
    const memberPage = await memberContext.newPage();

    try {
      // BƯỚC 1: Admin tạo Gói tập và Voucher trên /admin/packages
      console.log('--- BƯỚC 1: Admin tạo Gói tập & Voucher ---');
      await loginManager(adminPage);
      await adminPage.goto('/admin/packages');
      await expect(adminPage).toHaveURL(/\/admin\/packages/);

      // 1.1 Bấm "Thêm gói tập mới"
      const addPkgBtn = adminPage.getByRole('button', { name: /Thêm gói tập mới/i });
      await expect(addPkgBtn).toBeVisible({ timeout: 5000 });
      await addPkgBtn.click();

      // Điền form tạo gói tập (giá cao hơn tất cả gói hiện có để là gói VIP cao cấp nhất, hợp lệ nâng cấp)
      let testPrice = '5000000';
      try {
        const res = await fetch('http://127.0.0.1:8080/api/v1/packages');
        if (res.ok) {
          const pkgs = await res.json();
          const max = pkgs.reduce((m, p) => Math.max(m, Number(p.price || 0)), 0);
          testPrice = String(max + 100000);
        }
      } catch {
        testPrice = '5000000';
      }

      await adminPage.getByPlaceholder('Ví dụ: Gói Gold 3 Tháng').fill(testPkgName);
      const priceInput = adminPage.locator('input[type="number"]').first();
      await priceInput.fill(testPrice);
      const durationInput = adminPage.locator('input[type="number"]').nth(1);
      await durationInput.fill('60');
      await adminPage.locator('textarea').fill('Mô tả gói tập tạo tự động từ Playwright UI Test');

      // Bấm "Lưu gói tập"
      await adminPage.getByRole('button', { name: /Lưu gói tập/i }).click();
      await expect(adminPage.getByText(testPkgName, { exact: true })).toBeVisible({ timeout: 7000 });
      console.log('Admin đã tạo xong gói:', testPkgName);

      // 1.2 Chuyển sang Tab "Mã giảm giá & Voucher"
      const voucherTabBtn = adminPage.getByRole('button', { name: /Mã giảm giá & Voucher/i });
      await voucherTabBtn.click();

      // Bấm "Tạo voucher mới"
      const createVoucherBtn = adminPage.getByRole('button', { name: /Tạo voucher mới/i });
      await expect(createVoucherBtn).toBeVisible({ timeout: 5000 });
      await createVoucherBtn.click();

      // Điền form voucher
      await adminPage.getByPlaceholder('VD: TET2026').fill(voucherCode);
      await adminPage.locator('select').first().selectOption('FIXED');
      await adminPage.locator('input[type="number"]').first().fill('50000');
      await adminPage.locator('input[type="number"]').nth(1).fill('100000');

      // Bấm "Lưu Voucher"
      await adminPage.getByRole('button', { name: /Lưu Voucher/i }).click();
      await expect(adminPage.getByText(voucherCode, { exact: true })).toBeVisible({ timeout: 7000 });
      console.log('Admin đã tạo xong voucher:', voucherCode);

      // Bấm toggle trạng thái voucher (nút Tắt / Bật trong bảng)
      const voucherRow = adminPage.locator('tr', { hasText: voucherCode });
      const toggleBtn = voucherRow.getByRole('button', { name: /Tắt|Bật/i }).first();
      if (await toggleBtn.isVisible()) {
        await toggleBtn.click();
        await adminPage.waitForTimeout(500);
      }

      // BƯỚC 2: Kiểm tra trang Public /pricing và Member mua gói
      console.log('--- BƯỚC 2: Member xem pricing & mua gói ---');
      await memberPage.goto('/pricing');
      await expect(memberPage).toHaveURL(/\/pricing/);
      await expect(memberPage.getByText(testPkgName).first()).toBeVisible({ timeout: 7000 });
      console.log('Trang Public /pricing đã hiển thị gói:', testPkgName);

      // Member đăng nhập và mua gói trên /member/packages
      await loginMember(memberPage);
      await memberPage.goto('/member/packages');
      await expect(memberPage).toHaveURL(/\/member\/packages/);

      // Locate thẻ card chứa testPkgName
      const pkgCard = memberPage.locator('.rounded-3xl', { hasText: testPkgName }).first();
      await expect(pkgCard).toBeVisible({ timeout: 7000 });

      const buyBtn = pkgCard.getByRole('button', { name: /Nâng Cấp Lên Gói Này|Đăng Ký Gói Này|Gia Hạn Gói Này/i });
      await buyBtn.click();

      // Trong modal xác nhận thanh toán
      const confirmBuyBtn = memberPage.getByRole('button', { name: /Tôi Đã Chuyển Khoản|Xác Nhận|Đăng Ký/i }).last();
      await expect(confirmBuyBtn).toBeVisible({ timeout: 5000 });
      await confirmBuyBtn.click();

      // Chờ thông báo thành công hoặc chờ duyệt
      await expect(memberPage.getByText(/chờ Quản lý phê duyệt|thành công/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Member đã gửi yêu cầu mua gói thành công');

      // BƯỚC 3: Admin duyệt yêu cầu mua gói trên /admin/staff-approvals
      console.log('--- BƯỚC 3: Admin duyệt yêu cầu gói ---');
      await adminPage.goto('/admin/staff-approvals');
      await expect(adminPage).toHaveURL(/\/admin\/staff-approvals/);

      // Chuyển sang tab "Duyệt gói hội viên"
      const memTabBtn = adminPage.getByRole('button', { name: /Duyệt gói hội viên/i });
      await memTabBtn.click();

      const pendingRow = adminPage.locator('tr', { hasText: testPkgName }).first();
      await expect(pendingRow).toBeVisible({ timeout: 7000 });
      const approveBtn = pendingRow.getByRole('button', { name: /Kích hoạt gói|Duyệt/i });
      await approveBtn.click();
      await expect(adminPage.getByText(/Kích hoạt gói thành công|Đã duyệt gói/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Admin đã duyệt gói thành công');

      // BƯỚC 4: Member kiểm tra gói tập đã kích hoạt trên UI
      console.log('--- BƯỚC 4: Member kiểm tra quyền lợi đã kích hoạt ---');
      // 4.1 Dashboard
      await memberPage.goto('/member');
      await expect(memberPage).toHaveURL(/\/member$/);
      await expect(memberPage.getByText(testPkgName).first()).toBeVisible({ timeout: 7000 });

      // 4.2 Thẻ số Profile
      await memberPage.goto('/member/profile');
      await expect(memberPage.getByText(testPkgName).first()).toBeVisible({ timeout: 7000 });

      // 4.3 Lịch sử giao dịch
      await memberPage.goto('/member/transactions');
      await expect(memberPage).toHaveURL(/\/member\/transactions/);
      await expect(memberPage.locator('table, .space-y-4').first()).toBeVisible({ timeout: 5000 });
      console.log('HOÀN THÀNH 100% LUỒNG 1: Gói Tập & Voucher!');
    } finally {
      await adminContext.close();
      await memberContext.close();
    }
  });
});
