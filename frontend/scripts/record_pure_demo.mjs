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
async function naturalMove(page, targetX, targetY, steps = 16) {
  await page.mouse.move(targetX, targetY, { steps });
}

async function naturalClick(page, locator, { dwellBefore = 350, dwellAfter = 1400 } = {}) {
  try {
    const loc = locator.first();
    await loc.scrollIntoViewIfNeeded({ timeout: 3500 }).catch(() => {});
    const box = await loc.boundingBox({ timeout: 3500 }).catch(() => null);
    if (box) {
      const targetX = Math.round(box.x + Math.min(box.width / 2, 70));
      const targetY = Math.round(box.y + Math.min(box.height / 2, 22));
      await naturalMove(page, targetX, targetY, 14);
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

async function naturalType(page, locator, text, { delay = 35, dwellAfter = 800 } = {}) {
  try {
    const loc = locator.first();
    await loc.scrollIntoViewIfNeeded({ timeout: 3500 }).catch(() => {});
    const box = await loc.boundingBox({ timeout: 3500 }).catch(() => null);
    if (box) {
      const targetX = Math.round(box.x + Math.min(box.width / 2, 60));
      const targetY = Math.round(box.y + Math.min(box.height / 2, 20));
      await naturalMove(page, targetX, targetY, 12);
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

async function smoothScroll(page, deltaY, steps = 10, stepDelay = 60) {
  const stepY = deltaY / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, stepY);
    await page.waitForTimeout(stepDelay);
  }
  await page.waitForTimeout(800);
}

async function naturalLogin(page, email, password, roleName) {
  console.log(`-> [Đăng nhập ${roleName}]: ${email}`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const emailInput = page.locator('input[placeholder*="name@example.com"], input[type="text"]').first();
  const passInput = page.locator('input[type="password"]').first();
  const submitBtn = page.getByRole('button', { name: /ĐĂNG NHẬP NGAY/i }).first();

  await naturalType(page, emailInput, email, { delay: 30 });
  await naturalType(page, passInput, password, { delay: 30 });
  await naturalClick(page, submitBtn, { dwellBefore: 350, dwellAfter: 2200 });
}

async function naturalLogout(page) {
  console.log('-> [Đăng xuất] Kết thúc phiên làm việc...');
  try {
    const logoutBtn = page.locator('button:has(span:has-text("logout"))').first();
    if (await logoutBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
      await naturalClick(page, logoutBtn, { dwellBefore: 300, dwellAfter: 1200 });
    }
  } catch (err) {
    console.warn('Logout click fallback:', err);
  }

  // Ensure clean session reset
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
}

async function navigateMenu(page, selector, targetUrl, dwell = 2000) {
  try {
    // If any modal/drawer backdrop is still visible, close it cleanly first
    const backdrop = page.locator('.fixed.inset-0.z-50, [role="dialog"]').first();
    if (await backdrop.isVisible({ timeout: 500 }).catch(() => false)) {
      const closeBtn = page.locator('button:has-text("Hủy bỏ"), button:has-text("Đóng"), button:has(span:has-text("close"))').first();
      if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await closeBtn.click().catch(() => {});
      } else {
        await page.keyboard.press('Escape').catch(() => {});
      }
      await page.waitForTimeout(400);
    }

    const link = page.locator(selector).first();
    if (await link.isVisible({ timeout: 2500 }).catch(() => false)) {
      await naturalClick(page, link, { dwellBefore: 300, dwellAfter: 1200 });
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
  console.log('=== KHỞI ĐỘNG QUAY VIDEO DEMO FULLHD 1 MÀN HÌNH THUẦN TÚY ===');
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

  // =========================================================================
  // PHẦN 1: TRANG CHỦ & BẢNG GIÁ CÔNG KHAI
  // =========================================================================
  console.log('[PHẦN 1] Khám phá Trang chủ & Bảng giá công khai');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Cuộn trang tự nhiên xem các môn thể thao & tiện ích
  await smoothScroll(page, 450, 8, 70);
  await page.waitForTimeout(1400);
  await smoothScroll(page, 550, 10, 70);
  await page.waitForTimeout(1600);

  // Xem Bảng giá
  const pricingLink = page.getByRole('link', { name: /Bảng giá/i }).first();
  if (await pricingLink.isVisible().catch(() => false)) {
    await naturalClick(page, pricingLink, { dwellBefore: 300, dwellAfter: 2000 });
    await smoothScroll(page, 400, 8, 60);
    await page.waitForTimeout(1600);
  }

  // =========================================================================
  // PHẦN 2: ACTOR 1 - MEMBER (HỘI VIÊN)
  // =========================================================================
  console.log('[PHẦN 2] Actor 1: HỘI VIÊN (Member - Nguyễn Anh Khoa)');
  await naturalLogin(page, 'khoa.member@gmail.com', 'SportHub@123', 'Hội Viên');

  // 1. Member Dashboard
  await smoothScroll(page, 350, 8, 60);
  await page.waitForTimeout(1800);
  await smoothScroll(page, -350, 8, 60);
  await page.waitForTimeout(1200);

  // 2. Gói tập & Quyền lợi -> Đăng ký / Nâng cấp VIP
  await navigateMenu(page, 'aside a[href*="/member/packages"], a:has-text("Gói tập & Quyền lợi")', '/member/packages', 2200);
  await smoothScroll(page, 300, 8, 60);
  await page.waitForTimeout(1500);

  const upgradeBtn = page.getByRole('button', { name: /Nâng Cấp Lên Gói Này|Đăng Ký Gói Này/i }).first();
  if (await upgradeBtn.isVisible().catch(() => false)) {
    await naturalClick(page, upgradeBtn, { dwellBefore: 400, dwellAfter: 1800 });
    
    // Chọn thanh toán tại quầy
    const cashMethodBtn = page.locator('button, div').filter({ hasText: /Thanh toán tại quầy/i }).first();
    if (await cashMethodBtn.isVisible().catch(() => false)) {
      await naturalClick(page, cashMethodBtn, { dwellBefore: 300, dwellAfter: 1000 });
    }

    const confirmPkgBtn = page.getByRole('button', { name: /Tôi Đã Chuyển Khoản|Đăng Ký \(Trả Tại Quầy\)|Xác Nhận/i }).first();
    if (await confirmPkgBtn.isVisible().catch(() => false)) {
      await naturalClick(page, confirmPkgBtn, { dwellBefore: 400, dwellAfter: 2200 });
    }
  }

  // 3. Đặt sân thể thao
  await navigateMenu(page, 'aside a[href*="/member/book"], a:has-text("Đặt sân thể thao")', '/member/book/court/sports', 2200);

  // Chọn môn thể thao
  const sportCard = page.locator('article, div[class*="rounded"]').filter({ hasText: /Pickleball|Tennis|Cầu Lông/i }).first();
  if (await sportCard.isVisible().catch(() => false)) {
    await naturalClick(page, sportCard, { dwellBefore: 400, dwellAfter: 2000 });
  }

  // Chọn khung giờ khả dụng
  const slotButton = page.locator('button').filter({ hasText: /^\d{1,2}:00|Slot|Ca/i }).first();
  if (await slotButton.isVisible().catch(() => false)) {
    await naturalClick(page, slotButton, { dwellBefore: 350, dwellAfter: 1500 });
  }

  // Áp dụng mã Voucher
  const voucherInput = page.locator('input[placeholder*="Voucher"], input[placeholder*="mã giảm"]');
  if (await voucherInput.isVisible().catch(() => false)) {
    await naturalType(page, voucherInput, 'FINAL50K', { delay: 30 });
    const applyVoucherBtn = page.getByRole('button', { name: /Áp dụng/i });
    if (await applyVoucherBtn.isVisible().catch(() => false)) {
      await naturalClick(page, applyVoucherBtn, { dwellBefore: 300, dwellAfter: 1500 });
    }
  }

  // Xác nhận đặt sân
  const proceedBtn = page.getByRole('button', { name: /Tiếp tục thanh toán|Xác Nhận & Đặt Sân|Xác Nhận & Thanh Toán/i }).first();
  if (await proceedBtn.isVisible().catch(() => false)) {
    await naturalClick(page, proceedBtn, { dwellBefore: 400, dwellAfter: 2200 });
  }

  // 4. Kiểm tra Lịch cá nhân
  await navigateMenu(page, 'aside a[href*="/member/schedule"], a:has-text("Lịch tập của tôi")', '/member/schedule', 2200);

  // 5. Thẻ Hội Viên Số & Mã QR/RFID
  await navigateMenu(page, 'aside a[href*="/member/profile"], a:has-text("Hồ sơ & Thẻ số")', '/member/profile', 2500);
  await smoothScroll(page, 200, 6, 60);
  await page.waitForTimeout(2000);

  // Đăng xuất Hội viên
  await naturalLogout(page);

  // =========================================================================
  // PHẦN 3: ACTOR 2 - ADMIN / MANAGER (QUẢN TRỊ VIÊN)
  // =========================================================================
  console.log('[PHẦN 3] Actor 2: QUẢN TRỊ VIÊN (Admin - Nguyễn Văn Quản Lý)');
  await naturalLogin(page, 'manager@sporthub.com', 'SportHub@123', 'Quản Trị Viên');

  // 1. Admin Dashboard Doanh thu & Thống kê
  await smoothScroll(page, 400, 8, 60);
  await page.waitForTimeout(2000);
  await smoothScroll(page, -400, 8, 60);
  await page.waitForTimeout(1000);

  // 2. Quản lý Gói tập & Voucher
  await navigateMenu(page, 'aside a[href*="/admin/packages"], a:has-text("Gói tập & Dịch vụ")', '/admin/packages', 2000);

  // Thêm gói tập mới
  const addPkgBtn = page.getByRole('button', { name: /Thêm gói tập mới/i });
  if (await addPkgBtn.isVisible().catch(() => false)) {
    await naturalClick(page, addPkgBtn, { dwellBefore: 350, dwellAfter: 1500 });
    const nameInput = page.locator('#packageName, input[name="name"], input[name="packageName"], input[placeholder*="VIP"], input[placeholder*="gói tập" i], input[placeholder*="Gold"]').first();
    const priceInput = page.locator('#packagePrice, input[name="price"], input[placeholder*="Giá" i], input[type="number"]').first();
    const durationInput = page.locator('#packageDuration, input[name="durationDays"], input[placeholder*="Thời hạn" i]').first();
    
    if (await nameInput.isVisible().catch(() => false)) {
      await naturalType(page, nameInput, 'Gói VIP Diamond 2026', { delay: 25 });
    }
    if (await priceInput.isVisible().catch(() => false)) {
      await naturalType(page, priceInput, '4500000', { delay: 25 });
    }
    if (await durationInput.isVisible().catch(() => false)) {
      await naturalType(page, durationInput, '60', { delay: 25 });
    }

    const savePkgBtn = page.getByRole('button', { name: /Lưu gói tập/i });
    if (await savePkgBtn.isVisible().catch(() => false)) {
      await naturalClick(page, savePkgBtn, { dwellBefore: 350, dwellAfter: 2000 });
    }

    // Safety check: ensure drawer modal is closed so it never hangs or covers the screen
    const drawerBackdrop = page.locator('.fixed.inset-0.z-50');
    try {
      await drawerBackdrop.waitFor({ state: 'hidden', timeout: 3500 });
    } catch {
      const cancelBtn = page.locator('button:has-text("Hủy bỏ"), button:has(span:has-text("close"))').first();
      if (await cancelBtn.isVisible().catch(() => false)) {
        await naturalClick(page, cancelBtn, { dwellBefore: 200, dwellAfter: 1000 });
      } else {
        await page.keyboard.press('Escape').catch(() => {});
      }
    }
    await page.waitForTimeout(1000);
  }

  // Quản lý Voucher
  const voucherTabBtn = page.getByRole('button', { name: /Mã giảm giá & Voucher/i });
  if (await voucherTabBtn.isVisible().catch(() => false)) {
    await naturalClick(page, voucherTabBtn, { dwellBefore: 350, dwellAfter: 1800 });
  }

  // 3. Phê duyệt Gói tập Hội viên
  await navigateMenu(page, 'aside a[href*="/admin/staff-approvals"], a:has-text("Duyệt & Phê duyệt")', '/admin/staff-approvals', 2000);

  const membershipTab = page.getByRole('button', { name: /Duyệt gói hội viên/i });
  if (await membershipTab.isVisible().catch(() => false)) {
    await naturalClick(page, membershipTab, { dwellBefore: 350, dwellAfter: 1800 });
  }

  const approvePkgActionBtn = page.getByRole('button', { name: /Phê duyệt kích hoạt|Kích hoạt gói/i }).first();
  if (await approvePkgActionBtn.isVisible().catch(() => false)) {
    await naturalClick(page, approvePkgActionBtn, { dwellBefore: 400, dwellAfter: 2200 });
  }

  // 4. Quản lý Sân bãi & Khóa bảo trì
  await navigateMenu(page, 'aside a[href*="/admin/facilities"], a:has-text("Lịch & Sân bãi")', '/admin/facilities', 2000);

  const courtArticle = page.locator('article, tr').filter({ hasText: /Sân Cầu Lông|Sân Tennis|Hồ Bơi/i }).first();
  const lockMaintenanceBtn = courtArticle.getByRole('button', { name: /Tạm khóa bảo trì/i });
  if (await lockMaintenanceBtn.isVisible().catch(() => false)) {
    await naturalClick(page, lockMaintenanceBtn, { dwellBefore: 400, dwellAfter: 2000 });
    
    // Mở lại hoạt động
    const unlockMaintenanceBtn = courtArticle.getByRole('button', { name: /Mở lại hoạt động/i });
    if (await unlockMaintenanceBtn.isVisible().catch(() => false)) {
      await naturalClick(page, unlockMaintenanceBtn, { dwellBefore: 400, dwellAfter: 2000 });
    }
  }

  // 5. Phát thông báo Broadcast toàn hệ thống
  await navigateMenu(page, 'aside a[href*="/admin/broadcast"], a:has-text("Thông báo hàng loạt")', '/admin/broadcast', 2000);

  const titleInput = page.getByPlaceholder('Tiêu đề');
  const contentInput = page.getByPlaceholder('Nội dung thông báo');
  if (await titleInput.isVisible().catch(() => false)) {
    await naturalType(page, titleInput, '[THÔNG BÁO] Nâng cấp mặt sân thi đấu Quốc tế', { delay: 25 });
  }
  if (await contentInput.isVisible().catch(() => false)) {
    await naturalType(page, contentInput, 'SportHub đã hoàn tất kiểm định và nâng cấp bảo dưỡng toàn bộ hệ thống sân thể thao.', { delay: 25 });
  }
  const sendBroadcastBtn = page.getByRole('button', { name: /Gửi thông báo/i });
  if (await sendBroadcastBtn.isVisible().catch(() => false)) {
    await naturalClick(page, sendBroadcastBtn, { dwellBefore: 400, dwellAfter: 2200 });
  }

  // 6. Kiểm tra Audit Logs
  await navigateMenu(page, 'aside a[href*="/admin/audit-logs"], a:has-text("Nhật ký hệ thống")', '/admin/audit-logs', 2200);
  await smoothScroll(page, 300, 8, 60);
  await page.waitForTimeout(2000);

  // Đăng xuất Admin
  await naturalLogout(page);

  // =========================================================================
  // PHẦN 4: ACTOR 3 - RECEPTIONIST (LỄ TÂN)
  // =========================================================================
  console.log('[PHẦN 4] Actor 3: LỄ TÂN (Receptionist - Lê Thị Lễ Tân)');
  await naturalLogin(page, 'reception.le@sporthub.com', 'SportHub@123', 'Lễ Tân');

  // 1. Quầy Check-in RFID
  await navigateMenu(page, 'aside a[href*="/receptionist/checkin"], a:has-text("Quầy Check-in")', '/receptionist/checkin', 2000);

  // Nhập mã RFID hoặc tìm hội viên
  const scanInput = page.getByPlaceholder(/Quét mã QR thẻ hội viên hoặc quẹt thẻ từ RFID/i);
  if (await scanInput.isVisible().catch(() => false)) {
    await naturalType(page, scanInput, 'RFID-SH-0009', { delay: 30 });
    const lookupBtn = page.getByRole('button', { name: /Tra Cứu Thẻ/i });
    if (await lookupBtn.isVisible().catch(() => false)) {
      await naturalClick(page, lookupBtn, { dwellBefore: 350, dwellAfter: 1800 });
    }
  }

  const confirmCheckInBtn = page.getByRole('button', { name: /XÁC NHẬN CHO VÀO TẬP/i });
  if (await confirmCheckInBtn.isVisible().catch(() => false)) {
    await naturalClick(page, confirmCheckInBtn, { dwellBefore: 400, dwellAfter: 2200 });
  }

  // 2. Quầy Thu Ngân Bán Lẻ POS & In Hóa đơn Nhiệt K80
  await navigateMenu(page, 'aside a[href*="/receptionist/pos"], a:has-text("Bán hàng & Thu ngân POS")', '/receptionist/pos', 2200);

  const memberPhoneInput = page.locator('#member-search, input[placeholder*="Tìm theo SĐT"]');
  if (await memberPhoneInput.isVisible().catch(() => false)) {
    await naturalType(page, memberPhoneInput, '0934567890', { delay: 30 });
    await page.waitForTimeout(500);
    const memberPickBtn = page.locator('button').filter({ hasText: /Nguyễn Anh Khoa/i }).first();
    if (await memberPickBtn.isVisible().catch(() => false)) {
      await naturalClick(page, memberPickBtn, { dwellBefore: 300, dwellAfter: 1200 });
    }
  }

  const pkgSelect = page.locator('#package-select, select[name="packageId"]');
  if (await pkgSelect.isVisible().catch(() => false)) {
    await pkgSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
  }

  const paymentSelect = page.locator('#payment-method, select[name="paymentMethod"]');
  if (await paymentSelect.isVisible().catch(() => false)) {
    await paymentSelect.selectOption('CASH');
    await page.waitForTimeout(1000);
  }

  const submitPosBtn = page.getByRole('button', { name: /Xác nhận và xuất biên lai POS/i });
  if (await submitPosBtn.isVisible().catch(() => false)) {
    await naturalClick(page, submitPosBtn, { dwellBefore: 400, dwellAfter: 2500 });
  }

  // Xem hóa đơn nhiệt K80 và đóng modal
  const closeReceiptBtn = page.getByRole('button', { name: /Đóng/i }).first();
  if (await closeReceiptBtn.isVisible().catch(() => false)) {
    await page.waitForTimeout(2000);
    await naturalClick(page, closeReceiptBtn, { dwellBefore: 350, dwellAfter: 1500 });
  }

  // 3. Mượn & Thuê Dụng Cụ
  await navigateMenu(page, 'aside a[href*="/receptionist/equipment"], a:has-text("Mượn & Thuê Dụng Cụ")', '/receptionist/equipment', 2000);
  const equipSearchInput = page.locator('input[type="text"]').first();
  if (await equipSearchInput.isVisible().catch(() => false)) {
    await naturalType(page, equipSearchInput, '0934567890', { delay: 30 });
  }
  await page.waitForTimeout(1500);

  // 4. Báo cáo ca trực & Doanh thu
  await navigateMenu(page, 'aside a[href*="/receptionist/shift"], a:has-text("Báo cáo ca trực")', '/receptionist/shift', 2200);
  await smoothScroll(page, 250, 6, 60);
  await page.waitForTimeout(2000);

  // Đăng xuất Lễ tân
  await naturalLogout(page);

  // =========================================================================
  // PHẦN 5: ACTOR 4 - COACH (HUẤN LUYỆN VIÊN)
  // =========================================================================
  console.log('[PHẦN 5] Actor 4: HUẤN LUYỆN VIÊN (Coach - Trần Văn Minh)');
  await naturalLogin(page, 'coach.minh@sporthub.com', 'SportHub@123', 'Huấn Luyện Viên');

  // 1. Lịch giảng dạy tuần
  await navigateMenu(page, 'aside a[href*="/coach/schedule"], a:has-text("Lịch giảng dạy")', '/coach/schedule', 2200);
  await page.waitForTimeout(1800);

  // 2. Điểm danh & Nhận xét học viên
  await navigateMenu(page, 'aside a[href*="/coach/attendance"], a:has-text("Điểm danh & Nhận xét")', '/coach/attendance', 2200);

  const sessionSelect = page.locator('#attendance-session');
  if (await sessionSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sessionSelect.selectOption({ index: 0 });
    await page.waitForTimeout(1500);
  }

  const noteArea = page.locator('textarea').first();
  if (await noteArea.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalType(page, noteArea, 'Kỹ thuật tốt, đúng form động tác, tiến bộ nhanh trong buổi tập.', { delay: 25 });
  }

  const saveAttendanceBtn = page.getByRole('button', { name: /Lưu Điểm Danh/i });
  if (await saveAttendanceBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalClick(page, saveAttendanceBtn, { dwellBefore: 400, dwellAfter: 2200 });
  }

  // 3. Đánh giá từ học viên
  await navigateMenu(page, 'aside a[href*="/coach/reviews"], a:has-text("Đánh giá từ học viên")', '/coach/reviews', 2200);
  await page.waitForTimeout(2000);

  // Đăng xuất HLV
  await naturalLogout(page);

  // =========================================================================
  // PHẦN 6: HỘI VIÊN TIẾP NHẬN GIÁO ÁN, ĐÁNH GIÁ 5 SAO & TRỢ LÝ AI
  // =========================================================================
  console.log('[PHẦN 6] Hội viên tiếp nhận giáo án, Đánh giá 5 sao & Chat Trợ lý AI');
  await naturalLogin(page, 'khoa.member@gmail.com', 'SportHub@123', 'Hội Viên');

  // 1. Kế hoạch & Nhận xét HLV
  await navigateMenu(page, 'aside a[href*="/member/workout-plans"], a:has-text("Kế hoạch & Nhận xét HLV")', '/member/workout-plans', 2200);

  const exerciseItem = page.locator('div[class*="cursor-pointer"]').filter({ hasText: /check_box/ }).first();
  if (await exerciseItem.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalClick(page, exerciseItem, { dwellBefore: 350, dwellAfter: 1800 });
  }

  // 2. Gửi Đánh Giá 5 Sao cho HLV
  await navigateMenu(page, 'aside a[href*="/member/reviews"], a:has-text("Đánh giá HLV & lớp học")', '/member/reviews', 2200);

  const starBtn = page.locator('button[aria-label="5 sao"]').first();
  if (await starBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalClick(page, starBtn, { dwellBefore: 300, dwellAfter: 1200 });
    
    const reviewTextarea = page.locator('textarea').first();
    if (await reviewTextarea.isVisible().catch(() => false)) {
      await naturalType(page, reviewTextarea, 'HLV Minh hướng dẫn cực kỳ nhiệt tình, chuẩn form và chuyên nghiệp!', { delay: 25 });
    }

    const submitReviewBtn = page.getByRole('button', { name: /Gửi đánh giá/i });
    if (await submitReviewBtn.isVisible().catch(() => false)) {
      await naturalClick(page, submitReviewBtn, { dwellBefore: 400, dwellAfter: 2200 });
    }
  }

  // 3. Trò chuyện cùng Trợ lý AI Thể thao
  await navigateMenu(page, 'aside a[href*="/member/ai-assistant"], a:has-text("Trợ lý AI thể thao")', '/member/ai-assistant', 2200);

  const aiInput = page.locator('#member-ai-message, input[placeholder*="Hỏi AI"], form input[type="text"]').first();
  if (await aiInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await naturalType(page, aiInput, 'Tư vấn thực đơn dinh dưỡng tăng cơ giảm mỡ cho người tập Gym', { delay: 25 });
    
    const aiSendBtn = page.getByRole('button', { name: /Gửi câu hỏi/i });
    if (await aiSendBtn.isVisible().catch(() => false)) {
      await naturalClick(page, aiSendBtn, { dwellBefore: 400, dwellAfter: 4500 });
    }
  }

  // 4. Tổng quan Thẻ Hội viên & Dashboard Hoàn tất
  await navigateMenu(page, 'aside a[href*="/member/profile"], a:has-text("Hồ sơ & Thẻ số")', '/member/profile', 2800);
  await page.waitForTimeout(2000);

  console.log('-> Hoàn tất ghi hình demo. Đang đóng trình duyệt...');
  await page.close();
  await context.close();
  await browser.close();

  // Tìm tệp webm được Playwright xuất ra
  const recordedFiles = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith('.webm'));
  if (recordedFiles.length === 0) {
    throw new Error('Không tìm thấy tệp video webm sau khi ghi hình!');
  }

  const rawWebmPath = path.join(RECORDINGS_DIR, recordedFiles[recordedFiles.length - 1]);
  console.log(`Video WebM gốc: ${rawWebmPath}`);

  // Chuyển đổi sang MP4 H.264 tiêu chuẩn bằng ffmpeg
  console.log('-> Đang chuyển đổi sang định dạng MP4 H.264 chuẩn 1080p...');
  const ffmpegExe = 'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Stremio\\ffmpeg.exe';
  
  const ffmpegCmd = `"${ffmpegExe}" -y -i "${rawWebmPath}" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p "${FINAL_MP4_PATH}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  // Sao lưu thêm vào demo_video.mp4 tại thư mục gốc
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
