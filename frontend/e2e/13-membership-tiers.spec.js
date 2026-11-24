import { test, expect } from '@playwright/test';

const tiers = [
  { packageId: 10, membershipTier: 'SILVER', name: 'Hạng Bạc', price: 800000, quotaSessions: 10, quotaCourts: 5, accessType: 'OFF_PEAK' },
  { packageId: 11, membershipTier: 'GOLD', name: 'Hạng Vàng', price: 1500000, quotaSessions: 20, quotaCourts: 10, accessType: 'ALL_DAY' },
  { packageId: 12, membershipTier: 'DIAMOND', name: 'Hạng Kim Cương', price: 2800000, quotaSessions: 30, quotaCourts: 15, accessType: 'ALL_DAY' },
].map((tier) => ({ ...tier, durationDays: 30, status: 'ACTIVE', description: 'Quyền lợi theo hạng hội viên' }));

test('member catalog shows three tiers with actual session and court entitlements', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'tier-ui-test', role: 'member', user: { id: 9, name: 'Hội viên', role: 'MEMBER' },
  })));
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({ json: path.endsWith('/packages') ? tiers : [] });
  });
  await page.goto('/member/packages');
  await expect(page.getByRole('heading', { name: 'Hạng hội viên & quyền lợi', exact: true })).toBeVisible();
  for (const tier of tiers) {
    await expect(page.getByRole('heading', { name: tier.name, exact: true })).toBeVisible();
    await expect(page.getByText(`${tier.quotaSessions} buổi lớp học hoặc PT / kỳ`, { exact: true })).toBeVisible();
    await expect(page.getByText(`${tier.quotaCourts} giờ sân / kỳ`, { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Giờ thấp điểm 08:00–16:00', { exact: true })).toBeVisible();
  await expect(page.getByText('Tập luyện không giới hạn các sân tập tiêu chuẩn', { exact: true })).toHaveCount(0);
});

test('manager can create and edit custom membership tier names without fixed dropdown', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'tier-ui-test', role: 'admin', user: { id: 1, name: 'Quản lý', role: 'MANAGER' },
  })));
  const catalog = [...tiers.map((t) => ({ ...t }))];
  let createdPayload;
  let updatedPayload;
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/packages') && route.request().method() === 'POST') {
      createdPayload = route.request().postDataJSON();
      catalog.push({ ...createdPayload, packageId: 13 });
      await route.fulfill({ json: catalog.at(-1) });
    } else if (/\/manager\/packages\/\d+$/.test(path) && route.request().method() === 'PUT') {
      const id = Number(path.split('/').pop());
      updatedPayload = route.request().postDataJSON();
      const idx = catalog.findIndex((item) => item.packageId === id);
      if (idx >= 0) catalog[idx] = { ...catalog[idx], ...updatedPayload };
      await route.fulfill({ json: catalog[idx] });
    } else {
      await route.fulfill({ json: path.endsWith('/packages') ? catalog : [] });
    }
  });
  await page.goto('/admin/packages');
  await expect(page.getByRole('heading', { name: 'Hạng Hội Viên & Quyền Lợi', exact: true })).toBeVisible();
  await expect(page.getByText('Hạng Bạc', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Bảng giá PT lẻ theo Coach/ })).toHaveCount(0);

  // Create custom tier name via free-text input
  await page.getByRole('button', { name: /Thêm hạng hội viên/ }).click();
  await expect(page.locator('#packageTier')).toHaveCount(0);
  const nameInput = page.getByLabel('Tên hạng hội viên', { exact: true });
  await expect(nameInput).toBeVisible();
  await nameInput.fill('   ');
  await page.getByLabel('Giá niêm yết', { exact: true }).fill('3500000');
  await page.getByRole('button', { name: 'Lưu hạng hội viên', exact: true }).click();
  await expect(page.getByText('Tên hạng hội viên là bắt buộc và tối đa 100 ký tự.', { exact: true })).toBeVisible();
  expect(createdPayload).toBeUndefined();

  await nameInput.fill('Hạng Bạch Kim');
  await page.getByLabel('Số buổi tập', { exact: true }).fill('25');
  await page.getByLabel('Số giờ sân', { exact: true }).fill('12');
  await page.getByRole('button', { name: 'Lưu hạng hội viên', exact: true }).click();
  await expect(page.getByText('Hạng Bạch Kim', { exact: true })).toBeVisible();
  expect(createdPayload).toMatchObject({
    membershipTier: 'Hạng Bạch Kim',
    name: 'Hạng Bạch Kim',
    price: 3500000,
    durationDays: 30,
    quotaSessions: 25,
    quotaCourts: 12,
    accessType: 'ALL_DAY',
  });

  // Edit existing tier name freely
  await page.locator('tr', { has: page.getByText('Hạng Bạc', { exact: true }) }).getByRole('button', { name: 'Sửa', exact: true }).click();
  await expect(nameInput).toHaveValue('Hạng Bạc');
  await nameInput.fill('Hạng Bạc VIP');
  await page.getByRole('button', { name: 'Lưu hạng hội viên', exact: true }).click();
  await expect(page.getByText('Hạng Bạc VIP', { exact: true })).toBeVisible();
  expect(updatedPayload).toMatchObject({ membershipTier: 'SILVER', name: 'Hạng Bạc VIP' });
});

test('member catalog allows registering custom tier even when holding a preset tier', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'tier-ui-test', role: 'member', user: { id: 9, name: 'Hội viên', role: 'MEMBER' },
  })));
  const customCatalog = [
    ...tiers,
    { packageId: 13, membershipTier: 'Hạng Bạch Kim', name: 'Hạng Bạch Kim', price: 3500000, quotaSessions: 25, quotaCourts: 12, accessType: 'ALL_DAY', durationDays: 30, status: 'ACTIVE', description: 'Hạng tùy chỉnh' },
  ];
  const today = new Date();
  const fmt = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/packages')) await route.fulfill({ json: customCatalog });
    else if (path.endsWith('/memberships')) await route.fulfill({ json: [{ membershipId: 1, packageId: 11, packageName: 'Hạng Vàng', membershipTier: 'GOLD', status: 'ACTIVE', startDate: fmt(-1), endDate: fmt(20) }] });
    else await route.fulfill({ json: [] });
  });
  await page.goto('/member/packages');
  await expect(page.getByRole('heading', { name: 'Hạng Bạch Kim', exact: true })).toBeVisible();
  const customCard = page.locator('div.rounded-2xl', { has: page.getByRole('heading', { name: 'Hạng Bạch Kim', exact: true }) });
  await expect(customCard.getByRole('button', { name: 'Đăng ký hạng này', exact: true })).toBeEnabled();
});
