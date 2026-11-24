import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const payments = Array.from({ length: 12 }, (_, index) => ({
  paymentId: `GD-${String(index + 1).padStart(2, '0')}`,
  memberName: `Hội viên ${index + 1}`,
  phone: `09000000${String(index).padStart(2, '0')}`,
  email: `member${index}@example.com`,
  amount: index === 1 ? 300000 : 100000,
  type: index === 0 ? 'MEMBERSHIP' : 'COURT',
  status: index < 2 ? 'Hoàn tất' : index === 2 ? 'Đã hoàn tiền' : 'Chờ thanh toán',
  method: index % 2 ? 'Tiền mặt' : 'Thanh toán trực tuyến VNPay',
  description: `Thanh toán dịch vụ ${index + 1}`,
  createdAt: '2026-11-20T09:00:00',
}));
const report = {
  totalRevenue: 400000,
  completedPayments: 2,
  newMembers: 3,
  payments,
  paymentMethods: [
    { method: 'Tiền mặt', amount: 300000, count: 1 },
    { method: 'Thanh toán trực tuyến VNPay', amount: 100000, count: 1 },
  ],
};
const schedule = [
  {
    sessionId: 1,
    className: 'Tennis sáng',
    sportName: 'Tennis',
    facilityName: 'Sân 1',
    coachName: 'HLV Minh',
    startTime: '2026-11-20T09:00:00',
    endTime: '2026-11-20T10:00:00',
    bookedSlots: 5,
    maxSlots: 10,
    status: 'SCHEDULED',
  },
  {
    sessionId: 2,
    className: 'Lớp đã hủy',
    startTime: '2026-11-20T10:00:00',
    endTime: '2026-11-20T11:00:00',
    bookedSlots: 10,
    maxSlots: 10,
    status: 'CANCELLED',
  },
  {
    sessionId: 3,
    className: 'Lớp ngày khác',
    startTime: '2026-11-21T09:00:00',
    endTime: '2026-11-21T10:00:00',
    bookedSlots: 8,
    maxSlots: 10,
    status: 'SCHEDULED',
  },
];

async function setup(page, overrides = {}) {
  await page.clock.install({ time: new Date('2026-11-20T05:00:00Z') });
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'sports-center-auth-session',
      JSON.stringify({
        token: 'dashboard-ui-test',
        role: 'admin',
        user: { id: 1, name: 'Quản lý', role: 'MANAGER' },
      }),
    ),
  );
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/receptionist/report')) {
      if (overrides.report) return overrides.report(route, url);
      return route.fulfill({ json: { ...report, period: url.searchParams.get('period') } });
    }
    if (url.pathname.endsWith('/receptionist-schedule')) {
      if (overrides.schedule) return overrides.schedule(route, url);
      return route.fulfill({ json: schedule });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/admin');
}

