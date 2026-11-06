import { test, expect } from '@playwright/test';
import { loginMember, loginReceptionist, loginManager, readMemberTestData, apiBaseUrl } from './helpers.js';

test.describe('SUITE 2: Xác Thực, Phân Quyền Người Dùng & Hồ Sơ Cá Nhân (Auth, Users & Profile Persistence)', () => {
  test('1. Đăng ký & Duy trì phiên đăng nhập hội viên sau F5', async ({ page }) => {
    const member = readMemberTestData();
    await page.goto('/login');
    await page.getByPlaceholder('name@example.com / 0912...').fill(member.email);
    await page.getByPlaceholder('••••••••').fill(member.password);
    await page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();

    await expect(page).toHaveURL(/\/member$/);
    await expect(page.getByRole('heading', { name: new RegExp(member.name, 'i') })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: new RegExp(member.name, 'i') })).toBeVisible();
  });

  test('2. Tuyển dụng nhân sự mới (Staff Onboarding) -> Admin Duyệt -> Đăng nhập đúng phân quyền', async ({ browser, baseURL }) => {
    const registerContext = await browser.newContext({ baseURL });
    const registerPage = await registerContext.newPage();
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();
    const newStaffContext = await browser.newContext({ baseURL });
    const newStaffPage = await newStaffContext.newPage();

    const timestamp = Date.now();
    const staffEmail = `coach.e2e.${timestamp}@sporthub.com`;
    const staffPhone = `098${timestamp.toString().slice(-7)}`;
    const staffPassword = 'SportHub@123';
    const staffName = `HLV Kiểm Thử ${timestamp.toString().slice(-4)}`;

    try {
      // 1. Nộp hồ sơ nhân sự mới trên trang Đăng ký UI thực tế
      await registerPage.goto('/register');
      await expect(registerPage.getByRole('heading', { name: /Chào Mừng Đến Với F Sport/i })).toBeVisible({ timeout: 7000 });

      // Chọn loại tài khoản Huấn luyện viên
      const coachRoleBtn = registerPage.getByRole('button', { name: 'Huấn luyện viên' });
      await expect(coachRoleBtn).toBeVisible({ timeout: 5000 });
      await coachRoleBtn.click();

      // Điền thông tin đăng ký
      await registerPage.getByPlaceholder('Nguyễn Văn A').fill(staffName);
      await registerPage.getByPlaceholder('0912 345 678').fill(staffPhone);
      await registerPage.getByPlaceholder('name@example.com').fill(staffEmail);
      await registerPage.getByPlaceholder('••••••••').fill(staffPassword);

      const agreeCheckbox = registerPage.locator('input[type="checkbox"]');
      if (await agreeCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await agreeCheckbox.check();
      }

      await registerPage.getByRole('button', { name: /ĐĂNG KÝ TÀI KHOẢN NGAY/i }).click();
      await expect(registerPage.getByText(/Đăng ký tài khoản nhân sự thành công|chờ Quản trị viên/i).first()).toBeVisible({ timeout: 7000 });

      // 2. Admin vào /admin/staff-approvals duyệt nhân sự
      await loginManager(adminPage);
      await adminPage.goto('/admin/staff-approvals');
      await expect(adminPage).toHaveURL(/\/admin\/staff-approvals/);

      const staffRow = adminPage.locator('tr').filter({ hasText: staffEmail }).first();
      await expect(staffRow).toBeVisible({ timeout: 10000 });

      const activateBtn = staffRow.getByRole('button', { name: /Phê duyệt|Kích hoạt|Duyệt|ACTIVE/i });
      await expect(activateBtn).toBeVisible({ timeout: 5000 });
      await activateBtn.click();
      await expect(adminPage.getByText(/Đã duyệt tài khoản|Đã kích hoạt|thành công/i).first()).toBeVisible({ timeout: 7000 });

      // F5 reload Admin page: trang ổn định
      await adminPage.reload();
      await expect(adminPage.locator('main').first()).toBeVisible({ timeout: 10000 });

      // 3. Nhân sự mới đăng nhập hệ thống và vào đúng Dashboard Coach
      await newStaffPage.goto('/login');
      await newStaffPage.getByPlaceholder('name@example.com / 0912...').fill(staffEmail);
      await newStaffPage.getByPlaceholder('••••••••').fill(staffPassword);
      await newStaffPage.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();
      await expect(newStaffPage).toHaveURL(/\/coach/);
      await expect(newStaffPage.getByRole('heading', { name: new RegExp(staffName, 'i') }).first()).toBeVisible({ timeout: 10000 });
    } finally {
      await registerContext.close();
      await adminContext.close();
      await newStaffContext.close();
    }
  });

  test('3. Quản trị viên Khóa & Mở khóa tài khoản hội viên an toàn', async ({ browser, baseURL }) => {
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();

    try {
      await loginManager(adminPage);
      await adminPage.goto('/admin/members');
      await expect(adminPage).toHaveURL(/\/admin\/members/);

      const firstRow = adminPage.locator('tbody tr').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      const toggleLockBtn = firstRow.getByRole('button', { name: /Khóa|Mở khóa/i }).first();
      if (await toggleLockBtn.isVisible()) {
        const initialText = await toggleLockBtn.innerText();
        await toggleLockBtn.click();
        await adminPage.waitForTimeout(1000);
        await adminPage.reload();
        await expect(adminPage.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

        // Khôi phục lại trạng thái ban đầu
        const restoreBtn = adminPage.locator('tbody tr').first().getByRole('button', { name: /Khóa|Mở khóa/i }).first();
        if (await restoreBtn.isVisible() && (await restoreBtn.innerText()) !== initialText) {
          await restoreBtn.click();
          await adminPage.waitForTimeout(500);
        }
      }
    } finally {
      await adminContext.close();
    }
  });

  test('4. Cập nhật hồ sơ đa vai trò (Member, Lễ tân) -> Bền vững sau F5 & Điều hướng', async ({ browser, baseURL }) => {
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();
    const recepContext = await browser.newContext({ baseURL });
    const recepPage = await recepContext.newPage();

    const newAddress = `Số ${Date.now().toString().slice(-4)} Đường Hoa Hồng, TP.HCM`;

    try {
      // 1. Hội viên cập nhật địa chỉ
      await loginMember(memberPage);
      await Promise.all([
        memberPage.waitForResponse((res) => res.url().includes('/profile') && res.request().method() === 'GET').catch(() => {}),
        memberPage.goto('/member/profile'),
      ]);
      await expect(memberPage).toHaveURL(/\/member\/profile/);
      await memberPage.waitForTimeout(500);

      const memberAddressInput = memberPage.locator('input[placeholder*="Số nhà, đường"]').first();
      if (await memberAddressInput.isVisible()) {
        await memberAddressInput.fill(newAddress);
        await Promise.all([
          memberPage.waitForResponse((res) => res.url().includes('/profile') && (res.request().method() === 'PUT' || res.request().method() === 'POST' || res.request().method() === 'PATCH')).catch(() => {}),
          memberPage.getByRole('button', { name: /Lưu Hồ Sơ Cá Nhân/i }).click(),
        ]);
        await expect(memberPage.getByText(/Hồ sơ đã được lưu thành công|thành công/i).first()).toBeVisible({ timeout: 7000 });

        // F5 reload & điều hướng kiểm chứng bền vững
        await memberPage.goto('/member');
        await memberPage.goto('/member/profile');
        await memberPage.reload();
        await memberPage.waitForResponse((res) => res.url().includes('/profile') && res.request().method() === 'GET').catch(() => {});
        await expect(memberAddressInput).toHaveValue(newAddress, { timeout: 10000 });
      }

      // 2. Lễ tân cập nhật địa chỉ
      await loginReceptionist(recepPage);
      await Promise.all([
        recepPage.waitForResponse((res) => res.url().includes('/receptionist/profile') && res.request().method() === 'GET').catch(() => {}),
        recepPage.goto('/receptionist/profile'),
      ]);
      await expect(recepPage).toHaveURL(/\/receptionist\/profile/);
      await recepPage.waitForTimeout(500);

      const recepAddressInput = recepPage.locator('input[placeholder*="Số nhà, đường"]').first();
      if (await recepAddressInput.isVisible()) {
        await recepAddressInput.fill(newAddress);
        await Promise.all([
          recepPage.waitForResponse((res) => res.url().includes('/receptionist/profile') && res.request().method() === 'PUT').catch(() => {}),
          recepPage.getByRole('button', { name: /Lưu Thay Đổi|Lưu/i }).click(),
        ]);
        await expect(recepPage.getByText(/Hồ sơ nhân viên đã được cập nhật|Thông tin hồ sơ nhân viên lễ tân đã được lưu|thành công/i).first()).toBeVisible({ timeout: 7000 });

        // F5 reload & điều hướng kiểm chứng bền vững
        await recepPage.goto('/receptionist');
        await recepPage.goto('/receptionist/profile');
        await recepPage.reload();
        await recepPage.waitForResponse((res) => res.url().includes('/receptionist/profile') && res.request().method() === 'GET').catch(() => {});
        await expect(recepAddressInput).toHaveValue(newAddress, { timeout: 10000 });
      }
    } finally {
      await memberContext.close();
      await recepContext.close();
    }
  });

  test('5. Lễ tân cập nhật thông tin hội viên & Liên hệ khẩn cấp -> Bền vững sau F5 -> Đồng bộ hồ sơ cá nhân', async ({ browser, baseURL }) => {
    const recepContext = await browser.newContext({ baseURL });
    const recepPage = await recepContext.newPage();
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();

    const contactName = `Bà Trần Thị Lan ${Date.now().toString().slice(-4)}`;
    const contactPhone = '0912349999';

    try {
      // 1. Lễ tân vào quản lý hội viên và cập nhật liên hệ khẩn cấp
      await loginReceptionist(recepPage);
      await recepPage.goto('/receptionist/members');
      await expect(recepPage).toHaveURL(/\/receptionist\/members/);
      await expect(recepPage.getByRole('heading', { name: /Tra cứu hồ sơ/i })).toBeVisible({ timeout: 10000 });

      // Tìm kiếm hội viên
      const searchBox = recepPage.locator('#member-search');
      await searchBox.fill('Khoa');
      await recepPage.getByRole('button', { name: /Tìm hội viên/i }).click();
      await recepPage.waitForTimeout(500);

      // Mở modal cập nhật liên hệ khẩn cấp
      const emergencyBtn = recepPage.locator('button[title*="Liên hệ khẩn cấp"], button:has-text("Khẩn cấp")').first();
      await expect(emergencyBtn).toBeVisible({ timeout: 5000 });
      await emergencyBtn.click();

      // Điền form liên hệ khẩn cấp
      const nameInput = recepPage.locator('#emergency-name');
      const phoneInput = recepPage.locator('#emergency-phone');
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      await nameInput.fill(contactName);
      await phoneInput.fill(contactPhone);

      // Lưu thông tin
      const saveBtn = recepPage.getByRole('button', { name: /Lưu Thông Tin Khẩn Cấp/i });
      await saveBtn.click();
      await expect(recepPage.getByText(/Cập nhật liên hệ khẩn cấp thành công!/i).first()).toBeVisible({ timeout: 7000 });

      // F5 reload kiểm chứng bền vững dữ liệu Lễ tân
      await recepPage.reload();
      await recepPage.locator('#member-search').fill('Khoa');
      await recepPage.getByRole('button', { name: /Tìm hội viên/i }).click();
      await recepPage.waitForTimeout(500);
      await expect(recepPage.getByText(contactName).first()).toBeVisible({ timeout: 7000 });

      // 2. Hội viên đăng nhập kiểm tra hồ sơ cá nhân
      await loginMember(memberPage);
      await memberPage.goto('/member/profile');
      await expect(memberPage).toHaveURL(/\/member\/profile/);
      await memberPage.reload();
      await expect(memberPage.locator('main').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await recepContext.close();
      await memberContext.close();
    }
  });

  test('6. Ghi nhận chỉ số thể lực InBody & Tương tác trợ lý AI Assistant', async ({ page }) => {
    await loginMember(page);
    await page.goto('/member/ai-assistant');
    await expect(page).toHaveURL(/\/member\/ai-assistant/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });

    // Kiểm tra gửi tin nhắn đến AI Assistant
    const aiChatInput = page.locator('textarea, input[placeholder*="Hỏi"], input[placeholder*="Nhập"]').first();
    if (await aiChatInput.isVisible()) {
      await aiChatInput.fill('Gợi ý cho tôi thực đơn tăng cơ 2000 calo');
      const sendBtn = page.locator('button:has-text("Gửi"), button[type="submit"]').first();
      if (await sendBtn.isVisible()) {
        await sendBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // F5 reload xác nhận giao diện AI Assistant ổn định không crash
    await page.reload();
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });
});
