import { test, expect } from '@playwright/test';
import { loginMember, loginReceptionist, loginCoach } from './helpers.js';

test.describe('LUỒNG 6: Cập Nhật Hồ Sơ Người Dùng Đa Vai Trò & Tương Tác Trợ Lý Trí Tuệ Nhân Tạo AI Assistant', () => {
  test('Quy trình tuần tự liên thông trọn vẹn Luồng 6 trên UI thực tế', async ({ page, baseURL, browser }) => {
    test.setTimeout(90000);

    // BƯỚC 1: Member Cập Nhật Hồ Sơ Cá Nhân (/member/profile)
    console.log('--- BƯỚC 1: Hội viên Cập Nhật Hồ Sơ Cá Nhân ---');
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();
    try {
      await loginMember(memberPage);
      await memberPage.goto('/member/profile');
      await expect(memberPage).toHaveURL(/\/member\/profile/);
      await expect(memberPage.getByRole('heading', { name: /Hồ sơ hội viên/i })).toBeVisible({ timeout: 7000 });

      // Cập nhật địa chỉ hoặc thông tin liên hệ
      const addressInput = memberPage.locator('input[placeholder*="Số nhà, đường"]').first();
      if (await addressInput.isVisible()) {
        await addressInput.fill('123 Đường Thể Thao, Quận 1, TP. Hồ Chí Minh');
      }

      // Bấm Lưu Hồ Sơ Cá Nhân
      const saveMemberProfileBtn = memberPage.getByRole('button', { name: /Lưu Hồ Sơ Cá Nhân/i });
      await expect(saveMemberProfileBtn).toBeVisible({ timeout: 5000 });
      await saveMemberProfileBtn.click();

      // Kiểm tra toast thông báo thành công
      await expect(memberPage.getByText(/Hồ sơ đã được lưu thành công/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Hội viên đã lưu cập nhật hồ sơ cá nhân thành công');

      // BƯỚC 4: Member Chat Với Trợ Lý AI Assistant (/member/ai-assistant)
      console.log('--- BƯỚC 4: Hội viên Tương Tác Trợ Lý AI Assistant ---');
      await memberPage.goto('/member/ai-assistant');
      await expect(memberPage).toHaveURL(/\/member\/ai-assistant/);
      await expect(memberPage.getByRole('heading', { name: /Tiến Độ Rèn Luyện & AI Coach/i })).toBeVisible({ timeout: 7000 });

      // Nhập câu hỏi tư vấn tập luyện
      const aiInput = memberPage.getByPlaceholder(/Nhập câu hỏi của bạn cho AI Coach/i);
      await expect(aiInput).toBeVisible({ timeout: 5000 });
      await aiInput.fill('Tư vấn cho tôi lịch tập luyện nâng cao thể lực và chế độ dinh dưỡng tăng cơ');

      const sendAiBtn = memberPage.getByRole('button', { name: /Gửi câu hỏi/i });
      await expect(sendAiBtn).toBeEnabled({ timeout: 5000 });
      await sendAiBtn.click();

      // Kiểm tra câu trả lời xuất hiện trong khung chat
      const assistantMessage = memberPage.locator('div[class*="bg-white text-slate-800"]').first();
      await expect(assistantMessage).toBeVisible({ timeout: 30000 });
      const answerText = await assistantMessage.textContent();
      expect(answerText?.length).toBeGreaterThan(20);
      console.log('Trợ lý AI Assistant đã phản hồi trôi chảy, không gây crash trang');
    } finally {
      await memberContext.close();
    }

    // BƯỚC 2: Receptionist Cập Nhật Hồ Sơ Cá Nhân (/receptionist/profile)
    console.log('--- BƯỚC 2: Nhân viên Lễ tân Cập Nhật Hồ Sơ Cá Nhân ---');
    const recepContext = await browser.newContext({ baseURL });
    const recepPage = await recepContext.newPage();
    try {
      await loginReceptionist(recepPage);
      await recepPage.goto('/receptionist/profile');
      await expect(recepPage).toHaveURL(/\/receptionist\/profile/);
      await expect(recepPage.getByRole('heading', { name: /Hồ sơ cá nhân/i })).toBeVisible({ timeout: 7000 });

      // Cập nhật địa chỉ liên hệ
      const recepAddressInput = recepPage.locator('input[placeholder*="Số nhà, đường"]').first();
      if (await recepAddressInput.isVisible()) {
        await recepAddressInput.fill('Quầy Lễ Tân F Sport, Tầng 1 Sân Vận Động');
      }

      // Bấm Lưu Thay Đổi
      const saveRecepProfileBtn = recepPage.getByRole('button', { name: /Lưu Thay Đổi/i });
      await expect(saveRecepProfileBtn).toBeVisible({ timeout: 5000 });
      await saveRecepProfileBtn.click();

      // Kiểm tra toast thông báo thành công
      await expect(recepPage.getByText(/Thông tin hồ sơ nhân viên lễ tân đã được lưu/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Lễ tân đã lưu cập nhật hồ sơ cá nhân thành công');
    } finally {
      await recepContext.close();
    }

    // BƯỚC 3: Coach Cập Nhật Hồ Sơ Cá Nhân (/coach/profile)
    console.log('--- BƯỚC 3: Huấn Luyện Viên Cập Nhật Hồ Sơ Cá Nhân ---');
    const coachContext = await browser.newContext({ baseURL });
    const coachPage = await coachContext.newPage();
    try {
      await loginCoach(coachPage);
      await coachPage.goto('/coach/profile');
      await expect(coachPage).toHaveURL(/\/coach\/profile/);
      await expect(coachPage.getByRole('heading', { name: /Hồ Sơ Huấn Luyện Viên/i })).toBeVisible({ timeout: 7000 });

      // Cập nhật địa chỉ thường trú
      const coachAddressInput = coachPage.locator('input[placeholder*="Phường Bến Nghé"]').first();
      if (await coachAddressInput.isVisible()) {
        await coachAddressInput.fill('Trung tâm Huấn luyện Thể thao F Sport, Khu A');
      }

      // Bấm Lưu Hồ Sơ Cá Nhân
      const saveCoachProfileBtn = coachPage.getByRole('button', { name: /Lưu Hồ Sơ Cá Nhân/i });
      await expect(saveCoachProfileBtn).toBeVisible({ timeout: 5000 });
      await saveCoachProfileBtn.click();

      // Kiểm tra toast thông báo thành công
      await expect(coachPage.getByText(/Hồ sơ huấn luyện viên đã được lưu thành công/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Huấn luyện viên đã lưu cập nhật hồ sơ cá nhân thành công');
    } finally {
      await coachContext.close();
    }

    console.log('HOÀN THÀNH 100% LUỒNG 6: Cập Nhật Hồ Sơ Đa Vai Trò & Tương Tác AI Assistant!');
  });
});
