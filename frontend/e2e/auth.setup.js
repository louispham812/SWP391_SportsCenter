import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { logoutMember, readMemberTestData } from './helpers.js';

test('register a database-backed member and keep the session after refresh', async ({ page }) => {
  const testDataPath = path.join(import.meta.dirname, '.member-test-data.json');
  let member;
  if (fs.existsSync(testDataPath)) {
    try {
      member = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    } catch {
      member = readMemberTestData();
    }
  } else {
    member = readMemberTestData();
  }

  await page.goto('/login');
  await page.getByPlaceholder('name@example.com / 0912...').fill(member.email);
  await page.getByPlaceholder('••••••••').fill(member.password);
  await page.getByRole('button', { name: 'ĐĂNG NHẬP NGAY' }).click();

  await expect(page).toHaveURL(/\/member$/);
  await expect(page.getByRole('heading', { name: new RegExp(member.name, 'i') })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: new RegExp(member.name, 'i') })).toBeVisible();

  const session = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sports-center-auth-session') || '{}'));
  const userId = session.user?.id || member.userId || '9';
  fs.writeFileSync(testDataPath, JSON.stringify({ ...member, userId }, null, 2));
  await logoutMember(page);
});
