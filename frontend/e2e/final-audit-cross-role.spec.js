import { test, expect } from '@playwright/test';

test.describe('Final Audit Cross-Role Live Data Synchronization', () => {

  test('1. POS Sale & Live Revenue Sync between Receptionist Shift & Admin Dashboard', async ({ page, request }) => {
    // Check initial revenue via API
    const loginRes = await request.post('http://localhost:8080/api/v1/auth/login', {
      data: { email: 'manager@sporthub.com', password: 'SportHub@123' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const today = new Date().toISOString().slice(0, 10);

    const reportResBefore = await request.get(`http://localhost:8080/api/v1/receptionist/report?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(reportResBefore.ok()).toBeTruthy();
    const beforeData = await reportResBefore.json();
    const beforeRevenue = Number(beforeData.totalRevenue || 0);

    // Make POS sale via API
    const saleRes = await request.post('http://localhost:8080/api/v1/receptionist/membership-sales', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        memberId: 9,
        packageId: 2, // Gói 1,500,000 VND
        paymentMethod: 'CASH',
      },
    });
    expect(saleRes.ok()).toBeTruthy();
    const saleData = await saleRes.json();
    expect(saleData.paymentStatus).toBe('COMPLETED');
    expect(Number(saleData.amount)).toBe(1500000);

    // Verify report reflects new revenue immediately
    const reportResAfter = await request.get(`http://localhost:8080/api/v1/receptionist/report?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(reportResAfter.ok()).toBeTruthy();
    const afterData = await reportResAfter.json();
    const afterRevenue = Number(afterData.totalRevenue || 0);
    expect(afterRevenue).toBe(beforeRevenue + 1500000);
  });

  test('2. Workout Plan Exercise Completion Sync between Member and Coach', async ({ request }) => {
    const loginRes = await request.post('http://localhost:8080/api/v1/auth/login', {
      data: { email: 'manager@sporthub.com', password: 'SportHub@123' },
    });
    const { token } = await loginRes.json();

    // Toggle exercise index 0 on plan 3
    const toggleRes = await request.patch('http://localhost:8080/api/v1/workout-progress/plans/3/toggle-exercise?exerciseIndex=0', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(toggleRes.ok()).toBeTruthy();
    const toggleData = await toggleRes.json();
    expect(toggleData.planId).toBe(3);
    expect(toggleData.exercises[0]).toBeDefined();

    // Verify Coach member view reflects this completion
    const coachViewRes = await request.get('http://localhost:8080/api/v1/workout-progress/member/10', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(coachViewRes.ok()).toBeTruthy();
    const coachViewData = await coachViewRes.json();
    const plan = coachViewData.plans.find((p) => p.planId === 3);
    expect(plan).toBeDefined();
    const exercises = JSON.parse(plan.exercisesJson);
    expect(exercises[0].completed).toBe(toggleData.completed);
  });

  test('3. Facility and Public Facility 100% Status Sync', async ({ request }) => {
    const loginRes = await request.post('http://localhost:8080/api/v1/auth/login', {
      data: { email: 'manager@sporthub.com', password: 'SportHub@123' },
    });
    const { token } = await loginRes.json();

    // 1. Toggle facility 18 (Hồ Bơi Làn S1) to MAINTENANCE
    const maintRes = await request.patch('http://localhost:8080/api/v1/manager/facilities/18/status', {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'MAINTENANCE' },
    });
    expect(maintRes.ok()).toBeTruthy();

    // Verify public facility 30 (Hồ Bơi Làn S1) is now inactive
    const pubRes = await request.get('http://localhost:8080/api/v1/public/content/facilities');
    expect(pubRes.ok()).toBeTruthy();
    const pubFacilities = await pubRes.json();
    const swim1 = pubFacilities.find((f) => f.facilityId === 30 || f.slug === 'booking-swimming-01');
    expect(swim1).toBeDefined();
    expect(swim1.active).toBe(false);

    // 2. Restore facility 18 to AVAILABLE
    const availRes = await request.patch('http://localhost:8080/api/v1/manager/facilities/18/status', {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'AVAILABLE' },
    });
    expect(availRes.ok()).toBeTruthy();

    // Verify public facility 30 is restored to active
    const pubResRestored = await request.get('http://localhost:8080/api/v1/public/content/facilities');
    const pubRestored = await pubResRestored.json();
    const swim1Restored = pubRestored.find((f) => f.facilityId === 30 || f.slug === 'booking-swimming-01');
    expect(swim1Restored.active).toBe(true);
  });

});
