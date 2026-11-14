import { test, expect } from '@playwright/test';

test('class voucher uses the quoted amount and is sent to checkout', async ({ page }) => {
  const startTime = new Date(Date.now() + 86400000).toISOString();
  const endTime = new Date(Date.now() + 90000000).toISOString();
  const session = { sessionId: 42, className: 'Voucher regression class', sportId: 1,
    priceAmount: 200000, maxSlots: 10, bookedSlots: 0, status: 'OPEN', startTime, endTime };
  let validation;
  let checkout;
  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'mock-token', role: 'member', user: { id: 9, name: 'Voucher Test', avatar: 'VT' },
  })));
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let json = [];
    if (path.endsWith('/public/content/sports')) json = [{ sportId: 1, name: 'Yoga', slug: 'yoga' }];
    else if (path.endsWith('/members/me/quota')) json = { remainingQuota: 0, canUseForBooking: false };
    else if (path.endsWith('/booking-flow/classes')) json = [session];
    else if (path.endsWith('/booking-flow/quote')) json = { originalAmount: 200000, discountAmount: 20000, amount: 180000 };
    else if (path.endsWith('/vouchers/validate')) {
      validation = route.request().postDataJSON();
      // A capped percentage discount deliberately differs from naive client calculation.
      json = { valid: true, discountAmount: 15000, finalAmount: 165000,
        voucher: { code: 'WELCOME20', discountType: 'PERCENT', discountValue: 20 } };
    } else if (path.endsWith('/booking-flow/checkout')) {
      checkout = route.request().postDataJSON();
      json = { paymentStatus: 'PENDING', paymentId: 77, referenceCode: 'TEST-77' };
    }
    await route.fulfill({ json });
  });
  await page.goto('/member/classes');
  await page.getByRole('button', { name: 'Đăng ký lớp học ngay' }).click();
  await page.getByPlaceholder('Nhập mã (ví dụ: WELCOME20, SUMMER50K)').fill('WELCOME20');
  await page.getByRole('button', { name: 'Áp Dụng', exact: true }).click();
  await expect(page.getByText('Voucher ưu đãi (WELCOME20):')).toBeVisible();
  expect(validation).toEqual({ code: 'WELCOME20', amount: 180000, appliesTo: 'BOOKING_ONLY' });
  await expect(page.getByText('selectedSession is not defined')).toHaveCount(0);
  await page.getByRole('button', { name: /Thanh toán tại quầy/ }).click();
  const submit = page.getByRole('button', { name: /Giữ Chỗ.*165/ });
  await expect(submit).toBeVisible();
  await submit.click();
  await expect.poll(() => checkout).toMatchObject({ bookingType: 'CLASS', itemId: 42,
    paymentMethod: 'CASH_COUNTER', useQuota: false, voucherCode: 'WELCOME20' });
});
