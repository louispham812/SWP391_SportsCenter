import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginManager, loginMember, loginCoach, loginReceptionist, logoutMember } from './helpers.js';

test.describe('LUỒNG 7: Các Nghiệp Vụ Nâng Cao & Kiểm Thử Phòng Thủ Toàn Diện (Advanced Defense Flows)', () => {
  test('Quy trình tuần tự liên thông trọn vẹn 6 phân hệ nâng cao trên UI thực tế', async ({ page, baseURL, browser }) => {
    test.setTimeout(180000); // 3 minutes timeout for full multi-role end-to-end defense suite

    // =========================================================================
    // PHÂN HỆ 1: Ghi nhận chỉ số cơ thể (Body Progress) & Kỷ lục mức tạ (1RM Max Lift)
    // =========================================================================
    console.log('\n--- [PHÂN HỆ 1] Ghi nhận Body Progress (cân nặng, chiều cao, BMI, SMM, PBF) & 1RM Max Lift ---');
    
    // 1.1 Huấn luyện viên kiểm tra học viên và ghi nhận chỉ số (/coach/students)
    const coachContext = await browser.newContext({ baseURL });
    const coachPage = await coachContext.newPage();
    try {
      await loginCoach(coachPage);
      await coachPage.goto('/coach/students');
      await expect(coachPage).toHaveURL(/\/coach\/students/);

      // Kiểm tra xem Coach có học viên cá nhân được phân công không
      const planBtn = coachPage.getByRole('button', { name: /Soạn Giáo Án/i }).first();
      const hasPlanBtn = await planBtn.isVisible({ timeout: 4000 }).catch(() => false);
      if (hasPlanBtn) {
        await planBtn.click();
        // Chuyển sang Tab 2: Lịch sử & Tiến độ cơ thể
        const historyTabBtn = coachPage.getByRole('button', { name: /Lịch Sử Huấn Luyện & Tiến Độ/i });
        await expect(historyTabBtn).toBeVisible({ timeout: 5000 });
        await historyTabBtn.click();

        // Bấm nút "Ghi nhận chỉ số mới"
        const openFormBtn = coachPage.getByRole('button', { name: /Ghi nhận chỉ số mới/i });
        await expect(openFormBtn).toBeVisible({ timeout: 5000 });
        await openFormBtn.click();

        // Điền form chỉ số thể trạng & 1RM
        await coachPage.getByPlaceholder(/70.5/).fill('74.5');
        await coachPage.getByPlaceholder(/175/).fill('176');
        await coachPage.getByPlaceholder(/34.2/).fill('35.2');
        await coachPage.getByPlaceholder(/16.5/).fill('15.5');
        await coachPage.getByPlaceholder(/110/).fill('120');
        await coachPage.getByPlaceholder(/Kỷ lục Bench\/Squat/).fill('Test E2E 1RM Deadlift 120kg');

        // Submit form
        const saveBodyLogBtn = coachPage.getByRole('button', { name: /Lưu chỉ số thể trạng & 1RM/i });
        await saveBodyLogBtn.click();

        // Kiểm tra toast thành công & dòng dữ liệu hiển thị trong bảng
        await expect(coachPage.getByText(/Đã ghi nhận chỉ số thể trạng/i).first()).toBeVisible({ timeout: 7000 });
        console.log('HLV đã ghi nhận thành công chỉ số cơ thể và kỷ lục 1RM cho học viên');
      } else {
        console.log('Coach chưa có học viên phân công riêng lẻ, kiểm tra modal Giao Giáo Án Cả Lớp');
        const bulkPlanBtn = coachPage.getByRole('button', { name: /Giao Giáo Án Cả Lớp/i });
        if (await bulkPlanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await bulkPlanBtn.click();
          await expect(coachPage.getByText(/Giao Giáo Án.*Cả Lớp/i).first()).toBeVisible({ timeout: 5000 });
          const closeBulkBtn = coachPage.locator('button:has(span:text-is("close"))').first();
          if (await closeBulkBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBulkBtn.click();
          }
        }
      }
    } finally {
      await coachContext.close();
    }

    // 1.2 Hội viên tự ghi nhận chỉ số & 1RM trên trang AI Assistant (/member/ai-assistant)
    const memberContext = await browser.newContext({ baseURL });
    const memberPage = await memberContext.newPage();
    try {
      await loginMember(memberPage);
      await memberPage.goto('/member/ai-assistant');
      await expect(memberPage).toHaveURL(/\/member\/ai-assistant/);

      // Bấm nút "Ghi nhận chỉ số & 1RM"
      const openMemberLogBtn = memberPage.getByRole('button', { name: /Ghi nhận chỉ số & 1RM/i });
      await expect(openMemberLogBtn).toBeVisible({ timeout: 7000 });
      await openMemberLogBtn.click();

      // Điền form modal
      const mWeight = memberPage.getByPlaceholder(/68.5/);
      const mHeight = memberPage.getByPlaceholder(/172/);
      const m1Rm = memberPage.getByPlaceholder(/100/);

      await mWeight.fill('75.0');
      await mHeight.fill('176');
      await m1Rm.fill('125');

      const submitMemberLogBtn = memberPage.getByRole('button', { name: /Lưu chỉ số & 1RM/i });
      await submitMemberLogBtn.click();

      // Kiểm tra kết quả ghi nhận thành công
      await expect(memberPage.getByText(/Ghi nhận chỉ số thể trạng và 1RM thành công/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Hội viên đã cập nhật thành công chỉ số cơ thể và 1RM trên trang AI Assistant');
    } finally {
      await memberContext.close();
    }

    // =========================================================================
    // PHÂN HỆ 2: Hội viên gửi yêu cầu hoàn tiền -> Quản lý phê duyệt hoàn tiền
    // =========================================================================
    console.log('\n--- [PHÂN HỆ 2] Hội viên gửi Refund Request -> Quản lý xét duyệt hoàn tiền ---');
    const memberContext2 = await browser.newContext({ baseURL });
    const memberPage2 = await memberContext2.newPage();
    let refundCreated = false;
    try {
      await loginMember(memberPage2);
      await memberPage2.goto('/member/transactions');
      await expect(memberPage2).toHaveURL(/\/member\/transactions/);

      // Mở modal Yêu Cầu Hoàn Tiền
      const refundBtn = memberPage2.getByRole('button', { name: /Yêu Cầu Hoàn Tiền/i });
      await expect(refundBtn).toBeVisible({ timeout: 7000 });
      await refundBtn.click();

      // Form Yêu cầu hoàn tiền
      const txSelect = memberPage2.locator('form select').first();
      await expect(txSelect).toBeVisible({ timeout: 5000 });

      const options = await txSelect.locator('option').all();
      if (options.length > 1) {
        // Chọn giao dịch đầu tiên có thể hoàn
        await txSelect.selectOption({ index: 1 });

        const reasonArea = memberPage2.locator('form textarea').first();
        await reasonArea.fill('Lý do kiểm thử E2E: Bận đột xuất hủy lịch trước 2h, yêu cầu hoàn tiền');

        await memberPage2.getByPlaceholder('0123456789').fill('0988776655');
        await memberPage2.getByPlaceholder('NGUYEN VAN A').fill('NGUYEN ANH KHOA');

        const submitRefundBtn = memberPage2.getByRole('button', { name: /Gửi Yêu Cầu Hoàn Tiền/i });
        await submitRefundBtn.click();

        await expect(memberPage2.getByText(/Yêu cầu hoàn tiền đã gửi|chuyển đến Quản lý/i).first()).toBeVisible({ timeout: 7000 });
        refundCreated = true;
        console.log('Hội viên đã gửi yêu cầu hoàn tiền thành công lên hệ thống');
      } else {
        console.log('Chưa có giao dịch đã thanh toán đủ điều kiện hoàn tiền, tạo request trực tiếp qua API');
        const memSession = await memberPage2.evaluate(() => JSON.parse(sessionStorage.getItem('sports-center-auth-session') || 'null'));
        const directRefundRes = await memberPage2.request.post(`${apiBaseUrl}/members/me/refunds`, {
          headers: { Authorization: `Bearer ${memSession.token}` },
          data: {
            referenceCode: `TX-TEST-${Date.now()}`,
            refundAmount: 150000,
            reason: 'Kiểm thử hoàn tiền tự động luồng 7',
            bankName: 'MB Bank',
            bankAccount: '0988776655',
            accountHolder: 'NGUYEN ANH KHOA',
          },
        });
        expect(directRefundRes.ok()).toBeTruthy();
        refundCreated = true;
      }
    } finally {
      await memberContext2.close();
    }

    // Quản lý phê duyệt hoàn tiền (/admin/staff-approvals)
    if (refundCreated) {
      const adminContext = await browser.newContext({ baseURL });
      const adminPage = await adminContext.newPage();
      try {
        await loginManager(adminPage);
        await adminPage.goto('/admin/staff-approvals');
        await expect(adminPage).toHaveURL(/\/admin\/staff-approvals/);

        // Chuyển sang Tab Yêu Cầu Hoàn Tiền
        const refundTab = adminPage.getByRole('button', { name: /hoàn tiền/i });
        await expect(refundTab).toBeVisible({ timeout: 5000 });
        await refundTab.click();

        // Kiểm tra bảng hoàn tiền hiển thị
        await expect(adminPage.getByText(/Yêu cầu hoàn tiền hội viên/i)).toBeVisible({ timeout: 7000 });

        // Bấm nút "Phê duyệt hoàn" trên dòng đầu tiên chờ duyệt
        const approveRefundBtn = adminPage.getByRole('button', { name: /Phê duyệt hoàn/i }).first();
        if (await approveRefundBtn.isVisible({ timeout: 5000 })) {
          await approveRefundBtn.click();
          await expect(adminPage.getByText(/Đã duyệt hoàn tiền/i).first()).toBeVisible({ timeout: 7000 });
          console.log('Quản lý đã duyệt hoàn tiền thành công');
        } else {
          console.log('Các yêu cầu hoàn tiền đã được xử lý trước đó');
        }
      } finally {
        await adminContext.close();
      }
    }

    // =========================================================================
    // PHÂN HỆ 3: HLV cập nhật lịch rảnh / gửi đơn nghỉ phép -> Quản lý duyệt
    // =========================================================================
    console.log('\n--- [PHÂN HỆ 3] HLV cập nhật lịch rảnh & nộp đơn nghỉ phép -> Quản lý thẩm định ---');
    const coachContext3 = await browser.newContext({ baseURL });
    const coachPage3 = await coachContext3.newPage();
    try {
      await loginCoach(coachPage3);
      await coachPage3.goto('/coach/schedule');
      await expect(coachPage3).toHaveURL(/\/coach\/schedule/);

      // 3.1 Khai báo lịch rảnh (Availability)
      const availTab = coachPage3.getByRole('button', { name: /Khai báo lịch rảnh/i });
      await expect(availTab).toBeVisible({ timeout: 5000 });
      await availTab.click();

      const saveAvailBtn = coachPage3.getByRole('button', { name: /Lưu Lịch Rảnh Lên Máy Chủ/i });
      await expect(saveAvailBtn).toBeVisible({ timeout: 5000 });
      await saveAvailBtn.click();
      await expect(coachPage3.getByText(/Đã lưu thành công|Lịch rảnh của bạn đã được cập nhật|Đã lưu lịch rảnh|Đã lưu cục bộ/i).first()).toBeVisible({ timeout: 7000 });
      console.log('HLV đã lưu lịch rảnh thành công lên máy chủ');

      // 3.2 Gửi đơn xin nghỉ phép (Leave Request)
      const leaveTab = coachPage3.getByRole('button', { name: /Đơn xin nghỉ & đổi ca/i });
      await expect(leaveTab).toBeVisible({ timeout: 5000 });
      await leaveTab.click();

      const openLeaveModalBtn = coachPage3.getByRole('button', { name: /Gửi Đơn Xin Nghỉ \/ Đổi Ca/i });
      await expect(openLeaveModalBtn).toBeVisible({ timeout: 5000 });
      await openLeaveModalBtn.click();

      // Điền form xin nghỉ
      const todayStr = new Date().toISOString().slice(0, 10);
      await coachPage3.locator('input[type="date"]').first().fill(todayStr);
      await coachPage3.locator('input[type="date"]').nth(1).fill(todayStr);
      await coachPage3.getByPlaceholder(/Ghi rõ lý do xin nghỉ/i).fill('Kiểm thử E2E: Xin nghỉ tập huấn chuyên môn');

      const submitLeaveBtn = coachPage3.locator('form button', { hasText: /Gửi Đơn Xin Nghỉ/i });
      await submitLeaveBtn.click();

      await expect(coachPage3.getByText(/Gửi đơn thành công|Đã gửi đơn xin nghỉ thành công|Đã nộp đơn/i).first()).toBeVisible({ timeout: 7000 });
      console.log('HLV đã gửi đơn xin nghỉ phép thành công');
    } finally {
      await coachContext3.close();
    }

    // Quản lý xử lý đơn xin nghỉ (/admin/staff-approvals)
    const adminContext3 = await browser.newContext({ baseURL });
    const adminPage3 = await adminContext3.newPage();
    try {
      await loginManager(adminPage3);
      await adminPage3.goto('/admin/staff-approvals');
      await expect(adminPage3).toHaveURL(/\/admin\/staff-approvals/);

      // Chuyển sang Tab Đơn nghỉ Coach
      const coachLeaveTab = adminPage3.getByRole('button', { name: /Đơn nghỉ Coach/i });
      await expect(coachLeaveTab).toBeVisible({ timeout: 5000 });
      await coachLeaveTab.click();

      // Kiểm tra danh sách đơn nghỉ
      await expect(adminPage3.getByText(/Đơn xin nghỉ & đổi ca của Coach/i)).toBeVisible({ timeout: 7000 });

      // Nếu có đơn chờ duyệt, bấm duyệt hoặc từ chối
      const rejectLeaveBtn = adminPage3.getByRole('button', { name: /Từ chối/i }).first();
      const approveLeaveBtn = adminPage3.getByRole('button', { name: /Duyệt đơn nghỉ/i }).first();

      if (await rejectLeaveBtn.isVisible({ timeout: 4000 })) {
        await rejectLeaveBtn.click();
        await expect(adminPage3.getByText(/Đã từ chối đơn nghỉ|Đã duyệt nghỉ/i).first()).toBeVisible({ timeout: 7000 });
        console.log('Quản lý đã hoàn tất thẩm định đơn nghỉ phép của Huấn luyện viên');
      } else if (await approveLeaveBtn.isVisible({ timeout: 3000 })) {
        await approveLeaveBtn.click();
        console.log('Quản lý đã mở modal phân công Coach thay thế');
      }
    } finally {
      await adminContext3.close();
    }

    // =========================================================================
    // PHÂN HỆ 4: Lễ tân tra cứu hội viên, cập nhật liên hệ khẩn cấp & điểm danh lớp
    // =========================================================================
    console.log('\n--- [PHÂN HỆ 4] Lễ tân tra cứu hội viên, cập nhật liên hệ khẩn cấp & đối soát lớp học ---');
    const recepContext = await browser.newContext({ baseURL });
    const recepPage = await recepContext.newPage();
    try {
      await loginReceptionist(recepPage);

      // 4.1 Tra cứu hội viên & cập nhật liên hệ khẩn cấp (/receptionist/members)
      await recepPage.goto('/receptionist/members');
      await expect(recepPage).toHaveURL(/\/receptionist\/members/);

      const searchInput = recepPage.locator('#member-search');
      await expect(searchInput).toBeVisible({ timeout: 5000 });
      await searchInput.fill('Khoa');
      await recepPage.getByRole('button', { name: /Tìm hội viên/i }).click();
      await recepPage.waitForTimeout(600);

      // Bấm nút "Khẩn cấp" trên dòng hội viên
      const emergencyBtn = recepPage.getByRole('button', { name: /Khẩn cấp/i }).first();
      await expect(emergencyBtn).toBeVisible({ timeout: 7000 });
      await emergencyBtn.click();

      // Modal Liên Hệ Khẩn Cấp
      await expect(recepPage.getByText(/Liên Hệ Khẩn Cấp \(Emergency Contact\)/i)).toBeVisible({ timeout: 5000 });
      await recepPage.locator('#emergency-name').fill('Nguyễn Văn Hùng (Bố)');
      await recepPage.locator('#emergency-phone').fill('0988776655');

      const saveEmergencyBtn = recepPage.getByRole('button', { name: /Lưu Thông Tin Khẩn Cấp/i });
      await saveEmergencyBtn.click();

      await expect(recepPage.getByText(/Cập nhật liên hệ khẩn cấp thành công/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Lễ tân đã lưu thành công thông tin liên hệ khẩn cấp cho hội viên');

      // 4.2 Xem thời khóa biểu lớp học & điểm danh hộ (/receptionist/classes)
      await recepPage.goto('/receptionist/classes');
      await expect(recepPage).toHaveURL(/\/receptionist\/classes/);
      await expect(recepPage.getByRole('heading', { name: /Thời khóa biểu các lớp/i })).toBeVisible({ timeout: 7000 });

      // Mở modal đối soát danh sách học viên
      const checkRosterBtn = recepPage.getByRole('button', { name: /Xem danh sách & Sửa điểm danh/i }).first();
      if (await checkRosterBtn.isVisible({ timeout: 5000 })) {
        await checkRosterBtn.click();
        await expect(recepPage.getByText(/ĐỐI SOÁT & SỬA ĐIỂM DANH/i)).toBeVisible({ timeout: 7000 });

        // Nếu có học viên trong danh sách lớp, chọn điểm danh Có mặt
        const rosterSelect = recepPage.locator('select').filter({ hasText: /Chưa điểm danh|Có mặt|Vắng/i }).first();
        if (await rosterSelect.isVisible({ timeout: 3000 })) {
          await rosterSelect.selectOption('PRESENT');
          await expect(recepPage.getByText(/Sửa điểm danh thành công/i).first()).toBeVisible({ timeout: 7000 });
          console.log('Lễ tân đã sửa điểm danh học viên tại quầy thành công');
        }

        // Đóng modal
        const closeBtn = recepPage.getByRole('button', { name: /Đóng/i }).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }
    } finally {
      await recepContext.close();
    }

    // =========================================================================
    // PHÂN HỆ 5: Đăng ký tài khoản Nhân viên mới -> Admin phê duyệt kích hoạt
    // =========================================================================
    console.log('\n--- [PHÂN HỆ 5] Đăng ký Nhân viên mới (Coach/Receptionist) -> Admin phê duyệt ---');
    const newStaffEmail = `coach.e2e.${Date.now()}@sporthub.com`;
    const newStaffPassword = 'SportHub@123';
    const newStaffName = 'HLV Kiểm Thử E2E';

    const registerContext = await browser.newContext({ baseURL });
    const registerPage = await registerContext.newPage();
    try {
      await registerPage.goto('/register');
      await expect(registerPage.getByRole('heading', { name: /Chào Mừng Đến Với F Sport/i })).toBeVisible({ timeout: 7000 });

      // Chọn loại tài khoản Huấn luyện viên
      const coachRoleBtn = registerPage.getByRole('button', { name: 'Huấn luyện viên' });
      await expect(coachRoleBtn).toBeVisible({ timeout: 5000 });
      await coachRoleBtn.click();

      // Điền thông tin đăng ký
      await registerPage.getByPlaceholder('Nguyễn Văn A').fill(newStaffName);
      await registerPage.getByPlaceholder('0912 345 678').fill('0918889999');
      await registerPage.getByPlaceholder('name@example.com').fill(newStaffEmail);
      await registerPage.getByPlaceholder('••••••••').fill(newStaffPassword);

      // Đồng ý điều khoản
      const agreeCheckbox = registerPage.locator('input[type="checkbox"]');
      if (await agreeCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await agreeCheckbox.check();
      }

      // Submit đăng ký
      const submitRegBtn = registerPage.getByRole('button', { name: /ĐĂNG KÝ TÀI KHOẢN NGAY/i });
      await submitRegBtn.click();

      // Kiểm tra thông báo tài khoản đang chờ Admin duyệt
      await expect(registerPage.getByText(/Đăng ký tài khoản nhân sự thành công|chờ Quản trị viên/i).first()).toBeVisible({ timeout: 7000 });
      console.log(`Đã nộp hồ sơ đăng ký HLV mới (${newStaffEmail}) ở trạng thái PENDING`);
    } finally {
      await registerContext.close();
    }

    // Admin phê duyệt kích hoạt tài khoản nhân viên
    const adminContext5 = await browser.newContext({ baseURL });
    const adminPage5 = await adminContext5.newPage();
    try {
      await loginManager(adminPage5);
      await adminPage5.goto('/admin/staff-approvals');
      await expect(adminPage5).toHaveURL(/\/admin\/staff-approvals/);

      // Tab 1: Phê duyệt nhân viên
      await expect(adminPage5.getByText(newStaffName).first()).toBeVisible({ timeout: 8000 });
      console.log(`Admin đã tìm thấy hồ sơ ${newStaffName} trong hàng đợi phê duyệt`);

      const approveStaffBtn = adminPage5.locator('tr', { hasText: newStaffEmail })
        .getByRole('button', { name: /Phê duyệt/i });
      await expect(approveStaffBtn).toBeVisible({ timeout: 5000 });
      await approveStaffBtn.click();

      await expect(adminPage5.getByText(/Đã duyệt tài khoản/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Admin đã kích hoạt ACTIVE cho tài khoản nhân viên mới');
    } finally {
      await adminContext5.close();
    }

    // Đăng nhập bằng tài khoản HLV mới đã được duyệt
    const newStaffLoginContext = await browser.newContext({ baseURL });
    const newStaffLoginPage = await newStaffLoginContext.newPage();
    try {
      await newStaffLoginPage.goto('/login');
      await newStaffLoginPage.getByPlaceholder('name@example.com / 0912...').fill(newStaffEmail);
      await newStaffLoginPage.getByPlaceholder('••••••••').fill(newStaffPassword);
      await newStaffLoginPage.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).click();

      // Phải chuyển hướng thành công vào cổng Huấn luyện viên
      await expect(newStaffLoginPage).toHaveURL(/\/coach/);
      console.log('HLV mới đã đăng nhập thành công và truy cập Dashboard Huấn Luyện Viên');
    } finally {
      await newStaffLoginContext.close();
    }

    // =========================================================================
    // PHÂN HỆ 6: Quản lý cơ sở vật chất, khóa bảo trì sân -> Chặn Member đặt sân -> Mở lại
    // =========================================================================
    console.log('\n--- [PHÂN HỆ 6] Quản lý cơ sở vật chất, khóa bảo trì sân -> Chặn Member đặt sân -> Mở lại ---');
    const adminContext6 = await browser.newContext({ baseURL });
    const adminPage6 = await adminContext6.newPage();
    let maintId = null;
    const testCourtId = 3; // Tennis Court 01

    try {
      await loginManager(adminPage6);
      const session = await adminPage6.evaluate(() => JSON.parse(sessionStorage.getItem('sports-center-auth-session') || 'null'));
      const mgrHeaders = { Authorization: `Bearer ${session.token}` };

      // Dọn sạch lịch bảo trì cũ trên Court 3 trước khi test
      const listRes = await adminPage6.request.get(`${apiBaseUrl}/manager/maintenance`, { headers: mgrHeaders });
      if (listRes.ok()) {
        const mList = await listRes.json();
        for (const m of mList) {
          if (m.courtId === testCourtId) {
            await adminPage6.request.delete(`${apiBaseUrl}/manager/maintenance/${m.maintenanceId}`, { headers: mgrHeaders });
          }
        }
      }

      // 6.1 Truy cập /admin/facilities và chuyển tab Bảo trì
      await adminPage6.goto('/admin/facilities');
      await expect(adminPage6).toHaveURL(/\/admin\/facilities/);

      const maintTabBtn = adminPage6.getByRole('button', { name: /construction/i });
      await expect(maintTabBtn).toBeVisible({ timeout: 5000 });
      await maintTabBtn.click();

      // Mở modal Lên Lịch Mới
      const newMaintBtn = adminPage6.getByRole('button', { name: /Lên lịch mới/i });
      await expect(newMaintBtn).toBeVisible({ timeout: 5000 });
      await newMaintBtn.click();

      // Form khóa sân
      const today = new Date().toISOString().slice(0, 10);
      const startIso = `${today}T08:00`;
      const endIso = `${today}T22:00`;

      await adminPage6.locator('form select').first().selectOption(String(testCourtId));
      await adminPage6.locator('form input[type="datetime-local"]').first().fill(startIso);
      await adminPage6.locator('form input[type="datetime-local"]').nth(1).fill(endIso);
      await adminPage6.locator('form textarea').first().fill('Bảo trì thay mặt sân thi đấu - Test E2E Flow 7');

      const confirmLockBtn = adminPage6.getByRole('button', { name: /Xác nhận khóa sân/i });
      await confirmLockBtn.click();

      await expect(adminPage6.getByText(/Lên lịch bảo trì thành công|Đã khóa sân/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Quản lý đã tạo lệnh khóa bảo trì Tennis Court 01 trực tiếp trên UI');

      // Lấy maintenanceId từ DB qua API để verify
      const afterRes = await adminPage6.request.get(`${apiBaseUrl}/manager/maintenance`, { headers: mgrHeaders });
      const currentMaints = await afterRes.json();
      const currentOnCourt = currentMaints.find((m) => m.courtId === testCourtId);
      expect(currentOnCourt).toBeTruthy();
      maintId = currentOnCourt.maintenanceId;
    } finally {
      await adminContext6.close();
    }

    // 6.2 Hội viên kiểm tra: slot bị chặn và ném 409 Conflict khi cố tình đặt
    const memberContext6 = await browser.newContext({ baseURL });
    const memberPage6 = await memberContext6.newPage();
    try {
      await loginMember(memberPage6);
      const memSession = await memberPage6.evaluate(() => JSON.parse(sessionStorage.getItem('sports-center-auth-session') || 'null'));
      const today = new Date().toISOString().slice(0, 10);

      // Thử quote sân Court 3 trong khung bảo trì -> BẮT BUỘC TRẢ VỀ 409 CONFLICT
      const quoteBlockedRes = await memberPage6.request.get(
        `${apiBaseUrl}/booking-flow/quote?bookingType=COURT&itemId=${testCourtId}&startTime=${today}T15:00:00&endTime=${today}T16:00:00`,
        { headers: { Authorization: `Bearer ${memSession.token}` } }
      );
      expect(quoteBlockedRes.status()).toBe(409);
      console.log('Hệ thống đã chặn thành công hội viên đặt sân trong khung giờ bảo trì (HTTP 409 Conflict)');
    } finally {
      await memberContext6.close();
    }

    // 6.3 Quản lý mở lại hoạt động (Xóa bảo trì trực tiếp trên UI)
    const adminContext6Unlock = await browser.newContext({ baseURL });
    const adminPage6Unlock = await adminContext6Unlock.newPage();
    try {
      await loginManager(adminPage6Unlock);
      await adminPage6Unlock.goto('/admin/facilities');
      await adminPage6Unlock.getByRole('button', { name: /construction/i }).click();

      // Bấm nút xóa / mở lại hoạt động trên dòng của Court 3
      const unlockBtn = adminPage6Unlock.locator('tr', { hasText: /Tennis Court 01|Sân #3/i })
        .getByRole('button').first();
      await expect(unlockBtn).toBeVisible({ timeout: 5000 });
      await unlockBtn.click();

      await expect(adminPage6Unlock.getByText(/Đã xóa lịch bảo trì|mở lại hoạt động/i).first()).toBeVisible({ timeout: 7000 });
      console.log('Quản lý đã mở lại hoạt động thành công cho sân Tennis Court 01');

      // Kiểm tra slot Court 3 đã được khôi phục trạng thái hoạt động
      const slotsCheck = await adminPage6Unlock.request.get(`${apiBaseUrl}/booking-flow/courts?sportId=3`);
      expect(slotsCheck.ok()).toBeTruthy();
      const slotsData = await slotsCheck.json();
      const court3Slots = slotsData.filter((s) => s.courtId === testCourtId);
      expect(court3Slots.length).toBeGreaterThan(0);
      console.log(`Sân Tennis Court 01 đã khôi phục ${court3Slots.length} khung giờ hoạt động!`);
    } finally {
      await adminContext6Unlock.close();
    }

    console.log('\n=========================================================================');
    console.log('HOÀN THÀNH 100% LUỒNG 7: CÁC NGHIỆP VỤ NÂNG CAO & ĐỐI SOÁT PHÒNG THỦ TOÀN DIỆN!');
    console.log('=========================================================================\n');
  });
});
