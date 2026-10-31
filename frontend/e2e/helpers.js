import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';

const testDataPath = path.join(import.meta.dirname, '.member-test-data.json');
const apiBaseUrl = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:8080/api/v1';

export function readMemberTestData() {
  return JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
}

export async function loginMember(page) {
  const { email, password, name } = readMemberTestData();
  await page.goto('/login');
  await page.getByPlaceholder('name@example.com / 0912...').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'ĐĂNG NHẬP NGAY' }).click();
  await expect(page).toHaveURL(/\/member$/);
  await expect(page.getByRole('heading', { name: new RegExp(name, 'i') })).toBeVisible();
}

export async function loginManager(page) {
  await page.goto('/login');
  await page.getByPlaceholder('name@example.com / 0912...').fill('manager@sporthub.com');
  await page.getByPlaceholder('••••••••').fill('SportHub@123');
  await page.getByRole('button', { name: 'ĐĂNG NHẬP NGAY' }).click();
  await expect(page).toHaveURL(/\/admin/);
}

export async function loginCoach(page) {
  await page.goto('/login');
  await page.getByPlaceholder('name@example.com / 0912...').fill('coach.minh@sporthub.com');
  await page.getByPlaceholder('••••••••').fill('SportHub@123');
  await page.getByRole('button', { name: 'ĐĂNG NHẬP NGAY' }).click();
  await expect(page).toHaveURL(/\/coach/);
}

export async function loginReceptionist(page) {
  await page.goto('/login');
  await page.getByPlaceholder('name@example.com / 0912...').fill('reception.le@sporthub.com');
  await page.getByPlaceholder('••••••••').fill('SportHub@123');
  await page.getByRole('button', { name: 'ĐĂNG NHẬP NGAY' }).click();
  await expect(page).toHaveURL(/\/receptionist/);
}

export async function logoutMember(page) {
  const token = await page.evaluate(() => {
    const session = JSON.parse(sessionStorage.getItem('sports-center-auth-session') || 'null');
    sessionStorage.clear();
    localStorage.clear();
    return session?.token;
  });
  if (token) {
    await page.request.delete(`${apiBaseUrl}/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}

export { apiBaseUrl };
