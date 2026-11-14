import { test, expect } from '@playwright/test';

async function setup(page, { heldInitially = false, paid = false, gatewayCancel = false, cancellationFailures = 0 } = {}) {
  let held = heldInitially;
  const state = { cancellations: 0, checkouts: 0 };
  const startTime = new Date(Date.now() + 86400000).toISOString();
  const endTime = new Date(Date.now() + 90000000).toISOString();
  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'mock-token', role: 'member', user: { id: 9, name: 'Back Test', avatar: 'BT' },
  })));
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let json = [];
    if (path.endsWith('/public/content/sports')) json = [{ sportId: 1, name: 'Yoga', slug: 'yoga' }];
    else if (path.endsWith('/members/me/quota')) json = { remainingQuota: 0, canUseForBooking: false };
    else if (path.endsWith('/booking-flow/classes')) json = [{ sessionId: 3, className: 'Back regression class', sportId: 1,
      priceAmount: 160000, maxSlots: 10, bookedSlots: held ? 1 : 0, status: 'SCHEDULED', startTime, endTime,
      memberBookingId: held ? 42 : null, memberBookingStatus: held ? paid ? 'CONFIRMED' : 'BOOKED' : null }];
    else if (path.endsWith('/booking-flow/quote')) json = { originalAmount: 160000, discountAmount: 0, amount: 160000 };
    else if (path.endsWith('/booking-flow/checkout')) {
      held = true; state.checkouts += 1; json = { paymentStatus: 'PENDING', paymentId: 77 };
    } else if (path.endsWith('/payments/generate')) json = { paymentUrl: 'https://gateway.example/unpaid', bookingType: 'CLASS' };
    else if (path.endsWith('/payments/77/cancel-unpaid')) {
      state.cancellations += 1;
      if (state.cancellations <= cancellationFailures) return route.fulfill({ status: 503, json: { message: 'Tạm thời chưa hủy được' } });
      if (!paid) held = false;
      json = { paymentId: 77, paymentStatus: paid ? 'PAID' : 'CANCELLED' };
    } else if (path.endsWith('/webhooks/vnpay/return')) {
      json = { success: false, status: 'ERROR', message: 'Không thể xác thực kết quả hủy.' };
    } else if (path.endsWith('/booking-flow/schedule/CLASS/42')) {
      held = false; json = { status: 'CANCELLED', message: 'Đã hủy yêu cầu.' };
    } else if (path.endsWith('/booking-flow/schedule')) json = held ? [{ bookingId: 42, bookingType: 'CLASS',
      title: 'Back regression class', startTime, endTime, status: 'BOOKED', amountPaid: 160000, sportName: 'Yoga' }] : [];
    await route.fulfill({ json });
  });
  await page.route('https://gateway.example/**', (route) => {
    const returnUrl = new URL('/payment/return?vnp_TxnRef=77_attempt&vnp_ResponseCode=24', page.url()).href;
    return route.fulfill({ contentType: 'text/html; charset=utf-8', body: gatewayCancel
      ? `<button onclick="document.getElementById('confirm').hidden=false">Quay lại</button><button id="confirm" hidden onclick="window.location.href='${returnUrl}'">Xác nhận hủy</button>`
      : '<h1>Gateway: no payment made</h1>' });
  });
  return state;
}

test('browser Back releases an unpaid hold and the same class can be registered again', async ({ page, baseURL }) => {
  const state = await setup(page);
  await page.goto('/member/classes');
  await page.getByRole('button', { name: 'Đăng ký lớp học ngay' }).click();
  await page.getByRole('button', { name: /Thanh Toán Qua VNPAY —/ }).click();
  await expect(page).toHaveURL('https://gateway.example/unpaid');
  await page.goBack();
  await expect(page).toHaveURL(`${baseURL}/member/classes`);
  await expect(page.getByRole('button', { name: 'Đăng ký lớp học ngay' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đã hủy thanh toán', exact: true })).toBeVisible();
  expect(state.cancellations).toBe(1);
  await page.getByRole('button', { name: 'Đăng ký lớp học ngay' }).click();
  await page.getByRole('button', { name: /Thanh Toán Qua VNPAY —/ }).click();
  await expect(page).toHaveURL('https://gateway.example/unpaid');
  expect(state.checkouts).toBe(2);
});

test('Back preserves a payment already confirmed by the gateway', async ({ page }) => {
  const state = await setup(page, { paid: true });
  await page.goto('/member/classes');
  await page.getByRole('button', { name: 'Đăng ký lớp học ngay' }).click();
  await page.getByRole('button', { name: /Thanh Toán Qua VNPAY —/ }).click();
  await expect(page).toHaveURL('https://gateway.example/unpaid');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Thanh toán đã được ghi nhận', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy đăng ký lớp này' })).toBeVisible();
  expect(state.cancellations).toBe(1);
});

