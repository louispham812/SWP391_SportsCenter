import { test, expect } from '@playwright/test';

// ===== 12-member-packages-sync.spec.js =====
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

test('portal layout exposes skip link, aria-current, unread count, and accent-insensitive command palette', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'member-ui-test',
    role: 'member',
    user: { id: 9, name: 'Nguyễn Anh Khoa', email: 'khoa@sporthub.com', role: 'MEMBER' },
  })));

  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/notifications')) {
      return route.fulfill({
        json: [
          { notificationId: 1, title: 'Thông báo 1', message: 'Nội dung 1', isRead: false, createdAt: '2026-11-26T08:00:00' },
          { notificationId: 2, title: 'Thông báo 2', message: 'Nội dung 2', isRead: false, createdAt: '2026-11-26T09:00:00' },
        ],
      });
    }
    if (path.endsWith('/members/me')) {
      return route.fulfill({ json: { userId: 9, fullName: 'Nguyễn Anh Khoa', email: 'khoa@sporthub.com' } });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto('/member');
  await expect(page.locator('main#main-content')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('a[href="#main-content"]')).toHaveCount(1);
  await expect(page.locator('aside nav a[aria-current="page"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Thông báo \(2 chưa đọc\)/ })).toBeVisible();

  await page.getByRole('button', { name: 'Mở tìm kiếm nhanh trang chức năng' }).click();
  const paletteDialog = page.getByRole('dialog', { name: 'Tìm nhanh trang chức năng' });
  await expect(paletteDialog).toBeVisible();

  const paletteInput = paletteDialog.locator('input');
  await paletteInput.fill('thoi khoa bieu');
  await expect(paletteDialog.getByText(/Thời khóa biểu/i).first()).toBeVisible();
  await paletteInput.press('Enter');
  await expect(page).toHaveURL(/\/member\/schedule/);
});

test('member AI assistant supports Shift+Enter/retry and transactions filter PT with Escape-closable receipt modal', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'member-ui-test',
    role: 'member',
    user: { id: 9, name: 'Nguyễn Anh Khoa', email: 'khoa@sporthub.com', role: 'MEMBER' },
  })));

  let aiCalls = 0;
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/notifications')) return route.fulfill({ json: [] });
    if (path.endsWith('/members/me/health')) {
      return route.fulfill({ json: { fitnessLevel: 'INTERMEDIATE', fitnessGoal: 'Tăng sức bền' } });
    }
    if (path.endsWith('/booking-flow/schedule')) return route.fulfill({ json: [] });
    if (path.endsWith('/workouts/my-progress')) return route.fulfill({ json: { plans: [], bodyLogs: [] } });
    if (path.endsWith('/ai/chat') && route.request().method() === 'POST') {
      aiCalls += 1;
      if (aiCalls === 1) {
        return route.fulfill({ status: 500, json: { message: 'AI đang bận' } });
      }
      return route.fulfill({ json: { answer: 'Gợi ý bài tập phục hồi.' } });
    }
    if (path.endsWith('/members/me')) {
      return route.fulfill({ json: { userId: 9, fullName: 'Nguyễn Anh Khoa', phone: '0934567890' } });
    }
    if (path.endsWith('/members/me/transactions')) {
      return route.fulfill({
        json: [
          {
            id: 501,
            paymentId: 501,
            itemType: 'PT',
            itemName: 'Thuê HLV Trần Văn Minh',
            amount: 450000,
            paymentMethod: 'VNPAY',
            paymentStatus: 'PAID',
            createdAt: '2026-11-26T09:00:00',
            referenceCode: 'PT-501',
          },
          {
            id: 502,
            paymentId: 502,
            itemType: 'CLASS',
            itemName: 'Lớp Yoga Buổi Sáng',
            amount: 150000,
            paymentMethod: 'CASH_COUNTER',
            paymentStatus: 'PAID',
            createdAt: '2026-11-25T09:00:00',
            referenceCode: 'CLS-502',
          },
        ],
      });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto('/member/ai-assistant');
  const chatInput = page.getByPlaceholder('Nhập câu hỏi của bạn cho AI Coach (Enter để gửi, Shift+Enter xuống dòng)...');
  await chatInput.fill('Lịch tập');
  await chatInput.press('Shift+Enter');
  await chatInput.type('tuần này');
  await expect(chatInput).toHaveValue('Lịch tập\ntuần này');
  expect(aiCalls).toBe(0);

  await chatInput.press('Enter');
  await expect(page.getByRole('button', { name: 'Thử gửi lại' })).toBeVisible();
  await page.getByRole('button', { name: 'Thử gửi lại' }).click();
  await expect(page.getByText('Gợi ý bài tập phục hồi.')).toBeVisible();

  await page.goto('/member/transactions');
  await expect(page.getByText('Thuê HLV Trần Văn Minh')).toBeVisible();
  await expect(page.getByText('Lớp Yoga Buổi Sáng')).toBeVisible();

  await page.getByRole('button', { name: 'HLV Riêng' }).click();
  await expect(page.getByText('Thuê HLV Trần Văn Minh')).toBeVisible();
  await expect(page.getByText('Lớp Yoga Buổi Sáng')).toHaveCount(0);

  await page.getByRole('button', { name: 'Tất cả' }).click();
  const txSearch = page.getByPlaceholder('Tìm mã giao dịch, dịch vụ...');
  await txSearch.fill('yoga');
  await expect(page.getByText('Lớp Yoga Buổi Sáng')).toBeVisible();
  await expect(page.getByText('Thuê HLV Trần Văn Minh')).toHaveCount(0);
  await txSearch.fill('');

  await page.getByRole('button', { name: 'Xem biên lai' }).first().click();
  const receiptDialog = page.locator('dialog[open]');
  await expect(receiptDialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

// ===== 13-membership-tiers.spec.js =====
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

