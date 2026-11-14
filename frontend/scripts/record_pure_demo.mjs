import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const BASE_URL = 'http://127.0.0.1:5173';
const RECORDINGS_DIR = path.resolve(ROOT_DIR, 'recordings_pure');
const FINAL_MP4_PATH = path.resolve(ROOT_DIR, 'SPORTHUB_DEMO_PURE_1080P.mp4');
const ROOT_DEMO_MP4 = path.resolve(ROOT_DIR, 'demo_video.mp4');

if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// Clean old recordings
const existingWebm = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith('.webm'));
for (const f of existingWebm) {
  try {
    fs.unlinkSync(path.join(RECORDINGS_DIR, f));
  } catch {}
}

// Natural human interaction helpers
async function naturalMove(page, targetX, targetY, steps = 14) {
  await page.mouse.move(targetX, targetY, { steps });
}

async function naturalClick(page, locator, { dwellBefore = 250, dwellAfter = 1100 } = {}) {
  try {
    const loc = locator.first();
    await loc.scrollIntoViewIfNeeded({ timeout: 3500 }).catch(() => {});
    const box = await loc.boundingBox({ timeout: 3500 }).catch(() => null);
    if (box) {
      const targetX = Math.round(box.x + Math.min(box.width / 2, 70));
      const targetY = Math.round(box.y + Math.min(box.height / 2, 22));
      await naturalMove(page, targetX, targetY, 12);
      await page.waitForTimeout(dwellBefore);
      await page.mouse.click(targetX, targetY);
    } else {
      await loc.click({ force: true, timeout: 3000 });
    }
  } catch (err) {
    console.warn(`[Safe Click Fallback]: ${err.message}`);
  }
  await page.waitForTimeout(dwellAfter);
}

async function naturalType(page, locator, text, { delay = 25, dwellAfter = 600 } = {}) {
  try {
    const loc = locator.first();
    await loc.scrollIntoViewIfNeeded({ timeout: 3500 }).catch(() => {});
    const box = await loc.boundingBox({ timeout: 3500 }).catch(() => null);
    if (box) {
      const targetX = Math.round(box.x + Math.min(box.width / 2, 60));
      const targetY = Math.round(box.y + Math.min(box.height / 2, 20));
      await naturalMove(page, targetX, targetY, 10);
      await page.mouse.click(targetX, targetY);
    } else {
      await loc.click({ force: true, timeout: 3000 });
    }
    await loc.fill('');
    await loc.pressSequentially(text, { delay });
  } catch (err) {
    console.warn(`[Safe Type Fallback]: ${err.message}`);
  }
  await page.waitForTimeout(dwellAfter);
}

async function smoothScroll(page, deltaY, steps = 8, stepDelay = 55) {
  const stepY = deltaY / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, stepY);
    await page.waitForTimeout(stepDelay);
  }
  await page.waitForTimeout(600);
}

async function closeModalIfAny(page) {
  const backdrop = page.locator('.fixed.inset-0.z-50, .fixed.inset-0[class*="z-"], [role="dialog"]').first();
  if (await backdrop.isVisible({ timeout: 500 }).catch(() => false)) {
    const closeBtn = page.locator('button:has-text("Đóng"), button:has-text("Hủy bỏ"), button:has-text("Hủy"), button:has(span:has-text("close"))').first();
    if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeBtn.click().catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(500);
  }
}

async function naturalLogin(page, email, password, roleName) {
  console.log(`-> [Đăng nhập ${roleName}]: ${email}`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const emailInput = page.locator('input[placeholder*="name@example.com"], input[type="text"]').first();
  const passInput = page.locator('input[type="password"]').first();
  const submitBtn = page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).first();

  await naturalType(page, emailInput, email, { delay: 25, dwellAfter: 400 });
  await naturalType(page, passInput, password, { delay: 25, dwellAfter: 400 });
  await naturalClick(page, submitBtn, { dwellBefore: 250, dwellAfter: 2000 });
}

