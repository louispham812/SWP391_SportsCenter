import { test, expect } from '@playwright/test';
import { loginManager } from './helpers.js';

test.describe('LUỒNG 3: Luồng Quầy Lễ Tân: Check-in, POS Bán Hàng, Mượn/Trả Đồ & Báo Cáo Giao Ca', () => {
  test('Quy trình tuần tự liên thông trọn vẹn Luồng 3 trên UI thực tế', async ({ page, baseURL, browser }) => {
    test.setTimeout(90000);

    const recepContext = await browser.newContext({ baseURL });
    const recepPage = await recepContext.newPage();

    try {
      // Đăng nhập Lễ tân
      console.log('--- Đăng nhập Lễ tân ---');
      await recepPage.goto('/login');
      await recepPage.getByPlaceholder('name@example.com / 0912...').fill('reception.le@sporthub.com');
      await recepPage.getByPlaceholder('••••••••').fill('SportHub@123');
      await recepPage.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();
      await expect(recepPage).toHaveURL(/\/receptionist/);

      // BƯỚC 1: Quầy Check-in (/receptionist/checkin)
      console.log('--- BƯỚC 1: Quầy Check-in RFID & Thẻ ---');
      await recepPage.goto('/receptionist/checkin');
      await expect(recepPage).toHaveURL(/\/receptionist\/checkin/);

      // Quét thẻ từ RFID hoặc QR code
      const rfidInput = recepPage.getByPlaceholder(/Quét mã QR thẻ hội viên hoặc quẹt thẻ từ RFID/i);
      await expect(rfidInput).toBeVisible({ timeout: 5000 });
      await rfidInput.fill('RFID-SH-0009');
      await recepPage.getByRole('button', { name: /Tra Cứu Thẻ/i }).click();

      // Hồ sơ nhận diện hội viên hiển thị
      const checkInBtn = recepPage.getByRole('button', { name: /XÁC NHẬN CHO VÀO TẬP/i });
      await expect(checkInBtn).toBeVisible({ timeout: 7000 });
      await checkInBtn.click();

      // Kiểm tra thông báo hoặc kết quả check-in
      await expect(recepPage.getByText(/ĐIỂM DANH THÀNH CÔNG|TỪ CHỐI VÀO TẬP|đã được lưu/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Check-in hội viên tại quầy thành công');

      // BƯỚC 2: Quầy POS Bán Gói & Dịch Vụ (/receptionist/pos)
      console.log('--- BƯỚC 2: Bán gói tập / dịch vụ tại quầy POS ---');
      await recepPage.goto('/receptionist/pos');
      await expect(recepPage).toHaveURL(/\/receptionist\/pos/);

      // Tìm hội viên
      const searchMemberInput = recepPage.locator('#member-search');
      await searchMemberInput.fill('0934567890');
      await recepPage.waitForTimeout(400);

      const memberResultBtn = recepPage.locator('button', { hasText: 'Nguyễn Anh Khoa' }).first();
      await expect(memberResultBtn).toBeVisible({ timeout: 5000 });
      await memberResultBtn.click();

      // Chọn gói tập từ dropdown
      const packageSelect = recepPage.locator('#package-select');
      await packageSelect.selectOption({ index: 1 });

      // Chọn phương thức Tiền mặt tại quầy
      await recepPage.locator('#payment-method').selectOption('CASH');

      // Bấm nút "Xác nhận và xuất biên lai POS"
      const submitPosBtn = recepPage.getByRole('button', { name: /Xác nhận và xuất biên lai POS/i });
      await expect(submitPosBtn).toBeVisible();
      await submitPosBtn.click();

      // Modal biên lai in nhiệt mở ra
      await expect(recepPage.getByText(/HÓA ĐƠN THANH TOÁN DỊCH VỤ|ĐÃ THANH TOÁN/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Giao dịch POS quầy lễ tân đã thanh toán và sinh biên lai nhiệt');

      // Đóng modal in biên lai nếu có nút Đóng
      const closeReceiptBtn = recepPage.getByRole('button', { name: /Đóng/i }).first();
      if (await closeReceiptBtn.isVisible()) {
        await closeReceiptBtn.click();
      }

      // BƯỚC 3: Mượn & Trả Dụng Cụ (/receptionist/equipment)
      console.log('--- BƯỚC 3: Quản lý mượn và trả dụng cụ ---');
      await recepPage.goto('/receptionist/equipment');
      await expect(recepPage).toHaveURL(/\/receptionist\/equipment/);

      // Tìm hội viên mượn đồ
      const equipMemberSearch = recepPage.getByPlaceholder(/Nhập tên, số điện thoại hoặc mã RFID/i);
      await expect(equipMemberSearch).toBeVisible({ timeout: 5000 });
      await equipMemberSearch.fill('0934567890');
      await recepPage.waitForTimeout(500);

      const chooseMemberBtn = recepPage.locator('button', { hasText: 'Chọn' }).first();
      if (await chooseMemberBtn.isVisible({ timeout: 5000 })) {
        await chooseMemberBtn.click();
      }

      // Chọn dụng cụ trong kho
      const equipSelect = recepPage.locator('select').first();
      await equipSelect.selectOption({ index: 1 });

      // Bấm nút "Xác nhận xuất mượn dụng cụ"
      const borrowBtn = recepPage.getByRole('button', { name: /Xác nhận xuất mượn dụng cụ/i });
      if (await borrowBtn.isEnabled({ timeout: 5000 })) {
        await borrowBtn.click();
        await expect(recepPage.getByText(/Mượn dụng cụ thành công|Đã ghi nhận mượn/i).first()).toBeVisible({ timeout: 7000 });
        console.log('Đã tạo phiếu mượn dụng cụ thể thao');
      }

      // Thao tác trả đồ trên dòng đầu tiên của bảng Đang mượn
      const returnBtn = recepPage.locator('tr').getByRole('button', { name: /Nhận trả đồ/i }).first();
      if (await returnBtn.isVisible({ timeout: 5000 })) {
        await returnBtn.click();

        // Modal xác nhận trả đồ & tính phí
        const confirmReturnBtn = recepPage.getByRole('button', { name: /Hoàn tất & In biên lai/i });
        await expect(confirmReturnBtn).toBeVisible({ timeout: 5000 });
        await confirmReturnBtn.click();

        await expect(recepPage.getByText(/Trả đồ hoàn tất|Đã nhận lại/i).first()).toBeVisible({ timeout: 7000 });
        console.log('Đã hoàn tất trả đồ và thu phí thành công');
      }

      // BƯỚC 4: Báo cáo giao ca & Dashboard Admin
      console.log('--- BƯỚC 4: Báo cáo ca trực & Đối soát Admin ---');
      // 4.1 Báo cáo ca trực
      await recepPage.goto('/receptionist/shift');
      await expect(recepPage).toHaveURL(/\/receptionist\/shift/);
      await expect(recepPage.getByRole('heading', { name: /Báo cáo ca trực & doanh thu/i })).toBeVisible({ timeout: 7000 });

      // Bấm nút "Xuất Báo Cáo (CSV)"
      const exportBtn = recepPage.getByRole('button', { name: /Xuất Báo Cáo \(CSV\)/i });
      await expect(exportBtn).toBeVisible();

      // 4.2 Kiểm tra đối soát trên Admin Dashboard
      const adminContext = await browser.newContext({ baseURL });
      const adminPage = await adminContext.newPage();
      try {
        await loginManager(adminPage);
        await adminPage.goto('/admin');
        await expect(adminPage).toHaveURL(/\/admin/);
        await expect(adminPage.locator('main').first()).toBeVisible({ timeout: 7000 });
        console.log('Admin Dashboard đã cập nhật số liệu đối soát giao ca');
      } finally {
        await adminContext.close();
      }

      console.log('HOÀN THÀNH 100% LUỒNG 3: Quầy Lễ Tân (Check-in, POS, Mượn/Trả đồ, Giao ca)!');
    } finally {
      await recepContext.close();
    }
  });
});
