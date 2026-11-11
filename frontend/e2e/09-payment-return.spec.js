import { test, expect } from '@playwright/test';

async function mockMember(page, result, { networkFailure = false } = {}) {
  const session = { sessionId: 42, className: 'Payment return class', sportId: 1,
    priceAmount: 200000, maxSlots: 10, bookedSlots: 0, status: 'OPEN',
    startTime: new Date(Date.now() + 86400000).toISOString(), endTime: new Date(Date.now() + 90000000).toISOString() };
  const verified = [];
  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'mock-token', role: 'member', user: { id: 9, name: 'Payment Test', avatar: 'PT' },
  })));
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let json = [];
    if (path.endsWith('/public/content/sports')) json = [{ sportId: 1, name: 'Yoga', slug: 'yoga' }];
    else if (path.endsWith('/members/me/quota')) json = { remainingQuota: 0, canUseForBooking: false };
    else if (path.endsWith('/booking-flow/classes')) json = [session];
    else if (path.endsWith('/booking-flow/quote')) json = { originalAmount: 200000, discountAmount: 0, amount: 200000 };
    else if (path.endsWith('/booking-flow/checkout')) json = { paymentStatus: 'PENDING', paymentId: 77 };
    else if (path.endsWith('/payments/generate')) json = { paymentUrl: 'https://gateway.example/pay?signed=value', bookingType: 'CLASS' };
    else if (path.endsWith('/cancel-unpaid')) json = { paymentId: 77, paymentStatus: 'CANCELLED' };
    else if (path.endsWith('/webhooks/vnpay/return')) {
      verified.push(route.request().url());
      if (networkFailure) return route.abort();
      json = result;
    }
    await route.fulfill({ json });
  });
  return verified;
}

for (const scenario of [
  { name: 'success', code: '00', result: { success: true, status: 'CONFIRMED', message: 'Buổi học đã được xác nhận.', bookingType: 'CLASS' }, title: 'Thanh toán thành công' },
  { name: 'failure', code: '24', result: { success: false, status: 'FAILED', message: 'Khách hàng hủy giao dịch.' }, title: 'Đã hủy thanh toán' },
]) {
  test(`automatically returns to the initiating page and shows ${scenario.name}`, async ({ page, baseURL }) => {
    const verified = await mockMember(page, scenario.result);
    let gatewayUrl;
    await page.route('https://gateway.example/**', async (route) => {
      gatewayUrl = route.request().url();
      await route.fulfill({ status: 302, headers: { location: `${baseURL}/payment/return?vnp_TxnRef=77_attempt&vnp_ResponseCode=${scenario.code}&vnp_SecureHash=test` }, body: '' });
    });
    await page.goto('/member/classes?source=booking');
    await page.getByRole('button', { name: 'Đăng ký lớp học ngay' }).click();
    const pay = page.getByRole('button', { name: /Thanh Toán Qua VNPAY —/ });
    await expect(pay).toBeEnabled();
    await pay.click();
    await expect(page).toHaveURL(`${baseURL}/member/classes?source=booking`);
    await expect(page.getByRole('heading', { name: scenario.title, exact: true })).toHaveCount(1);
    await expect(page).toHaveURL(`${baseURL}/member/classes?source=booking`);
    await expect(page.getByText((scenario.code === '24' ? 'Chỗ giữ đã được trả lại. Bạn có thể đăng ký lớp lại ngay.' : scenario.result.message), { exact: true })).toBeVisible();
    expect(verified).toHaveLength(scenario.code === '24' ? 0 : 1);
    expect(gatewayUrl).toBe('https://gateway.example/pay?signed=value');
    expect(await page.evaluate(() => sessionStorage.getItem('sports-center-payment-return:77'))).toBeNull();
  });
}

test('connection failure returns to the saved page and warns that payment is unverified', async ({ page, baseURL }) => {
  await mockMember(page, null, { networkFailure: true });
  await page.addInitScript(() => sessionStorage.setItem('sports-center-payment-return:77', '/member/classes?source=retry'));
  await page.goto('/payment/return?vnp_TxnRef=77_attempt&vnp_ResponseCode=00');
  await expect(page).toHaveURL(`${baseURL}/member/classes?source=retry`);
  await expect(page.getByRole('heading', { name: 'Chưa xác minh được thanh toán', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Thanh toán thành công', exact: true })).toHaveCount(0);
});

test('membership payment without saved context returns to packages with approval message', async ({ page, baseURL }) => {
  await mockMember(page, { success: true, status: 'PENDING_APPROVAL', bookingType: 'MEMBERSHIP_PACKAGE', message: 'Đã nhận tiền; gói đang chờ Quản lý duyệt.' });
  await page.goto('/payment/return?vnp_TxnRef=88_attempt&vnp_ResponseCode=00');
  await expect(page).toHaveURL(`${baseURL}/member/packages`);
  await expect(page.getByRole('heading', { name: 'Thanh toán thành công', exact: true })).toHaveCount(1);
  await expect(page.getByText('Đã nhận tiền; gói đang chờ Quản lý duyệt.', { exact: true })).toBeVisible();
});

test('invalid signature cannot show success even when the browser query says success', async ({ page, baseURL }) => {
  await mockMember(page, { success: false, status: 'ERROR', message: 'Chữ ký không hợp lệ.' });
  await page.addInitScript(() => sessionStorage.setItem('sports-center-payment-return:77', '/member/classes'));
  await page.goto('/payment/return?vnp_TxnRef=77_attempt&vnp_ResponseCode=00');
  await expect(page).toHaveURL(`${baseURL}/member/classes`);
  await expect(page.getByRole('heading', { name: 'Thanh toán thất bại', exact: true })).toBeVisible();
});

test('legacy return URL also returns automatically and ignores an external saved destination', async ({ page, baseURL }) => {
  await mockMember(page, { success: false, status: 'FAILED', message: 'Giao dịch chưa thành công.' });
  await page.addInitScript(() => sessionStorage.setItem('sports-center-payment-return:77', 'https://external.example/member/classes'));
  await page.goto('/vnpay-return?vnp_TxnRef=77_attempt&vnp_ResponseCode=24&bookingType=CLASS');
  await expect(page).toHaveURL(`${baseURL}/member/classes`);
  await expect(page.getByRole('heading', { name: 'Đã hủy thanh toán', exact: true })).toBeVisible();
});