async function naturalLogout(page) {
  console.log('-> [Đăng xuất] Kết thúc phiên làm việc...');
  await closeModalIfAny(page);
  try {
    const logoutBtn = page.locator('button:has(span:has-text("logout"))').first();
    if (await logoutBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
      await naturalClick(page, logoutBtn, { dwellBefore: 250, dwellAfter: 1000 });
    }
  } catch (err) {
    console.warn('Logout click fallback:', err);
  }

  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
}

async function navigateMenu(page, selector, targetUrl, dwell = 1600) {
  try {
    await closeModalIfAny(page);
    const link = page.locator(selector).first();
    if (await link.isVisible({ timeout: 2500 }).catch(() => false)) {
      await naturalClick(page, link, { dwellBefore: 250, dwellAfter: 900 });
    }
    if (!page.url().includes(targetUrl)) {
      await page.goto(`${BASE_URL}${targetUrl}`, { waitUntil: 'networkidle' }).catch(() => {});
    }
  } catch {
    await page.goto(`${BASE_URL}${targetUrl}`, { waitUntil: 'networkidle' }).catch(() => {});
  }
  await page.waitForTimeout(dwell);
}

async function runPureDemo() {
  console.log('=== KHỞI ĐỘNG QUAY VIDEO DEMO FULLHD 1080P (4 ACTOR LIỀN MẠCH) ===');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--window-size=1920,1080',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  const apiErrors = [];
  page.on('response', (res) => {
    if (res.status() >= 400 && res.url().includes('/api/')) {
      const msg = `[API ${res.status()}] ${res.url()}`;
      apiErrors.push(msg);
      console.warn(msg);
    }
  });

  // =========================================================================
  // MỞ ĐẦU: TRANG CHỦ & BẢNG GIÁ CÔNG KHAI
  // =========================================================================
  console.log('[MỞ ĐẦU] Trang chủ & Bảng giá công khai');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await smoothScroll(page, 450, 8, 55);
  await page.waitForTimeout(900);

  const pricingLink = page.getByRole('link', { name: /Bảng giá/i }).first();
  if (await pricingLink.isVisible().catch(() => false)) {
    await naturalClick(page, pricingLink, { dwellBefore: 250, dwellAfter: 1500 });
    await smoothScroll(page, 350, 6, 55);
    await page.waitForTimeout(1000);
  }

  // =========================================================================
  // PHẦN 1: ACTOR 1 - MANAGER / ADMIN (1 MẠCH DUY NHẤT)
  // =========================================================================
  console.log('[PHẦN 1] Actor 1: QUẢN TRỊ VIÊN (Manager - Nguyễn Văn Quản Lý)');
  await naturalLogin(page, 'manager@sporthub.com', 'SportHub@123', 'Quản Trị Viên');

  // 1.1 Dashboard báo cáo doanh thu, thành viên & lớp học
  await smoothScroll(page, 400, 8, 55);
  await page.waitForTimeout(1400);
  await smoothScroll(page, -400, 8, 55);

  // 1.2 Quản lý nhân sự & HLV
  await navigateMenu(page, 'aside a[href*="/admin/staff"]', '/admin/staff', 1500);
  await smoothScroll(page, 250, 6, 50);

  // 1.3 Quản lý thành viên
  await navigateMenu(page, 'aside a[href*="/admin/members"]', '/admin/members', 1500);
  await smoothScroll(page, 250, 6, 50);

  // 1.4 Quản lý sân bãi, bảo trì & phân công HLV lớp học
  await navigateMenu(page, 'aside a[href*="/admin/facilities"]', '/admin/facilities', 1600);
  const courtArticle = page.locator('article, tr').filter({ hasText: /Sân Cầu Lông|Sân Tennis|Hồ Bơi|Pickleball/i }).first();
  const lockMaintenanceBtn = courtArticle.getByRole('button', { name: /Tạm khóa bảo trì/i });
  if (await lockMaintenanceBtn.isVisible().catch(() => false)) {
    await naturalClick(page, lockMaintenanceBtn, { dwellBefore: 300, dwellAfter: 1400 });
    const unlockMaintenanceBtn = courtArticle.getByRole('button', { name: /Mở lại hoạt động/i });
    if (await unlockMaintenanceBtn.isVisible().catch(() => false)) {
      await naturalClick(page, unlockMaintenanceBtn, { dwellBefore: 300, dwellAfter: 1400 });
    }
  }
  await smoothScroll(page, 450, 8, 55);
  const editClassBtn = page.locator('button[title*="Dời giờ"]').first();
  if (await editClassBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalClick(page, editClassBtn, { dwellBefore: 300, dwellAfter: 1400 });
    await closeModalIfAny(page);
  }

  // 1.5 Tạo gói tập & Voucher
  await navigateMenu(page, 'aside a[href*="/admin/packages"]', '/admin/packages', 1600);
  const addPkgBtn = page.getByRole('button', { name: /Thêm gói tập mới/i });
  if (await addPkgBtn.isVisible().catch(() => false)) {
    await naturalClick(page, addPkgBtn, { dwellBefore: 300, dwellAfter: 1200 });
    const nameInput = page.locator('#packageName, input[name="name"]').first();
    const priceInput = page.locator('#packagePrice, input[name="price"]').first();
    const durationInput = page.locator('#packageDuration, input[name="durationDays"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await naturalType(page, nameInput, 'Gói VIP Diamond 2026', { delay: 20 });
    }
    if (await priceInput.isVisible().catch(() => false)) {
      await naturalType(page, priceInput, '4500000', { delay: 20 });
    }
    if (await durationInput.isVisible().catch(() => false)) {
      await naturalType(page, durationInput, '60', { delay: 20 });
    }
    const savePkgBtn = page.getByRole('button', { name: /Lưu gói tập/i });
    if (await savePkgBtn.isVisible().catch(() => false)) {
      await naturalClick(page, savePkgBtn, { dwellBefore: 300, dwellAfter: 1600 });
    }
    await closeModalIfAny(page);
  }
  const voucherTabBtn = page.getByRole('button', { name: /Mã giảm giá & Voucher/i });
  if (await voucherTabBtn.isVisible().catch(() => false)) {
    await naturalClick(page, voucherTabBtn, { dwellBefore: 300, dwellAfter: 1500 });
  }

  // 1.6 Duyệt yêu cầu & Đối soát thanh toán
  await navigateMenu(page, 'aside a[href*="/admin/staff-approvals"]', '/admin/staff-approvals', 1600);
  const membershipTab = page.getByRole('button', { name: /Duyệt gói hội viên/i });
  if (await membershipTab.isVisible().catch(() => false)) {
    await naturalClick(page, membershipTab, { dwellBefore: 250, dwellAfter: 1400 });
  }
  const refundTab = page.getByRole('button', { name: /Yêu cầu hoàn tiền/i });
  if (await refundTab.isVisible().catch(() => false)) {
    await naturalClick(page, refundTab, { dwellBefore: 250, dwellAfter: 1400 });
  }

  await navigateMenu(page, 'aside a[href*="/admin/payment-reconciliation"]', '/admin/payment-reconciliation', 1500);

  // 1.7 Phân quyền & Cấu hình AI
  await navigateMenu(page, 'aside a[href*="/admin/settings"]', '/admin/settings', 1500);
  await smoothScroll(page, 480, 8, 55);
  await page.waitForTimeout(1000);

  // 1.8 Thông báo hàng loạt & Audit Logs
  await navigateMenu(page, 'aside a[href*="/admin/broadcast"]', '/admin/broadcast', 1500);
  const titleInput = page.getByPlaceholder('Tiêu đề');
  const contentInput = page.getByPlaceholder('Nội dung thông báo');
  if (await titleInput.isVisible().catch(() => false)) {
    await naturalType(page, titleInput, '[THÔNG BÁO] Nâng cấp mặt sân thi đấu Quốc tế', { delay: 20 });
  }
  if (await contentInput.isVisible().catch(() => false)) {
    await naturalType(page, contentInput, 'SportHub đã hoàn tất kiểm định và nâng cấp bảo dưỡng toàn bộ hệ thống sân thể thao.', { delay: 20 });
  }
  const sendBroadcastBtn = page.getByRole('button', { name: /Gửi thông báo/i });
  if (await sendBroadcastBtn.isVisible().catch(() => false)) {
    await naturalClick(page, sendBroadcastBtn, { dwellBefore: 300, dwellAfter: 1600 });
  }

  await navigateMenu(page, 'aside a[href*="/admin/audit-logs"]', '/admin/audit-logs', 1600);
  await smoothScroll(page, 250, 6, 55);

  await naturalLogout(page);

  // =========================================================================
  // PHẦN 2: ACTOR 2 - RECEPTIONIST / LỄ TÂN (1 MẠCH DUY NHẤT)
  // =========================================================================
  console.log('[PHẦN 2] Actor 2: LỄ TÂN (Receptionist - Lê Thị Lễ Tân)');
  await naturalLogin(page, 'reception.le@sporthub.com', 'SportHub@123', 'Lễ Tân');

  // 2.1 Check-in QR/RFID
  await navigateMenu(page, 'aside a[href*="/receptionist/checkin"]', '/receptionist/checkin', 1600);
  const scanInput = page.getByPlaceholder(/Quét mã QR thẻ hội viên hoặc quẹt thẻ từ RFID/i);
  if (await scanInput.isVisible().catch(() => false)) {
    await naturalType(page, scanInput, 'SPORTHUB-MEMBER-9', { delay: 25 });
    const lookupBtn = page.getByRole('button', { name: /Tra Cứu Thẻ/i });
    if (await lookupBtn.isVisible().catch(() => false)) {
      await naturalClick(page, lookupBtn, { dwellBefore: 300, dwellAfter: 1500 });
    }
  }
  const confirmCheckInBtn = page.getByRole('button', { name: /XÁC NHẬN CHO VÀO TẬP/i });
  if (await confirmCheckInBtn.isVisible().catch(() => false)) {
    await naturalClick(page, confirmCheckInBtn, { dwellBefore: 300, dwellAfter: 1600 });
  }

  // 2.2 Tìm kiếm/đăng ký thành viên & kiểm tra gói
  await navigateMenu(page, 'aside a[href*="/receptionist/members"]', '/receptionist/members', 1600);
  const recMemberSearch = page.locator('#member-search').first();
  if (await recMemberSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalType(page, recMemberSearch, '0934567890', { delay: 25 });
    const searchMemberBtn = page.getByRole('button', { name: /Tìm hội viên/i }).first();
    if (await searchMemberBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await naturalClick(page, searchMemberBtn, { dwellBefore: 250, dwellAfter: 1400 });
    }
  }

  // 2.3 Thời khóa biểu lớp học & đối soát điểm danh
  await navigateMenu(page, 'aside a[href*="/receptionist/classes"]', '/receptionist/classes', 1500);
  const rosterBtn = page.getByRole('button', { name: /Xem danh sách & Sửa điểm danh/i }).first();
  if (await rosterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalClick(page, rosterBtn, { dwellBefore: 250, dwellAfter: 1400 });
    await closeModalIfAny(page);
  }

  // 2.4 POS & Hóa đơn nhiệt K80
  await navigateMenu(page, 'aside a[href*="/receptionist/pos"]', '/receptionist/pos', 1600);
  const memberPhoneInput = page.locator('#member-search, input[placeholder*="Tìm theo SĐT"]');
  if (await memberPhoneInput.isVisible().catch(() => false)) {
    await naturalType(page, memberPhoneInput, '0934567890', { delay: 25 });
    await page.waitForTimeout(400);
    const memberPickBtn = page.locator('button').filter({ hasText: /Nguyễn Anh Khoa/i }).first();
    if (await memberPickBtn.isVisible().catch(() => false)) {
      await naturalClick(page, memberPickBtn, { dwellBefore: 250, dwellAfter: 1000 });
    }
  }
  const pkgSelect = page.locator('#package-select, select[name="packageId"]');
  if (await pkgSelect.isVisible().catch(() => false)) {
    await pkgSelect.selectOption({ index: 1 });
    await page.waitForTimeout(800);
  }
  const paymentSelect = page.locator('#payment-method, select[name="paymentMethod"]');
  if (await paymentSelect.isVisible().catch(() => false)) {
    await paymentSelect.selectOption('CASH');
    await page.waitForTimeout(800);
  }
  const submitPosBtn = page.getByRole('button', { name: /Xác nhận và xuất biên lai POS/i });
  if (await submitPosBtn.isVisible().catch(() => false)) {
    await naturalClick(page, submitPosBtn, { dwellBefore: 300, dwellAfter: 2000 });
  }
  await closeModalIfAny(page);

  // 2.5 Thuê & trả dụng cụ
  await navigateMenu(page, 'aside a[href*="/receptionist/equipment"]', '/receptionist/equipment', 1500);
  const equipSearchInput = page.locator('input[type="text"]').first();
  if (await equipSearchInput.isVisible().catch(() => false)) {
    await naturalType(page, equipSearchInput, '0934567890', { delay: 25 });
  }
  await page.waitForTimeout(1000);

  // 2.6 Báo cáo bàn giao ca
  await navigateMenu(page, 'aside a[href*="/receptionist/shift"]', '/receptionist/shift', 1600);
  await smoothScroll(page, 250, 6, 55);

  await naturalLogout(page);

  // =========================================================================
  // PHẦN 3: ACTOR 3 - COACH / HUẤN LUYỆN VIÊN (1 MẠCH DUY NHẤT)
  // =========================================================================
  console.log('[PHẦN 3] Actor 3: HUẤN LUYỆN VIÊN (Coach - Trần Văn Minh)');
  await naturalLogin(page, 'coach.minh@sporthub.com', 'SportHub@123', 'Huấn Luyện Viên');

  // 3.1 Lịch giảng dạy tuần
  await navigateMenu(page, 'aside a[href*="/coach/schedule"]', '/coach/schedule', 1600);

  // 3.2 Điểm danh & nhận xét
  await navigateMenu(page, 'aside a[href*="/coach/attendance"]', '/coach/attendance', 1600);
  const sessionSelect = page.locator('#attendance-session');
  if (await sessionSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sessionSelect.selectOption({ index: 0 });
    await page.waitForTimeout(1000);
  }
  const noteArea = page.locator('textarea').first();
  if (await noteArea.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalType(page, noteArea, 'Kỹ thuật tốt, đúng form động tác, tiến bộ nhanh trong buổi tập.', { delay: 20 });
  }
  const saveAttendanceBtn = page.getByRole('button', { name: /Lưu Điểm Danh/i });
  if (await saveAttendanceBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalClick(page, saveAttendanceBtn, { dwellBefore: 300, dwellAfter: 1600 });
  }

  // 3.3 Học viên (/coach/students): AI gợi ý bài tập -> Gửi giáo án THÀNH CÔNG -> Cập nhật BMI/tiến độ
  await navigateMenu(page, 'aside a[href*="/coach/students"]', '/coach/students', 1800);
  const aiPlanBtn = page.getByRole('button', { name: /Gợi ý giáo án AI/i }).first();
  if (await aiPlanBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await naturalClick(page, aiPlanBtn, { dwellBefore: 300, dwellAfter: 3500 });
  }

  const openPlanBtn = page.getByRole('button', { name: /Soạn Giáo Án/i }).first();
  if (await openPlanBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalClick(page, openPlanBtn, { dwellBefore: 300, dwellAfter: 1400 });

    const savePlanBtn = page.getByRole('button', { name: /Lưu Giáo Án & Gửi Học Viên/i }).first();
    if (await savePlanBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await naturalClick(page, savePlanBtn, { dwellBefore: 300, dwellAfter: 2000 });
    }

    // Sau khi lưu giáo án, modal tự chuyển sang Tab 2 (Lịch sử & Tiến độ BMI)
    const addBodyLogBtn = page.getByRole('button', { name: /Ghi nhận chỉ số mới/i }).first();
    if (await addBodyLogBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await naturalClick(page, addBodyLogBtn, { dwellBefore: 250, dwellAfter: 1000 });
      const weightInput = page.locator('input[placeholder*="70.5"]').first();
      const heightInput = page.locator('input[placeholder*="175"]').first();
      if (await weightInput.isVisible({ timeout: 1500 }).catch(() => false)) {
        await naturalType(page, weightInput, '71.5', { delay: 20, dwellAfter: 300 });
      }
      if (await heightInput.isVisible({ timeout: 1500 }).catch(() => false)) {
        await naturalType(page, heightInput, '175', { delay: 20, dwellAfter: 300 });
      }
      const saveBodyLogBtn = page.getByRole('button', { name: /Lưu chỉ số thể trạng/i }).first();
      if (await saveBodyLogBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await naturalClick(page, saveBodyLogBtn, { dwellBefore: 300, dwellAfter: 1600 });
      }
    }
    await closeModalIfAny(page);
  }

  // 3.4 Đánh giá từ học viên
  await navigateMenu(page, 'aside a[href*="/coach/reviews"]', '/coach/reviews', 1500);

  await naturalLogout(page);

  // =========================================================================
  // PHẦN 4: ACTOR 4 - MEMBER / HỘI VIÊN (1 MẠCH DUY NHẤT)
  // =========================================================================
  console.log('[PHẦN 4] Actor 4: HỘI VIÊN (Member - Nguyễn Anh Khoa)');
  await naturalLogin(page, 'khoa.member@gmail.com', 'SportHub@123', 'Hội Viên');

  // 4.1 Tổng quan Dashboard
  await smoothScroll(page, 300, 6, 55);
  await smoothScroll(page, -300, 6, 55);

  // 4.2 Đăng ký / Gia hạn gói tập
  await navigateMenu(page, 'aside a[href*="/member/packages"]', '/member/packages', 1600);
  await smoothScroll(page, 250, 6, 50);
  const upgradeBtn = page.getByRole('button', { name: /Nâng Cấp Lên Gói Này|Đăng Ký Gói Này/i }).first();
  if (await upgradeBtn.isVisible().catch(() => false)) {
    await naturalClick(page, upgradeBtn, { dwellBefore: 300, dwellAfter: 1400 });
    const cashMethodBtn = page.getByRole('button', { name: /Thanh toán tại quầy/i }).first();
    if (await cashMethodBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await naturalClick(page, cashMethodBtn, { dwellBefore: 250, dwellAfter: 800 });
    }
    const confirmPkgBtn = page.getByRole('button', { name: /Đăng Ký \(Trả Tại Quầy\)|Xác Nhận Đăng Ký|Xác Nhận/i }).first();
    if (await confirmPkgBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await naturalClick(page, confirmPkgBtn, { dwellBefore: 300, dwellAfter: 1800 });
    }
    await closeModalIfAny(page);
  }

  // 4.3 Đặt sân thể thao + Áp voucher
  await navigateMenu(page, 'aside a[href*="/member/book"]', '/member/book/court/sports', 1600);
  const sportCard = page.locator('button').filter({ hasText: /Pickleball|Tennis|Cầu Lông/i }).first();
  if (await sportCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await naturalClick(page, sportCard, { dwellBefore: 300, dwellAfter: 1800 });
  }
  const slotButton = page.locator('button').filter({ hasText: /^\d{1,2}:\d{2}/ }).first();
  if (await slotButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await naturalClick(page, slotButton, { dwellBefore: 300, dwellAfter: 1200 });
  }
  const continueCheckoutBtn = page.getByRole('button', { name: /Tiếp tục thanh toán/i }).first();
  if (await continueCheckoutBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await naturalClick(page, continueCheckoutBtn, { dwellBefore: 300, dwellAfter: 1800 });
  }
  const voucherInput = page.locator('input[placeholder*="Nhập mã"], input[placeholder*="Voucher"]').first();
  if (await voucherInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalType(page, voucherInput, 'FINAL50K', { delay: 25 });
    const applyVoucherBtn = page.getByRole('button', { name: /Áp Dụng/i }).first();
    if (await applyVoucherBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await naturalClick(page, applyVoucherBtn, { dwellBefore: 250, dwellAfter: 1200 });
    }
  }
  const bookingCashBtn = page.getByRole('button', { name: /Thanh toán tại quầy/i }).first();
  if (await bookingCashBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await naturalClick(page, bookingCashBtn, { dwellBefore: 250, dwellAfter: 800 });
  }
  const proceedBtn = page.getByRole('button', { name: /Xác Nhận Đặt Chỗ|Giữ Chỗ \(Thanh Toán Tại Quầy\)|Xác Nhận & Thanh Toán/i }).first();
  if (await proceedBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await naturalClick(page, proceedBtn, { dwellBefore: 300, dwellAfter: 1800 });
  }

  // 4.4 Xem & Đăng ký / Hủy lớp học
  await navigateMenu(page, 'aside a[href*="/member/classes"]', '/member/classes', 1600);
  const registerClassBtn = page.getByRole('button', { name: /Đăng ký lớp học ngay/i }).first();
  if (await registerClassBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await naturalClick(page, registerClassBtn, { dwellBefore: 300, dwellAfter: 1400 });
    const classCashBtn = page.getByRole('button', { name: /Thanh toán tại quầy/i }).first();
    if (await classCashBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await naturalClick(page, classCashBtn, { dwellBefore: 250, dwellAfter: 800 });
    }
    const confirmClassBtn = page.getByRole('button', { name: /Xác Nhận Đặt Chỗ|Giữ Chỗ \(Thanh Toán Tại Quầy\)|Xác Nhận & Thanh Toán/i }).first();
    if (await confirmClassBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await naturalClick(page, confirmClassBtn, { dwellBefore: 300, dwellAfter: 1600 });
    }
    await closeModalIfAny(page);
    const cancelClassBtn = page.getByRole('button', { name: /Hủy yêu cầu|Hủy đăng ký lớp này/i }).first();
    if (await cancelClassBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await naturalClick(page, cancelClassBtn, { dwellBefore: 250, dwellAfter: 1200 });
      const confirmCancelBtn = page.getByRole('button', { name: /Xác nhận hủy|Đồng ý|Gửi yêu cầu/i }).first();
      if (await confirmCancelBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await naturalClick(page, confirmCancelBtn, { dwellBefore: 250, dwellAfter: 1400 });
      }
      await closeModalIfAny(page);
    }
  }

  // 4.5 Lịch tập cá nhân
  await navigateMenu(page, 'aside a[href*="/member/schedule"]', '/member/schedule', 1600);

  // 4.6 Giáo án tập luyện (thấy giáo án Coach vừa gửi, tick hoàn thành) & Lịch sử điểm danh
  await navigateMenu(page, 'aside a[href*="/member/workout-plans"]', '/member/workout-plans', 1800);
  const exerciseItem = page.locator('div[class*="cursor-pointer"]').filter({ hasText: /check_box/ }).first();
  if (await exerciseItem.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalClick(page, exerciseItem, { dwellBefore: 300, dwellAfter: 1400 });
  }
  await navigateMenu(page, 'aside a[href*="/member/attendance"]', '/member/attendance', 1500);

  // 4.7 Đánh giá HLV 5 sao
  await navigateMenu(page, 'aside a[href*="/member/reviews"]', '/member/reviews', 1600);
  const starBtn = page.locator('button[aria-label="5 sao"]').first();
  if (await starBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalClick(page, starBtn, { dwellBefore: 250, dwellAfter: 900 });
    const reviewTextarea = page.locator('textarea').first();
    if (await reviewTextarea.isVisible().catch(() => false)) {
      await naturalType(page, reviewTextarea, 'HLV Minh hướng dẫn cực kỳ nhiệt tình, chuẩn form và chuyên nghiệp!', { delay: 20 });
    }
    const submitReviewBtn = page.getByRole('button', { name: /Gửi đánh giá/i });
    if (await submitReviewBtn.isVisible().catch(() => false)) {
      await naturalClick(page, submitReviewBtn, { dwellBefore: 300, dwellAfter: 1600 });
    }
  }

  // 4.8 Hỏi đáp Trợ lý AI Thể thao
  await navigateMenu(page, 'aside a[href*="/member/ai-assistant"]', '/member/ai-assistant', 1600);
  const aiInput = page.locator('#member-ai-message, input[placeholder*="Hỏi AI"], form input[type="text"]').first();
  if (await aiInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalType(page, aiInput, 'Tư vấn thực đơn dinh dưỡng tăng cơ giảm mỡ cho người tập Gym', { delay: 20 });
    const aiSendBtn = page.getByRole('button', { name: /Gửi câu hỏi/i });
    if (await aiSendBtn.isVisible().catch(() => false)) {
      await naturalClick(page, aiSendBtn, { dwellBefore: 300, dwellAfter: 4000 });
    }
  }

  // 4.9 Hồ sơ cá nhân, thẻ QR/RFID & Thông báo
  await navigateMenu(page, 'aside a[href*="/member/notifications"]', '/member/notifications', 1400);
  await navigateMenu(page, 'aside a[href*="/member/profile"]', '/member/profile', 2000);
  await smoothScroll(page, 200, 6, 55);
  await page.waitForTimeout(1500);

  console.log(`-> Hoàn tất ghi hình demo. Tổng lỗi API: ${apiErrors.length}`);
  await page.close();
  await context.close();
  await browser.close();

  const recordedFiles = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith('.webm'));
  if (recordedFiles.length === 0) {
    throw new Error('Không tìm thấy tệp video webm sau khi ghi hình!');
  }

  const rawWebmPath = path.join(RECORDINGS_DIR, recordedFiles[recordedFiles.length - 1]);
  console.log(`Video WebM gốc: ${rawWebmPath}`);

  console.log('-> Đang chuyển đổi sang định dạng MP4 H.264 chuẩn 1080p...');
  const ffmpegExe = 'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Stremio\\ffmpeg.exe';
  const ffmpegCmd = `"${ffmpegExe}" -y -i "${rawWebmPath}" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p "${FINAL_MP4_PATH}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  fs.copyFileSync(FINAL_MP4_PATH, ROOT_DEMO_MP4);

  const stats = fs.statSync(FINAL_MP4_PATH);
  console.log('====================================================');
  console.log('=== XUẤT VIDEO DEMO MP4 THÀNH CÔNG ===');
  console.log(`Đường dẫn MP4: ${FINAL_MP4_PATH}`);
  console.log(`Kích thước: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('====================================================');
}

runPureDemo().catch((err) => {
  console.error('Lỗi khi quay video demo:', err);
  process.exit(1);
});
