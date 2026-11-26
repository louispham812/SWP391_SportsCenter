const PAYMENT_METHOD_LABELS = {
  VNPAY: 'VNPay',
  SANDBOX: 'VNPay',
  CASH: 'Tiền mặt tại quầy',
  CASH_COUNTER: 'Tiền mặt tại quầy',
  TRANSFER: 'Chuyển khoản',
  ONLINE: 'Trực tuyến',
  MEMBERSHIP_QUOTA: 'Quota gói tập',
};

const STATUS_LABELS = {
  ACTIVE: 'Hoạt động',
  PENDING: 'Chờ xử lý',
  PENDING_APPROVAL: 'Chờ duyệt',
  PENDING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  BOOKED: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
  LOCKED: 'Đã khóa',
  INACTIVE: 'Ngưng hoạt động',
  EXPIRED: 'Hết hạn',
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang diễn ra',
};

const BOOKING_TYPE_LABELS = {
  COURT: 'Đặt sân',
  CLASS: 'Lớp học',
  PT: 'Huấn luyện 1-1',
  MEMBERSHIP_PACKAGE: 'Gói hội viên',
  MEMBERSHIP: 'Gói hội viên',
};

export const formatPaymentMethod = (method) => {
  if (!method) return '—';
  const key = String(method).trim().toUpperCase();
  return PAYMENT_METHOD_LABELS[key] || method;
};

export const formatStatusLabel = (status) => {
  if (!status) return '—';
  const key = String(status).trim().toUpperCase();
  return STATUS_LABELS[key] || status;
};

export const formatBookingTypeLabel = (type) => {
  if (!type) return 'Dịch vụ';
  const key = String(type).trim().toUpperCase();
  return BOOKING_TYPE_LABELS[key] || type;
};

export const formatVnd = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')}₫`;