test('completed revenue, daily occupancy, transaction search, pagination and accessible details', async ({
  page,
}, testInfo) => {
  await setup(page);
  const revenue = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Doanh thu theo dịch vụ', exact: true }) });
  await expect(revenue).toContainText('300.000');
  await expect(revenue).toContainText('(75%)');
  await expect(revenue).toContainText('(25%)');
  await expect(revenue).toContainText('1 giao dịch');
  const classes = page.getByRole('region', { name: /Lịch lớp học/ });
  await expect(classes).toContainText('5 / 10');
  await expect(classes).toContainText('50%');
  await expect(classes).not.toContainText('Lớp ngày khác');
  await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Xem giao dịch GD-12', exact: true })).toBeVisible();
  await page.getByLabel('Tìm giao dịch', { exact: true }).fill('0900000002');
  await expect(page.getByRole('button', { name: 'Xem giao dịch GD-03', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sau', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Xem giao dịch GD-03', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Chi tiết giao dịch', exact: true });
  await expect(dialog).toContainText('Đã hoàn tiền');
  await expect(dialog).toContainText('member2@example.com');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await page.getByLabel('Trạng thái giao dịch', { exact: true }).selectOption('completed');
  await page.getByLabel('Phương thức giao dịch', { exact: true }).selectOption('Tiền mặt');
  await expect(page.getByRole('button', { name: /Xem giao dịch/ })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Xem giao dịch GD-02', exact: true })).toBeVisible();
});

test('month filter uses correct report query and exports the whole period from both buttons', async ({ page }) => {
  const queries = [];
  await setup(page, {
    report: async (route, url) => {
      queries.push(url.search);
        await route.fulfill({ json: { ...report, period: url.searchParams.get('period') } });
    },
  });
  await page.getByRole('button', { name: 'Tháng', exact: true }).click();
  await page.getByLabel('Tháng báo cáo', { exact: true }).fill('2026-10');
  await expect(page.getByRole('button', { name: 'Xuất báo cáo CSV', exact: true })).toBeEnabled();
  await expect.poll(() => queries.at(-1)).toBe('?period=month&date=2026-10-01');
  await expect(page.getByRole('region', { name: /Lịch lớp học/ })).toContainText('Lịch hôm nay, độc lập');
  for (const name of ['Xuất báo cáo CSV', 'Xuất báo cáo']) {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name, exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('BaoCao_TongQuan_month_2026-10.csv');
    const csv = await fs.readFile(await download.path(), 'utf8');
    expect(csv).toContain('Tháng 10/2026');
    expect(csv).toContain('GD-12');
    expect(csv).toContain('Đã hoàn tiền');
  }
});

test('report failure clears previous data and disables export until successful retry', async ({ page }) => {
  let fail = false;
  await setup(page, {
    report: (route, url) =>
      route.fulfill(fail ? { status: 500, json: { message: 'Báo cáo tạm thời không khả dụng' } } : { json: { ...report, period: url.searchParams.get('period') } }),
  });
  await expect(page.getByRole('heading', { name: 'Doanh thu đã thu', exact: true })).toBeVisible();
  fail = true;
  await page.getByRole('button', { name: 'Tháng', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Báo cáo tạm thời không khả dụng');
  await expect(page.getByRole('heading', { name: 'Doanh thu đã thu', exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Xuất báo cáo CSV', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Xuất báo cáo', exact: true })).toBeDisabled();
  await expect(page.getByText('Tennis sáng', { exact: true })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Doanh thu đã thu', exact: true })).toBeVisible();
});

test('schedule error is visible and retry does not discard financial report', async ({ page }) => {
  let fail = true;
  await setup(page, {
    schedule: (route) =>
      route.fulfill(fail ? { status: 503, json: { message: 'Không tải được lịch lớp' } } : { json: [] }),
  });
  await expect(page.getByRole('alert')).toContainText('Không tải được lịch lớp');
  await expect(page.getByRole('heading', { name: 'Doanh thu đã thu', exact: true })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('Không có lớp học trong ngày này.', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: /Lịch lớp học/ })).toContainText('Tỷ lệ lấp đầy: —');
});

test('legacy daily-only server cannot silently show zero revenue for a month', async ({ page }) => {
  await setup(page, {
    report: (route, url) => route.fulfill({ json: url.searchParams.get('period') === 'day' ? report : {
      date: '2026-11-01', totalRevenue: 0, completedPayments: 0, newMembers: 0, payments: [], paymentMethods: [],
    } }),
  });
  await expect(page.getByRole('heading', { name: 'Doanh thu đã thu', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tháng', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Máy chủ chưa trả về đúng kỳ báo cáo');
  await expect(page.getByRole('heading', { name: 'Doanh thu đã thu', exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Xuất báo cáo CSV', exact: true })).toBeDisabled();
});

test('empty report and narrow viewport remain usable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, {
    report: (route) =>
      route.fulfill({
        json: { totalRevenue: 0, completedPayments: 0, newMembers: 0, payments: [], paymentMethods: [] },
      }),
  });
  await expect(page.getByText('Chưa có giao dịch trong kỳ báo cáo này.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dashboard-mobile.png'), fullPage: true });
  await expect(
    page.getByRole('heading', { name: 'Giá trị giao dịch trung bình', exact: true }).locator('..').locator('..'),
  ).toContainText('—');
});
