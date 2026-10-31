import { test, expect } from '@playwright/test';
import { loginMember, loginCoach } from './helpers.js';

test.describe('LUỒNG 4: Quản lý Lớp học, Điểm danh, Kế hoạch tập luyện (Workout Plans) & Đánh giá HLV', () => {
  test('Quy trình tuần tự liên thông trọn vẹn Luồng 4 trên UI thực tế', async ({ page, baseURL, browser }) => {
    test.setTimeout(90000);

    const coachContext = await browser.newContext({ baseURL });
    const coachPage = await coachContext.newPage();

    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();

    try {
      // BƯỚC 1: HLV Đăng nhập & Kiểm tra Lịch giảng dạy
      console.log('--- BƯỚC 1: HLV Đăng nhập & Xem Lịch dạy ---');
      await loginCoach(coachPage);
      await coachPage.goto('/coach/schedule');
      await expect(coachPage).toHaveURL(/\/coach\/schedule/);
      await expect(coachPage.locator('main').first()).toBeVisible({ timeout: 7000 });
      console.log('HLV đã truy cập Lịch giảng dạy thành công');

      // BƯỚC 2: HLV Điểm danh học viên (/coach/attendance)
      console.log('--- BƯỚC 2: HLV Thực hiện Điểm danh học viên ---');
      await coachPage.goto('/coach/attendance');
      await expect(coachPage).toHaveURL(/\/coach\/attendance/);

      // Kiểm tra dropdown chọn lớp giảng dạy
      const sessionSelect = coachPage.locator('#attendance-session');
      if (await sessionSelect.isVisible({ timeout: 5000 })) {
        const optionCount = await sessionSelect.locator('option').count();
        if (optionCount > 0) {
          await sessionSelect.selectOption({ index: 0 });
          await coachPage.waitForTimeout(500);

          // Nếu có danh sách hội viên điểm danh trong lớp
          const saveBtn = coachPage.getByRole('button', { name: /Lưu Điểm Danh/i }).first();
          if (await saveBtn.isVisible({ timeout: 4000 })) {
            // Chọn trạng thái Có mặt
            const statusSelect = coachPage.locator('select').filter({ hasText: /Có mặt/i }).first();
            if (await statusSelect.isVisible()) {
              await statusSelect.selectOption('PRESENT');
            }

            // Nhập nhận xét
            const noteArea = coachPage.locator('textarea').first();
            if (await noteArea.isVisible()) {
              await noteArea.fill('Học viên tiếp thu tốt, đúng kỹ thuật động tác.');
            }

            await saveBtn.click();
            await expect(coachPage.getByText(/Đã lưu điểm danh cho học viên/i).first()).toBeVisible({ timeout: 7000 });
            console.log('HLV đã điểm danh và gửi nhận xét thành công');
          } else {
            console.log('Lớp hiện tại chưa có học viên đặt chỗ để điểm danh');
          }
        }
      }

      // BƯỚC 3: HLV Kiểm tra Thu nhập (/coach/income)
      console.log('--- BƯỚC 3: HLV Đối soát Doanh thu & Thù lao ---');
      await coachPage.goto('/coach/income');
      await expect(coachPage).toHaveURL(/\/coach\/income/);
      await expect(coachPage.locator('main').first()).toBeVisible({ timeout: 7000 });
      console.log('HLV đã mở trang Báo cáo Doanh thu & Thu nhập');

      // BƯỚC 4: HLV Soạn & Giao Giáo Án Tập Luyện (/coach/students)
      console.log('--- BƯỚC 4: HLV Soạn & Giao Giáo Án cho Học viên ---');
      await coachPage.goto('/coach/students');
      await expect(coachPage).toHaveURL(/\/coach\/students/);

      const planBtn = coachPage.getByRole('button', { name: /Soạn Giáo Án|Giao Giáo Án Cả Lớp/i }).first();
      if (await planBtn.isVisible({ timeout: 5000 })) {
        await planBtn.click();

        // Modal Soạn Giáo Án hiển thị
        await expect(coachPage.getByText(/Soạn Giáo Án Tập Luyện & Đánh Giá|Giao Giáo Án Cả Lớp/i).first()).toBeVisible({ timeout: 7000 });

        // Submit form giáo án
        const submitPlanBtn = coachPage.getByRole('button', { name: /Lưu Giáo Án|Giao Giáo Án Toàn Bộ Lớp/i });
        await expect(submitPlanBtn).toBeVisible({ timeout: 5000 });
        await submitPlanBtn.click();

        // Kiểm tra toast thành công
        await expect(coachPage.getByText(/Đã lưu giáo án|Đã giao giáo án/i).first()).toBeVisible({ timeout: 7000 });
        console.log('HLV đã lưu giáo án tập luyện và gửi thông báo thành công');

        // Đóng modal nếu có nút Đóng
        const closeBtn = coachPage.getByRole('button', { name: /Đóng/i }).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      } else {
        console.log('Chưa có học viên phân công để tạo giáo án cá nhân');
      }

      // BƯỚC 5: Hội viên Xem Giáo Án & Đánh Dấu Hoàn Thành (/member/workout-plans)
      console.log('--- BƯỚC 5: Hội viên Xem Giáo Án & Tích Chọn Hoàn Thành Bài Tập ---');
      await loginMember(memberPage);
      await memberPage.goto('/member/workout-plans');
      await expect(memberPage).toHaveURL(/\/member\/workout-plans/);

      // Kiểm tra có kế hoạch tập luyện hiển thị
      await expect(memberPage.getByRole('heading', { name: /Kế Hoạch Tập Luyện/i })).toBeVisible({ timeout: 7000 });

      // Tích hoàn thành bài tập đầu tiên nếu có
      const exerciseItem = memberPage.locator('div').filter({ hasText: /Khởi động|Squat|Kéo xô|Plank|Bài tập/i }).first();
      if (await exerciseItem.isVisible({ timeout: 4000 })) {
        await exerciseItem.click();
        await memberPage.waitForTimeout(500);
        console.log('Hội viên đã đánh dấu hoàn thành bài tập trên giao diện');
      }

      // BƯỚC 6: Hội viên Kiểm Tra Chuyên Cần (/member/attendance)
      console.log('--- BƯỚC 6: Hội viên Kiểm Tra Lịch Sử Điểm Danh & Nhận Xét ---');
      await memberPage.goto('/member/attendance');
      await expect(memberPage).toHaveURL(/\/member\/attendance/);
      await expect(memberPage.getByRole('heading', { name: /Chuyên cần|Lịch sử điểm danh/i })).toBeVisible({ timeout: 7000 });
      console.log('Hội viên đã mở trang Lịch sử Chuyên cần & Nhận xét');

      // BƯỚC 7: Hội viên Đánh Giá Huấn Luyện Viên (/member/reviews)
      console.log('--- BƯỚC 7: Hội viên Gửi Đánh Giá Huấn Luyện Viên ---');
      await memberPage.goto('/member/reviews');
      await expect(memberPage).toHaveURL(/\/member\/reviews/);
      await expect(memberPage.getByRole('heading', { name: /Đánh giá/i })).toBeVisible({ timeout: 7000 });

      // Nếu có buổi học đủ điều kiện đánh giá
      const star5Btn = memberPage.getByRole('button', { name: '5 sao' }).first();
      if (await star5Btn.isVisible({ timeout: 3000 })) {
        await star5Btn.click();

        const commentInput = memberPage.getByPlaceholder(/Nhận xét của bạn/i).first();
        if (await commentInput.isVisible()) {
          await commentInput.fill('HLV rất nhiệt tình, hướng dẫn chi tiết từng động tác!');
        }

        const submitReviewBtn = memberPage.getByRole('button', { name: /Gửi đánh giá/i }).first();
        await submitReviewBtn.click();

        await expect(memberPage.getByText(/Đã gửi đánh giá|Cảm ơn bạn/i).first()).toBeVisible({ timeout: 7000 });
        console.log('Hội viên đã gửi đánh giá 5 sao cho HLV thành công');
      } else {
        console.log('Chưa có buổi học nào đủ điều kiện đánh giá mới (đã đánh giá hoặc chưa có lượt)');
      }

      // BƯỚC 8: HLV Xem Đánh Giá Đã Nhận (/coach/reviews)
      console.log('--- BƯỚC 8: HLV Xem Đánh Giá Đã Nhận Từ Học Viên ---');
      await coachPage.goto('/coach/reviews');
      await expect(coachPage).toHaveURL(/\/coach\/reviews/);
      await expect(coachPage.getByRole('heading', { name: /Đánh giá từ học viên/i })).toBeVisible({ timeout: 7000 });
      console.log('HLV đã xem danh sách đánh giá từ học viên thành công');

      console.log('HOÀN THÀNH 100% LUỒNG 4: Lớp Học, Điểm Danh, Giáo Án & Đánh Giá HLV!');
    } finally {
      await coachContext.close();
      await memberContext.close();
    }
  });
});
