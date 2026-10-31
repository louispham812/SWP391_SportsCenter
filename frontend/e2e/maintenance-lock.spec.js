import { test, expect } from '@playwright/test';
import { apiBaseUrl, loginManager, loginMember, logoutMember } from './helpers.js';

test('manager schedules maintenance to lock court, blocks member booking, and unlocking restores court', async ({ page }) => {
  // 1. Login Manager
  await loginManager(page);
  const session = await page.evaluate(() => JSON.parse(
    sessionStorage.getItem('sports-center-auth-session') || 'null',
  ));
  expect(session).toBeTruthy();
  const mgrAuthHeaders = { Authorization: `Bearer ${session.token}` };

  // Clean up any existing maintenance on Court 2 before test starts
  const existingRes = await page.request.get(`${apiBaseUrl}/manager/maintenance`, {
    headers: mgrAuthHeaders,
  });
  if (existingRes.ok()) {
    const existingList = await existingRes.json();
    for (const m of existingList) {
      if (m.courtId === 2) {
        await page.request.delete(`${apiBaseUrl}/manager/maintenance/${m.maintenanceId}`, {
          headers: mgrAuthHeaders,
        });
      }
    }
  }

  // 2. Go to /admin/facilities and switch to maintenance tab
  await page.goto('/admin/facilities');
  await expect(page.getByText('Cơ sở, Sân Bãi & Lịch Bảo Trì')).toBeVisible();

  const maintTab = page.getByRole('button', { name: /construction/i });
  await maintTab.click();

  // Table should show existing maintenance records from DB
  await expect(page.getByText('Danh sách các khung giờ bảo trì sân bãi')).toBeVisible();
  const table = page.locator('table');
  await expect(table).toBeVisible();

  // 3. Create a new maintenance window via API on Court 2 (Pickleball Court 02)
  const today = new Date().toISOString().slice(0, 10);
  const startMaint = `${today}T08:00:00`;
  const endMaint = `${today}T22:00:00`;

  const createRes = await page.request.post(`${apiBaseUrl}/manager/maintenance`, {
    headers: mgrAuthHeaders,
    data: {
      courtId: 2,
      startTime: startMaint,
      endTime: endMaint,
      reason: 'Bảo trì khẩn cấp kiểm thử khoá sân',
    },
  });
  expect(createRes.ok()).toBeTruthy();
  const createdData = await createRes.json();
  const maintId = createdData.maintenance.maintenanceId;
  expect(maintId).toBeTruthy();

  // Reload page to verify persistence across F5
  await page.reload();
  await page.getByRole('button', { name: /construction/i }).click();
  await expect(page.getByText('Pickleball Court 02').first()).toBeVisible();

  // 4. Logout Manager, Login Member
  await logoutMember(page);
  await loginMember(page);

  const memSession = await page.evaluate(() => JSON.parse(
    sessionStorage.getItem('sports-center-auth-session') || 'null',
  ));
  const memAuthHeaders = { Authorization: `Bearer ${memSession.token}` };

  // 5. Member checks slots for Pickleball (sportId=2)
  const slotsRes = await page.request.get(`${apiBaseUrl}/booking-flow/courts?sportId=2`, {
    headers: memAuthHeaders,
  });
  expect(slotsRes.ok()).toBeTruthy();
  const slots = await slotsRes.json();

  // Court 2 should have NO available slots today because of maintenance
  const court2TodaySlots = slots.filter(
    (s) => s.courtId === 2 && s.startTime.startsWith(today),
  );
  expect(court2TodaySlots.length).toBe(0);

  // 6. Member attempts direct quote on Court 2 during maintenance -> MUST BE 409 Conflict
  const quoteRes = await page.request.get(
    `${apiBaseUrl}/booking-flow/quote?bookingType=COURT&itemId=2&startTime=${today}T16:00:00&endTime=${today}T17:00:00`,
    { headers: memAuthHeaders },
  );
  expect(quoteRes.status()).toBe(409);

  // 7. Member attempts direct checkout on Court 2 during maintenance -> MUST BE 409 Conflict
  const checkoutRes = await page.request.post(`${apiBaseUrl}/booking-flow/checkout`, {
    headers: memAuthHeaders,
    data: {
      bookingType: 'COURT',
      itemId: 2,
      startTime: `${today}T16:00:00`,
      endTime: `${today}T17:00:00`,
      paymentMethod: 'VIETQR',
    },
  });
  expect(checkoutRes.status()).toBe(409);

  // 8. Manager unlocks court (re-login manager to delete maintenance)
  await logoutMember(page);
  await loginManager(page);
  const mgrSession2 = await page.evaluate(() => JSON.parse(
    sessionStorage.getItem('sports-center-auth-session') || 'null',
  ));
  const deleteRes = await page.request.delete(`${apiBaseUrl}/manager/maintenance/${maintId}`, {
    headers: { Authorization: `Bearer ${mgrSession2.token}` },
  });
  expect(deleteRes.ok()).toBeTruthy();

  // 9. Check slots again -> Court 2 slots are restored!
  const slotsAfterRes = await page.request.get(`${apiBaseUrl}/booking-flow/courts?sportId=2`);
  expect(slotsAfterRes.ok()).toBeTruthy();
  const slotsAfter = await slotsAfterRes.json();
  console.log('Total slotsAfter:', slotsAfter.length);
  const court2AllSlots = slotsAfter.filter((s) => s.courtId === 2);
  console.log('Total Court 2 slots in 14 days:', court2AllSlots.length);
  const court2TodaySlotsRestored = court2AllSlots.filter((s) => s.startTime.startsWith(today));
  console.log('Court 2 today slots restored:', court2TodaySlotsRestored.length, 'today was:', today);
  expect(court2AllSlots.length).toBeGreaterThan(0);
  expect(court2TodaySlotsRestored.length).toBeGreaterThan(0);
});
