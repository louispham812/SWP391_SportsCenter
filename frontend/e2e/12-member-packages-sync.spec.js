import { test, expect } from '@playwright/test';

test('profile and packages show the same effective memberships despite stale digital-card data', async ({ page }) => {
  const date = (offset) => {
    const value = new Date();
    value.setDate(value.getDate() + offset);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  };
  const memberships = [
    { membershipId: 1, packageId: 11, packageName: 'Gói Pickleball', status: 'ACTIVE', startDate: date(-1), endDate: date(10) },
    { membershipId: 2, packageId: 12, packageName: 'Gói PT Tennis', status: 'ACTIVE', startDate: date(-1), endDate: date(20) },
    { membershipId: 3, packageName: 'Gói đã hết hạn', status: 'ACTIVE', startDate: date(-10), endDate: date(-1) },
    { membershipId: 4, packageName: 'Gói chưa bắt đầu', status: 'ACTIVE', startDate: date(1), endDate: date(30) },
  ];
  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'membership-ui-test', role: 'member', user: { id: 9, name: 'Hội viên', role: 'MEMBER' },
  })));
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body = [];
    if (path.endsWith('/memberships')) body = memberships;
    else if (path.endsWith('/digital-card')) body = { activePackages: [{ membershipId: 999, packageName: 'Gói cũ trên thẻ' }] };
    else if (path.endsWith('/members/me') || path.endsWith('/health')) body = { fullName: 'Hội viên' };
    else if (path.endsWith('/packages')) body = memberships.slice(0, 2).map((m) => ({ packageId: m.packageId, name: m.packageName, price: 1000000, durationDays: 30 }));
    await route.fulfill({ json: body });
  });
  for (const url of ['/member/profile', '/member/packages']) {
    await page.goto(url);
    const list = page.getByRole('region', { name: 'Hạng hội viên đang dùng', exact: true });
    await expect(list.getByText('2 hạng', { exact: true })).toBeVisible();
    await expect(list.getByText('Gói Pickleball', { exact: true })).toBeVisible();
    await expect(list.getByText('Gói PT Tennis', { exact: true })).toBeVisible();
    await expect(list.getByText('Còn 10 ngày', { exact: true })).toBeVisible();
    await expect(list.getByText(/Gói đã hết hạn|Gói chưa bắt đầu|Gói cũ trên thẻ/)).toHaveCount(0);
  }
  const list = page.getByRole('region', { name: 'Hạng hội viên đang dùng', exact: true });
  await list.getByRole('button', { name: 'Gia hạn gói này', exact: true }).nth(1).click();
  await expect(page.getByRole('heading', { name: 'Xác Nhận Gia Hạn Gói Tập', exact: true })).toBeVisible();
  await expect(page.locator('.fixed').filter({ has: page.getByRole('heading', { name: 'Xác Nhận Gia Hạn Gói Tập', exact: true }) }).getByText('Gói PT Tennis', { exact: true })).toBeVisible();
});
