import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBookingTypeLabel,
  formatPaymentMethod,
  formatStatusLabel,
  formatVnd,
} from './enumLabels.js';

test('formatPaymentMethod maps backend payment method enums to Vietnamese labels', () => {
  assert.equal(formatPaymentMethod('VNPAY'), 'VNPay');
  assert.equal(formatPaymentMethod('SANDBOX'), 'VNPay');
  assert.equal(formatPaymentMethod('CASH'), 'Tiền mặt tại quầy');
  assert.equal(formatPaymentMethod('CASH_COUNTER'), 'Tiền mặt tại quầy');
  assert.equal(formatPaymentMethod('MEMBERSHIP_QUOTA'), 'Quota gói tập');
  assert.equal(formatPaymentMethod(null), '—');
});

test('formatStatusLabel maps booking, payment, and user statuses to Vietnamese', () => {
  assert.equal(formatStatusLabel('ACTIVE'), 'Hoạt động');
  assert.equal(formatStatusLabel('PENDING_APPROVAL'), 'Chờ duyệt');
  assert.equal(formatStatusLabel('CONFIRMED'), 'Đã xác nhận');
  assert.equal(formatStatusLabel('CANCELLED'), 'Đã hủy');
  assert.equal(formatStatusLabel('REFUNDED'), 'Đã hoàn tiền');
  assert.equal(formatStatusLabel(''), '—');
});

test('formatBookingTypeLabel and formatVnd format types and Vietnamese currency', () => {
  assert.equal(formatBookingTypeLabel('COURT'), 'Đặt sân');
  assert.equal(formatBookingTypeLabel('CLASS'), 'Lớp học');
  assert.equal(formatBookingTypeLabel('PT'), 'Huấn luyện 1-1');
  assert.equal(formatBookingTypeLabel('MEMBERSHIP_PACKAGE'), 'Gói hội viên');
  assert.match(formatVnd(150000), /^150\.000₫$/);
});
