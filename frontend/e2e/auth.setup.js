import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { logoutMember } from './helpers.js';

test('register a database-backed member and keep the session after refresh', async ({ page }) => {
  const testDataPath = path.join(import.meta.dirname, '.member-test-data.json');
  let member;
  if (fs.existsSync(testDataPath)) {
    member = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    await page.goto('/login');
    await page.getByPlaceholder('name@example.com / 0912...').fill(member.email);
    await page.getByPlaceholder('••••••••').fill(member.password);
    await page.getByRole('button', { name: 'ĐĂNG NHẬP NGAY' }).click();
  } else {
    const uniqueId = randomUUID();
    member = {
      name: `E2E Hội viên ${uniqueId.slice(0, 8)}`,
      email: `sports-e2e-${uniqueId}@example.test`,
      phone: `09${String(Date.now()).slice(-8)}`,
      password: `Test!${uniqueId}`,
    };
    await page.goto('/register');
    await page.locator('#register-role').selectOption('MEMBER');
    await page.getByPlaceholder('Nguyễn Văn A').fill(member.name);
    await page.getByPlaceholder('0912 345 678').fill(member.phone);
    await page.getByPlaceholder('name@example.com').fill(member.email);
    await page.getByPlaceholder('••••••••').fill(member.password);
    await page.getByRole('button', { name: 'ĐĂNG KÝ TÀI KHOẢN NGAY' }).click();
  }

  await expect(page).toHaveURL(/\/member$/);
  await expect(page.getByRole('heading', { name: new RegExp(member.name, 'i') })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: new RegExp(member.name, 'i') })).toBeVisible();

  const session = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sports-center-auth-session') || '{}'));
  const userId = session.user?.id || member.userId || '9';
  fs.writeFileSync(testDataPath, JSON.stringify({ ...member, userId }, null, 2));
  await logoutMember(page);
});
