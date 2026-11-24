const TICKET_CATEGORIES = [
  { value: 'ATTENDANCE_DISPUTE', label: 'Điểm danh sai / Vắng mặt' },
  { value: 'COACH_DISPUTE', label: 'Vấn đề Huấn luyện viên' },
  { value: 'FACILITY_ISSUE', label: 'Cơ sở vật chất / Sân bãi' },
  { value: 'SERVICE_QUALITY', label: 'Chất lượng dịch vụ' },
  { value: 'PAYMENT_ISSUE', label: 'Hóa đơn / Thanh toán' },
  { value: 'BILLING_ISSUE', label: 'Sai sót hóa đơn / Thanh toán' },
  { value: 'OTHER', label: 'Yêu cầu hỗ trợ khác' },
];

export const getCategoryLabel = (category) =>
  TICKET_CATEGORIES.find((c) => c.value === category)?.label || category || 'Khác';

const TICKET_STATUS_META = {
  SUBMITTED: {
    label: 'Chờ tiếp nhận',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  IN_REVIEW: {
    label: 'Đang xử lý',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-600',
  },
  RESOLVED: {
    label: 'Đã giải quyết',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-600',
  },
  REJECTED: {
    label: 'Từ chối',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    dotClass: 'bg-red-600',
  },
};

export const getTicketStatusMeta = (status) =>
  TICKET_STATUS_META[(status || '').toUpperCase()] || {
    label: status || 'Không rõ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  };

const TICKET_SEVERITY_META = {
  URGENT: {
    label: 'Khẩn cấp',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  NORMAL: {
    label: 'Bình thường',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export const getTicketSeverityMeta = (severity) =>
  TICKET_SEVERITY_META[(severity || '').toUpperCase()] || TICKET_SEVERITY_META.NORMAL;

export const formatTicketDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};
