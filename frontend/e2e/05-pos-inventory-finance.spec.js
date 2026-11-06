import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginReceptionist, loginManager, loginMember } from './helpers.js';

test.describe('SUITE 5: Điểm Bán Hàng POS, Dụng Cụ Kho, Gói Tập & Tài Chính (POS, Inventory & Finance)', () => {
  test('1. POS bán hàng quầy lễ tân -> Bền vững sau F5 -> Đồng bộ tức thì sang Doanh thu Admin & Nhật ký Audit', async ({ browser, baseURL }) => {
    const recepContext = await browser.newContext({ baseURL });
    const recepPage = await recepContext.newPage();
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();

    try {
      await loginReceptionist(recepPage);
      await recepPage.goto('/receptionist/shift');
      await expect(recepPage).toHaveURL(/\/receptionist\/shift/);
      await expect(recepPage.getByRole('heading', { name: /Báo cáo ca trực & doanh thu/i })).toBeVisible({ timeout: 10000 });

      const revCard = recepPage.locator('article', { hasText: 'Doanh thu đã thu' }).locator('p').nth(1);
      await expect(revCard).toBeVisible({ timeout: 5000 });
      const revInitialText = await revCard.innerText();
      const revInitialNum = Number(revInitialText.replace(/[^\d]/g, '')) || 0;

      // POS bán dịch vụ
      await recepPage.goto('/receptionist/pos');
      await expect(recepPage).toHaveURL(/\/receptionist\/pos/);

      const searchInput = recepPage.locator('#member-search');
      await expect(searchInput).toBeVisible({ timeout: 5000 });
      await searchInput.fill('0934567890');
      await recepPage.waitForTimeout(500);

      const memberBtn = recepPage.locator('button', { hasText: 'Nguyễn Anh Khoa' }).first();
      await expect(memberBtn).toBeVisible({ timeout: 5000 });
      await memberBtn.click();

      const packageSelect = recepPage.locator('#package-select');
      await packageSelect.selectOption({ index: 1 });
      await recepPage.locator('#payment-method').selectOption('CASH');

      const submitPosBtn = recepPage.getByRole('button', { name: /Xác nhận và xuất biên lai POS/i });
      await expect(submitPosBtn).toBeVisible();
      await submitPosBtn.click();

      const receiptModal = recepPage.getByText(/HÓA ĐƠN THANH TOÁN DỊCH VỤ|ĐÃ THANH TOÁN/i).first();
      await expect(receiptModal).toBeVisible({ timeout: 10000 });

      const closeReceiptBtn = recepPage.getByRole('button', { name: /Đóng/i }).first();
      if (await closeReceiptBtn.isVisible()) {
        await closeReceiptBtn.click();
      }

      // F5 reload kiểm chứng bền vững doanh thu Lễ tân
      await recepPage.goto('/receptionist/shift');
      await recepPage.reload();
      await expect(recepPage.getByRole('heading', { name: /Báo cáo ca trực & doanh thu/i })).toBeVisible({ timeout: 10000 });

      const revAfterRecepText = await revCard.innerText();
      const revAfterRecepNum = Number(revAfterRecepText.replace(/[^\d]/g, '')) || 0;
      expect(revAfterRecepNum).toBeGreaterThan(revInitialNum);

      // Quản lý kiểm tra Doanh thu đồng bộ
      await loginManager(adminPage);
      await adminPage.goto('/admin');
      await expect(adminPage).toHaveURL(/\/admin/);
      await expect(adminPage.locator('main').first()).toBeVisible({ timeout: 10000 });

      const adminRevMetric = adminPage.locator('article').filter({ hasText: 'Doanh thu đã thu' }).locator('strong').first();
      await expect(adminRevMetric).toBeVisible({ timeout: 10000 });
      const adminRevNum = Number((await adminRevMetric.innerText()).replace(/[^\d]/g, '')) || 0;
      expect(adminRevNum).toBe(revAfterRecepNum);

      // Kiểm tra Audit logs
      await adminPage.goto('/admin/audit-logs');
      await expect(adminPage).toHaveURL(/\/admin\/audit-logs/);
      await expect(adminPage.locator('table, tbody').first()).toBeVisible({ timeout: 10000 });
      await expect(adminPage.getByText(/PAYMENT|MEMBERSHIP|CHECKIN|POS|STAFF/i).first()).toBeVisible();
    } finally {
      await recepContext.close();
      await adminContext.close();
    }
  });

  test('2. Mượn / Trả dụng cụ thể thao -> Biến động tồn kho chính xác -> Bền vững sau F5 & Điều hướng', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    try {
      await loginReceptionist(page);
      await page.goto('/receptionist/equipment');
      await expect(page).toHaveURL(/\/receptionist\/equipment/);
      await expect(page.getByRole('heading', { name: /Quản Lý Mượn & Thuê Dụng Cụ Thể Thao/i })).toBeVisible({ timeout: 10000 });

      const equipSelect = page.locator('select').first();
      await expect(equipSelect).toBeVisible({ timeout: 5000 });

      const optionTexts = await equipSelect.locator('option').allInnerTexts();
      let targetIndex = -1;
      let initialAvail = 0;
      for (let i = 1; i < optionTexts.length; i++) {
        const match = optionTexts[i].match(/Còn\s+(\d+)\/(\d+)/);
        if (match && parseInt(match[1], 10) > 0) {
          targetIndex = i;
          initialAvail = parseInt(match[1], 10);
          break;
        }
      }

      expect(targetIndex, 'Phải có ít nhất 1 loại dụng cụ còn tồn kho khả dụng').toBeGreaterThan(0);

      // Thực hiện mượn dụng cụ
      const memberSearch = page.getByPlaceholder(/Nhập tên, số điện thoại hoặc mã RFID/i);
      await memberSearch.fill('0934567890');
      await page.waitForTimeout(500);

      const chooseBtn = page.locator('button', { hasText: 'Chọn' }).first();
      await expect(chooseBtn).toBeVisible({ timeout: 5000 });
      await chooseBtn.click();

      await equipSelect.selectOption({ index: targetIndex });
      const borrowBtn = page.getByRole('button', { name: /Xác nhận xuất mượn dụng cụ/i });
      await expect(borrowBtn).toBeEnabled({ timeout: 5000 });
      await borrowBtn.click();
      await expect(page.getByText(/Mượn dụng cụ thành công|Đã ghi nhận mượn/i).first()).toBeVisible({ timeout: 10000 });

      // Điều hướng & F5 reload kiểm chứng giảm tồn kho
      await page.goto('/receptionist/shift');
      await page.goto('/receptionist/equipment');
      await page.reload();
      await expect(page.getByRole('heading', { name: /Quản Lý Mượn & Thuê Dụng Cụ Thể Thao/i })).toBeVisible({ timeout: 10000 });

      const optionAfterBorrow = await page.locator('select').first().locator('option').nth(targetIndex).innerText();
      const matchAfterBorrow = optionAfterBorrow.match(/Còn\s+(\d+)\/(\d+)/);
      expect(matchAfterBorrow).toBeTruthy();
      expect(parseInt(matchAfterBorrow[1], 10)).toBe(initialAvail - 1);

      // Trả dụng cụ
      const loanRow = page.locator('tr').filter({ hasText: 'Nguyễn Anh Khoa' }).first();
      await expect(loanRow).toBeVisible({ timeout: 5000 });

      const returnBtn = loanRow.getByRole('button', { name: /Nhận trả đồ/i });
      await returnBtn.click();

      const confirmReturnBtn = page.getByRole('button', { name: /Hoàn tất & In biên lai/i });
      await expect(confirmReturnBtn).toBeVisible({ timeout: 5000 });
      await confirmReturnBtn.click();
      await expect(page.getByText(/Trả đồ hoàn tất|Đã nhận lại/i).first()).toBeVisible({ timeout: 10000 });

      // F5 reload kiểm chứng hoàn trả tồn kho
      await page.reload();
      await expect(page.getByRole('heading', { name: /Quản Lý Mượn & Thuê Dụng Cụ Thể Thao/i })).toBeVisible({ timeout: 10000 });

      const optionAfterReturn = await page.locator('select').first().locator('option').nth(targetIndex).innerText();
      const matchAfterReturn = optionAfterReturn.match(/Còn\s+(\d+)\/(\d+)/);
      expect(matchAfterReturn).toBeTruthy();
      expect(parseInt(matchAfterReturn[1], 10)).toBe(initialAvail);
    } finally {
      await context.close();
    }
  });

  test('3. Gói tập hội viên -> Admin tạo -> Member mua -> Admin duyệt -> Bền vững sau F5 & Lễ tân quầy check-in', async ({ browser, baseURL }) => {
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();
    const recepContext = await browser.newContext({ baseURL });
    const recepPage = await recepContext.newPage();

    const pkgName = `Gói DeepVIP ${Date.now().toString().slice(-4)}`;

    try {
      // 1. Admin tạo gói tập mới
      await loginManager(adminPage);
      await adminPage.goto('/admin/packages');
      await expect(adminPage).toHaveURL(/\/admin\/packages/);

      let testPrice = '10000000';
      try {
        const res = await fetch('http://127.0.0.1:8080/api/v1/packages');
        if (res.ok) {
          const pkgs = await res.json();
          const max = pkgs.reduce((m, p) => Math.max(m, Number(p.price || 0)), 0);
          testPrice = String(max + 500000);
        }
      } catch {
        testPrice = '10000000';
      }

      await adminPage.getByRole('button', { name: /Thêm gói tập mới/i }).click();
      await adminPage.getByPlaceholder('Ví dụ: Gói Gold 3 Tháng').fill(pkgName);
      await adminPage.locator('input[type="number"]').first().fill(testPrice);
      await adminPage.locator('input[type="number"]').nth(1).fill('90');
      await adminPage.locator('textarea').fill('Gói Deep State Persistence E2E Test');
      await adminPage.getByRole('button', { name: /Lưu gói tập/i }).click();
      await expect(adminPage.getByText(pkgName, { exact: true })).toBeVisible({ timeout: 7000 });

      // F5 kiểm tra gói tồn tại bền vững trên Admin
      await adminPage.reload();
      await expect(adminPage.getByText(pkgName, { exact: true })).toBeVisible({ timeout: 7000 });

      // 2. Member mua gói tập
      await loginMember(memberPage);
      await memberPage.goto('/member/packages');
      await expect(memberPage).toHaveURL(/\/member\/packages/);

      const pkgCard = memberPage.locator('.rounded-3xl', { hasText: pkgName }).first();
      await expect(pkgCard).toBeVisible({ timeout: 7000 });

      await pkgCard.getByRole('button', { name: /Nâng Cấp Lên Gói Này|Đăng Ký Gói Này|Gia Hạn Gói Này/i }).click();
      await memberPage.getByRole('button', { name: /Thanh toán tại quầy/i }).click();
      const confirmBuyBtn = memberPage.getByRole('button', { name: /Đăng Ký \(Trả Tại Quầy\)|Đăng Ký|Xác Nhận/i }).last();
      await confirmBuyBtn.click();
      await expect(memberPage.getByText(/phê duyệt|thành công/i).first()).toBeVisible({ timeout: 7000 });

      // 3. Admin duyệt yêu cầu mua gói
      await adminPage.goto('/admin/staff-approvals');
      await expect(adminPage).toHaveURL(/\/admin\/staff-approvals/);
      await adminPage.getByRole('button', { name: /Duyệt gói hội viên/i }).click();

      const pendingRow = adminPage.locator('tr', { hasText: pkgName }).first();
      await expect(pendingRow).toBeVisible({ timeout: 7000 });
      await pendingRow.getByRole('button', { name: /Kích hoạt gói|Duyệt/i }).click();
      await expect(adminPage.getByText(/Kích hoạt gói thành công|Đã duyệt gói/i).first()).toBeVisible({ timeout: 7000 });

      // 4. Member F5 reload & kiểm tra quyền lợi đã kích hoạt
      await memberPage.goto('/member');
      await memberPage.reload();
      await expect(memberPage.getByText(pkgName).first()).toBeVisible({ timeout: 7000 });

      // 5. Lễ tân tra cứu hội viên tại quầy check-in thấy hội viên hoạt động
      await loginReceptionist(recepPage);
      await recepPage.goto('/receptionist/checkin');
      await expect(recepPage).toHaveURL(/\/receptionist\/checkin/);
      const rfidInput = recepPage.getByPlaceholder(/Quét mã QR thẻ hội viên hoặc quẹt thẻ từ RFID/i);
      await rfidInput.fill('SPORTHUB-MEMBER-9');
      await recepPage.getByRole('button', { name: /Tra Cứu Thẻ/i }).click();
      await expect(recepPage.getByText(/Nguyễn Anh Khoa/i).first()).toBeVisible({ timeout: 7000 });
    } finally {
      await adminContext.close();
      await memberContext.close();
      await recepContext.close();
    }
  });

  test('4. Sổ giao dịch & Đối soát hóa đơn điện tử hội viên -> Bền vững sau F5 & Mở biên lai', async ({ browser, baseURL }) => {
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();

    try {
      await loginMember(memberPage);
      await memberPage.goto('/member/transactions');
      await expect(memberPage).toHaveURL(/\/member\/transactions/);
      await expect(memberPage.getByRole('heading', { name: /Lịch Sử Giao Dịch & Hóa Đơn/i })).toBeVisible({ timeout: 10000 });

      const filterAllBtn = memberPage.getByRole('button', { name: /Tất Cả/i }).first();
      await expect(filterAllBtn).toBeVisible({ timeout: 5000 });

      // Mở xem biên lai nếu có
      const viewReceiptBtn = memberPage.getByRole('button', { name: /Xem Biên Lai/i }).first();
      if (await viewReceiptBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await viewReceiptBtn.click();
        await expect(memberPage.getByText(/HÓA ĐƠN ĐIỆN TỬ|CHI TIẾT THANH TOÁN|BIÊN LAI/i).first()).toBeVisible({ timeout: 7000 });
        const closeBtn = memberPage.getByRole('button', { name: /Đóng/i }).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }

      await memberPage.reload();
      await expect(memberPage.getByRole('heading', { name: /Lịch Sử Giao Dịch & Hóa Đơn/i })).toBeVisible({ timeout: 10000 });
    } finally {
      await memberContext.close();
    }
  });

  test('5. Lễ tân báo cáo doanh thu giao ca & Xuất dữ liệu CSV đối soát Admin', async ({ browser, baseURL }) => {
    const recepContext = await browser.newContext({ baseURL });
    const recepPage = await recepContext.newPage();
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();

    try {
      await loginReceptionist(recepPage);
      await recepPage.goto('/receptionist/shift');
      await expect(recepPage).toHaveURL(/\/receptionist\/shift/);
      await expect(recepPage.getByRole('heading', { name: /Báo cáo ca trực & doanh thu/i })).toBeVisible({ timeout: 10000 });

      const exportCsvBtn = recepPage.getByRole('button', { name: /Xuất Báo Cáo \(CSV\)/i });
      await expect(exportCsvBtn).toBeVisible({ timeout: 5000 });

      await loginManager(adminPage);
      await adminPage.goto('/admin');
      await expect(adminPage).toHaveURL(/\/admin/);
      await expect(adminPage.locator('main').first()).toBeVisible({ timeout: 10000 });

      const adminExportBtn = adminPage.getByRole('button', { name: /Xuất Báo Cáo/i }).first();
      await expect(adminExportBtn).toBeVisible({ timeout: 5000 });

      await recepPage.reload();
      await adminPage.reload();
      await expect(recepPage.locator('main').first()).toBeVisible({ timeout: 10000 });
      await expect(adminPage.locator('main').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await recepContext.close();
      await adminContext.close();
    }
  });
});
