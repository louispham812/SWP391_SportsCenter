import { test, expect } from '@playwright/test';

test('main menu opens class creation with sport filtering and required tuition', async ({ page }) => {
  let submitted;
  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'class-ui-test', role: 'admin', user: { id: 1, name: 'Quản lý', role: 'MANAGER' },
  })));
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data = [];
    if (path.endsWith('/domain-sports')) data = [{ sportId: 1, sportName: 'Pickleball' }, { sportId: 2, sportName: 'Tennis' }];
    else if (path.endsWith('/facilities')) data = [
      { facilityId: 1, facilityName: 'Sân Pickleball', sportId: 1, status: 'AVAILABLE' },
      { facilityId: 2, facilityName: 'Sân Tennis', sportId: 2, status: 'AVAILABLE' },
    ];
    else if (path.endsWith('/users')) data = { content: [{ userId: 9, fullName: 'Coach Minh', specialty: 'Pickleball, Tennis' }] };
    else if (path.endsWith('/class-sessions') && route.request().method() === 'POST') {
      submitted = route.request().postDataJSON();
      data = [{ sessionId: 101 }, { sessionId: 102 }];
    }
    await route.fulfill({ json: data });
  });
  await page.goto('/admin/classes/new');
  await expect(page.getByRole('heading', { name: 'Tạo lịch lớp học', exact: true })).toBeVisible();
  await expect(page.locator('a[href="/admin/classes/new"]').first()).toContainText('Tạo lịch lớp học');
  const facility = page.getByLabel(/^Cơ sở/);
  const submit = page.getByRole('button', { name: 'Tạo Lịch Ca Học', exact: true });
  await expect(facility).toBeDisabled();
  await expect(submit).toBeDisabled();
  await page.getByLabel(/^Bộ môn/).selectOption('1');
  await expect(facility).toBeEnabled();
  await expect(facility.locator('option')).toHaveCount(2);
  await facility.selectOption('1');
  await page.getByLabel(/^Bộ môn/).selectOption('2');
  await expect(facility).toHaveValue('');
  await expect(facility.locator('option').last()).toHaveText('Sân Tennis');
  await facility.selectOption('2');
  await page.getByLabel(/^Tên lớp học/).fill('Tennis demo');
  await page.getByLabel(/^Huấn luyện viên/).selectOption('9');
  await page.getByLabel(/^Bắt đầu/).fill('2026-11-21T09:00');
  await page.getByLabel(/^Kết thúc/).fill('2026-11-21T10:00');
  await page.getByLabel(/^Tổng số buổi/).fill('2');
  await expect(submit).toBeDisabled();
  await page.getByPlaceholder('Nhập học phí mỗi buổi').fill('150000');
  await submit.click();
  await expect(page.getByText('Đã tạo 2 buổi học, lặp hàng tuần theo thứ và giờ đã chọn.', { exact: true })).toBeVisible();
  expect(submitted).toMatchObject({ sportId: 2, facilityId: 2, coachId: 9, sessionCount: 2, priceAmount: 150000 });
  await expect(submit).toBeDisabled();
});