test('unpaid class cancellation offers no refund and immediately restores registration', async ({ page }) => {
  await setup(page, { heldInitially: true });
  await page.goto('/member/classes');
  await page.getByRole('button', { name: 'Hủy yêu cầu', exact: true }).click();
  const modal = page.getByRole('heading', { name: 'Hủy Yêu Cầu Giữ Chỗ' }).locator('../..');
  await expect(modal.getByText(/hoàn tiền/i)).toHaveCount(0);
  await modal.getByRole('button', { name: 'Xác Nhận Hủy Yêu Cầu' }).click();
  await expect(page.getByRole('button', { name: 'Đăng ký lớp học ngay' })).toBeVisible();
});

test('unpaid schedule entry with a positive quoted fee still offers only cancellation', async ({ page }) => {
  await setup(page, { heldInitially: true });
  await page.goto('/member/schedule');
  await page.getByRole('button', { name: 'Hủy yêu cầu', exact: true }).first().click();
  const modal = page.getByRole('heading', { name: 'Hủy Yêu Cầu Giữ Chỗ?' }).locator('../..');
  await expect(modal.getByText(/hoàn tiền|hoàn 100%/i)).toHaveCount(0);
  await expect(modal.getByRole('button', { name: 'Xác Nhận Hủy Yêu Cầu' })).toBeVisible();
});

test('restored browser pages release holds on the pageshow event too', async ({ page }) => {
  const state = await setup(page, { heldInitially: true });
  await page.goto('/member/classes');
  await expect(page.getByRole('button', { name: 'Hủy yêu cầu', exact: true })).toBeVisible();
  await page.evaluate(() => {
    sessionStorage.setItem('sports-center-active-payment', JSON.stringify({ paymentId: 77 }));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect(page.getByRole('button', { name: 'Đăng ký lớp học ngay' })).toBeVisible();
  expect(state.cancellations).toBe(1);
});

test('gateway Back then Confirm cancellation restores the orange registration button', async ({ page, baseURL }) => {
  const state = await setup(page, { gatewayCancel: true });
  await page.goto('/member/classes');
  await page.getByRole('button', { name: 'Đăng ký lớp học ngay' }).click();
  await page.getByRole('button', { name: /Thanh Toán Qua VNPAY —/ }).click();
  await expect(page).toHaveURL('https://gateway.example/unpaid');
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/member/classes`);
  await expect(page.getByRole('button', { name: 'Đăng ký lớp học ngay' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy yêu cầu', exact: true })).toHaveCount(0);
  expect(state.cancellations).toBe(1);
});

test('gateway cancel failure keeps the cancellation context and offers retry', async ({ page }) => {
  const state = await setup(page, { gatewayCancel: true, cancellationFailures: 1 });
  await page.goto('/member/classes');
  await page.getByRole('button', { name: 'Đăng ký lớp học ngay' }).click();
  await page.getByRole('button', { name: /Thanh Toán Qua VNPAY —/ }).click();
  await expect(page).toHaveURL('https://gateway.example/unpaid');
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
  await page.getByRole('button', { name: 'Thử hủy lại', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đăng ký lớp học ngay' })).toBeVisible();
  expect(state.cancellations).toBe(2);
});

test('gateway Cancel cannot remove an order already confirmed as paid', async ({ page }) => {
  await setup(page, { gatewayCancel: true, paid: true });
  await page.goto('/member/classes');
  await page.getByRole('button', { name: 'Đăng ký lớp học ngay' }).click();
  await page.getByRole('button', { name: /Thanh Toán Qua VNPAY —/ }).click();
  await expect(page).toHaveURL('https://gateway.example/unpaid');
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hủy đăng ký lớp này' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Thanh toán thành công', exact: true })).toBeVisible();
});
