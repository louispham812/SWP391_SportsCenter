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

test('court checkout VNPay cancel -> retry -> success redirects to schedule without slot-taken conflict', async ({ page, baseURL }) => {
  const startTime = new Date(Date.now() + 86400000).toISOString().slice(0, 19);
  const endTime = new Date(Date.now() + 90000000).toISOString().slice(0, 19);
  let attempt = 0;
  let courtConfirmed = false;

  await page.addInitScript(() => sessionStorage.setItem('sports-center-auth-session', JSON.stringify({
    token: 'mock-token', role: 'member', user: { id: 9, name: 'Court Retry', avatar: 'CR' },
  })));

  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/members/me/quota')) {
      return route.fulfill({ json: { remainingQuota: 0, canUseForBooking: false, remainingQuotaCourts: 0, canUseCourtQuota: false } });
    }
    if (path.endsWith('/booking-flow/quote')) {
      if (courtConfirmed) {
        return route.fulfill({ status: 409, json: { message: 'Một hoặc nhiều khung giờ sân đã chọn vừa được người khác đặt.' } });
      }
      return route.fulfill({
        json: {
          bookingType: 'COURT',
          itemId: 1,
          itemName: 'Sân Cầu Lông 01',
          sportName: 'Cầu lông',
          location: 'Nhà thi đấu A',
          startTime,
          endTime,
          amount: 120000,
          originalAmount: 120000,
          discountAmount: 0,
        },
      });
    }
    if (path.endsWith('/booking-flow/checkout')) {
      attempt += 1;
      return route.fulfill({ json: { paymentStatus: 'PENDING', paymentId: attempt === 1 ? 77 : 78 } });
    }
    if (path.endsWith('/payments/generate')) {
      const code = attempt === 1 ? '24' : '00';
      const txnRef = attempt === 1 ? '77_a1' : '78_a2';
      return route.fulfill({ json: { paymentUrl: `https://gateway.example/pay?code=${code}&txn=${txnRef}`, bookingType: 'COURT' } });
    }
    if (path.endsWith('/cancel-unpaid')) {
      return route.fulfill({ json: { paymentId: 77, paymentStatus: 'CANCELLED' } });
    }
    if (path.endsWith('/webhooks/vnpay/return')) {
      courtConfirmed = true;
      return route.fulfill({ json: { success: true, status: 'CONFIRMED', bookingType: 'COURT', paymentId: 78, message: 'Thanh toán thành công.' } });
    }
    if (path.endsWith('/booking-flow/schedule')) {
      return route.fulfill({
        json: courtConfirmed
          ? [{ bookingId: 10, bookingType: 'COURT', title: 'Sân Cầu Lông 01', startTime, endTime, status: 'CONFIRMED', amountPaid: 120000, sportName: 'Cầu lông' }]
          : [],
      });
    }
    return route.fulfill({ json: [] });
  });

  await page.route('https://gateway.example/**', async (route) => {
    const reqUrl = new URL(route.request().url());
    const code = reqUrl.searchParams.get('code');
    const txn = reqUrl.searchParams.get('txn');
    await route.fulfill({
      status: 302,
      headers: { location: `${baseURL}/payment/return?vnp_TxnRef=${txn}&vnp_ResponseCode=${code}&vnp_SecureHash=test` },
      body: '',
    });
  });

  const checkoutUrl = `/member/book/checkout/court/1?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
  await page.goto(checkoutUrl);

  // Attempt 1: click VNPay -> cancel -> returns to checkout page with slot still available
  const payBtn = page.getByRole('button', { name: /Thanh Toán Qua VNPAY —/ });
  await expect(payBtn).toBeEnabled();
  await payBtn.click();
  await expect(page).toHaveURL(`${baseURL}${checkoutUrl}`);
  await expect(page.getByRole('heading', { name: 'Đã hủy thanh toán', exact: true })).toBeVisible();
  await expect(page.getByText('Một hoặc nhiều khung giờ sân đã chọn vừa được người khác đặt.')).toHaveCount(0);

  // Attempt 2: click VNPay again -> pay success -> redirects to schedule, NOT checkout quote conflict
  await expect(payBtn).toBeEnabled();
  await payBtn.click();
  await expect(page).toHaveURL(`${baseURL}/member/schedule`);
  await expect(page.getByRole('heading', { name: 'Thanh toán thành công', exact: true })).toBeVisible();
  await expect(page.getByText('Một hoặc nhiều khung giờ sân đã chọn vừa được người khác đặt.')).toHaveCount(0);
});
