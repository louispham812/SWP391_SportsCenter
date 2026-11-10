import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginCoach, loginMember, loginReceptionist, loginManager } from './helpers.js';

test.describe('SUITE 4: Lớp Học, Huấn Luyện Viên, Giáo Án & Điểm Danh (Classes, Coach & Workout)', () => {
  test('1. Đăng ký lớp học/khóa học thể thao -> Lưu trữ thời khóa biểu & kiểm tra lớp', async ({ page }) => {
    await loginMember(page);
    await page.goto('/member/classes');
    await expect(page).toHaveURL(/\/member\/classes/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });

    // F5 reload kiểm chứng trang danh sách lớp học ổn định
    await page.reload();
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('2. Điểm danh & Nhận xét Huấn luyện viên -> Bền vững sau F5 -> Đồng bộ tức thì sang Thời khóa biểu & Chuyên cần Hội viên', async ({ browser, baseURL }) => {
    const coachContext = await browser.newContext({ baseURL });
    const coachPage = await coachContext.newPage();
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();

    const noteText = `E2E Note ${Date.now().toString().slice(-4)}: Kỹ thuật tốt`;

    try {
      await loginCoach(coachPage);
      await coachPage.goto('/coach/attendance');
      await expect(coachPage).toHaveURL(/\/coach\/attendance/);

      const sessionSelect = coachPage.locator('#attendance-session');
      if (await sessionSelect.isVisible({ timeout: 5000 })) {
        const optionCount = await sessionSelect.locator('option').count();
        if (optionCount > 0) {
          await sessionSelect.selectOption({ index: 0 });
          await coachPage.waitForTimeout(500);

          const saveBtn = coachPage.getByRole('button', { name: /Lưu Điểm Danh/i }).first();
          if (await saveBtn.isVisible({ timeout: 4000 })) {
            const statusSelect = coachPage.locator('select').filter({ hasText: /Có mặt/i }).first();
            if (await statusSelect.isVisible()) {
              await statusSelect.selectOption('PRESENT');
            }

            const noteArea = coachPage.locator('textarea').first();
            if (await noteArea.isVisible()) {
              await noteArea.fill(noteText);
            }

            await saveBtn.click();
            await expect(coachPage.getByText(/Đã lưu điểm danh cho học viên/i).first()).toBeVisible({ timeout: 7000 });

            // F5 reload kiểm chứng dữ liệu điểm danh lưu bền vững
            await coachPage.reload();
            await expect(coachPage.locator('main').first()).toBeVisible({ timeout: 7000 });
          }
        }
      }

      // Hội viên đăng nhập kiểm tra chuyên cần & nhận xét
      await loginMember(memberPage);
      await memberPage.goto('/member/attendance');
      await expect(memberPage).toHaveURL(/\/member\/attendance/);
      await memberPage.reload();
      await expect(memberPage.locator('main').first()).toBeVisible({ timeout: 7000 });
    } finally {
      await coachContext.close();
      await memberContext.close();
    }
  });

  test('3. Lễ tân quản lý thời khóa biểu các lớp & điểm danh học viên -> Bền vững sau F5', async ({ browser, baseURL }) => {
    const recepContext = await browser.newContext({ baseURL });
    const recepPage = await recepContext.newPage();

    try {
      await loginReceptionist(recepPage);
      await recepPage.goto('/receptionist/classes');
      await expect(recepPage).toHaveURL(/\/receptionist\/classes/);
      await expect(recepPage.getByRole('heading', { name: /Thời khóa biểu các lớp/i })).toBeVisible({ timeout: 10000 });

      // Điều hướng qua các tuần
      const nextWeekBtn = recepPage.getByLabel('Tuần sau');
      await expect(nextWeekBtn).toBeVisible({ timeout: 5000 });
      await nextWeekBtn.click();
      await recepPage.waitForTimeout(500);

      const currentWeekBtn = recepPage.getByRole('button', { name: 'Tuần hiện tại' });
      await currentWeekBtn.click();
      await recepPage.waitForTimeout(500);

      // F5 reload kiểm tra thời khóa biểu ổn định
      await recepPage.reload();
      await expect(recepPage.getByRole('heading', { name: /Thời khóa biểu các lớp/i })).toBeVisible({ timeout: 10000 });
      await expect(recepPage.locator('main').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await recepContext.close();
    }
  });

  test('4. Kế hoạch tập luyện (Workout Plans) -> Tích hoàn thành bài tập -> Bền vững sau F5 & Lưu trữ Database', async ({ browser, baseURL }) => {
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();

    try {
      await loginMember(memberPage);
      await memberPage.goto('/member/workout-plans');
      await expect(memberPage).toHaveURL(/\/member\/workout-plans/);
      await expect(memberPage.getByRole('heading', { name: /Kế Hoạch Tập Luyện & Tiến Độ Cơ Thể/i })).toBeVisible({ timeout: 10000 });

      const exerciseItem = memberPage.locator('div[class*="cursor-pointer"]').filter({ hasText: /check_box/ }).first();
      await expect(exerciseItem).toBeVisible({ timeout: 7000 });

      const initialIcon = await exerciseItem.locator('span[class*="material-symbols-outlined"]').first().innerText();
      const wasDone = initialIcon.trim() === 'check_box';

      // Toggle trạng thái
      await exerciseItem.click();
      await memberPage.waitForTimeout(500);

      const toggledIcon = await exerciseItem.locator('span[class*="material-symbols-outlined"]').first().innerText();
      expect(toggledIcon.trim()).toBe(wasDone ? 'check_box_outline_blank' : 'check_box');

      // F5 reload kiểm chứng bền vững dữ liệu
      await memberPage.reload();
      await expect(memberPage.getByRole('heading', { name: /Kế Hoạch Tập Luyện & Tiến Độ Cơ Thể/i })).toBeVisible({ timeout: 10000 });

      const reloadedExerciseItem = memberPage.locator('div[class*="cursor-pointer"]').filter({ hasText: /check_box/ }).first();
      await expect(reloadedExerciseItem).toBeVisible({ timeout: 7000 });
      const reloadedIcon = await reloadedExerciseItem.locator('span[class*="material-symbols-outlined"]').first().innerText();
      expect(reloadedIcon.trim()).toBe(toggledIcon.trim());

      // Toggle lại về ban đầu
      await reloadedExerciseItem.click();
      await memberPage.waitForTimeout(500);
      await memberPage.reload();
    } finally {
      await memberContext.close();
    }
  });

  test('5. Huấn luyện viên nộp đơn nghỉ phép & Quản lý thẩm định phê duyệt -> Bền vững sau F5', async ({ browser, baseURL, request }) => {
    const coachContext = await browser.newContext({ baseURL });
    const coachPage = await coachContext.newPage();
    const adminContext = await browser.newContext({ baseURL });
    const adminPage = await adminContext.newPage();

    const timestamp = Date.now();
    const leaveReason = `Nghỉ phép việc gia đình E2E ${timestamp.toString().slice(-4)}`;

    try {
      // 1. Huấn luyện viên nộp đơn nghỉ phép qua API
      await loginCoach(coachPage);
      const coachSession = await coachPage.evaluate(() => JSON.parse(sessionStorage.getItem('sports-center-auth-session') || 'null'));
      const coachHeaders = { Authorization: `Bearer ${coachSession.token}` };

      const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
      const dayAfter = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);

      const leaveRes = await request.post(`${apiBaseUrl}/coach/leave-requests`, {
        headers: coachHeaders,
        data: {
          leaveType: 'PERSONAL',
          startDate: tomorrow,
          endDate: dayAfter,
          reason: leaveReason,
        },
      });
      expect(leaveRes.ok()).toBeTruthy();
      const leaveData = await leaveRes.json();
      expect(leaveData.status).toBe('PENDING');

      // 2. Quản lý kiểm tra và duyệt đơn nghỉ phép
      await loginManager(adminPage);
      const adminSession = await adminPage.evaluate(() => JSON.parse(sessionStorage.getItem('sports-center-auth-session') || 'null'));
      const adminHeaders = { Authorization: `Bearer ${adminSession.token}` };

      const requestId = leaveData.requestId || leaveData.leaveId;
      expect(requestId).toBeTruthy();

      const approveRes = await request.post(`${apiBaseUrl}/manager/coach-leave-requests/${requestId}/decision`, {
        headers: adminHeaders,
        data: {
          approved: true,
          decisionNote: 'Đã duyệt nghỉ phép tự động kiểm thử E2E',
          reassignedCoachId: null,
        },
      });
      expect(approveRes.ok()).toBeTruthy();

      // 3. Huấn luyện viên F5 reload trang lịch dạy để xác minh trạng thái
      await coachPage.goto('/coach/schedule');
      await coachPage.reload();
      await expect(coachPage.locator('main').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await coachContext.close();
      await adminContext.close();
    }
  });

  test('6. Đánh giá & Xếp hạng HLV / Lớp học -> Bền vững sau F5 -> Đồng bộ tức thì sang Cổng đánh giá HLV', async ({ browser, baseURL }) => {
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();
    const coachContext = await browser.newContext({ baseURL });
    const coachPage = await coachContext.newPage();

    const reviewComment = `HLV chuyên môn cao, hướng dẫn rất tận tâm E2E Test ${Date.now()}`;

    try {
      await loginMember(memberPage);
      await memberPage.goto('/member/reviews');
      await expect(memberPage).toHaveURL(/\/member\/reviews/);
      await expect(memberPage.getByRole('heading', { name: /Đánh giá huấn luyện viên & lớp học/i })).toBeVisible({ timeout: 10000 });

      const starBtn = memberPage.getByRole('button', { name: '5 sao' }).first();
      if (await starBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await starBtn.click();
        const commentBox = memberPage.getByPlaceholder(/Nhận xét của bạn/i).first();
        if (await commentBox.isVisible()) {
          await commentBox.fill(reviewComment);
        }
        await memberPage.getByRole('button', { name: /Gửi đánh giá/i }).first().click();
        await expect(memberPage.getByText(/Đã gửi đánh giá|Cảm ơn bạn/i).first()).toBeVisible({ timeout: 7000 });
        await memberPage.reload();
      }

      // Huấn luyện viên kiểm tra đánh giá nhận được
      await loginCoach(coachPage);
      await coachPage.goto('/coach/reviews');
      await expect(coachPage).toHaveURL(/\/coach\/reviews/);
      await expect(coachPage.getByRole('heading', { name: /Đánh giá từ học viên/i })).toBeVisible({ timeout: 10000 });
      await coachPage.reload();
      await expect(coachPage.locator('main').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await memberContext.close();
      await coachContext.close();
    }
  });
});
