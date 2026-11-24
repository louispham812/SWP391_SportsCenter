const statusGroups = [
  {
    key: 'completed',
    label: 'Hoàn tất',
    color: 'bg-emerald-50 text-emerald-700',
    values: ['HOÀN TẤT', 'COMPLETED', 'PAID', 'SUCCESS'],
  },
  {
    key: 'pending',
    label: 'Chờ thanh toán',
    color: 'bg-amber-50 text-amber-700',
    values: ['CHỜ THANH TOÁN', 'PENDING', 'PENDING_PAYMENT', 'WAITING'],
  },
  {
    key: 'failed',
    label: 'Thất bại',
    color: 'bg-red-50 text-red-700',
    values: ['THẤT BẠI', 'FAILED', 'ERROR', 'REJECTED'],
  },
  {
    key: 'cancelled',
    label: 'Đã hủy',
    color: 'bg-slate-100 text-slate-600',
    values: ['ĐÃ HỦY', 'CANCELLED', 'CANCELED'],
  },
  {
    key: 'refunded',
    label: 'Đã hoàn tiền',
    color: 'bg-violet-50 text-violet-700',
    values: ['ĐÃ HOÀN TIỀN', 'REFUNDED'],
  },
];

export function getPaymentStatus(value) {
  return (
    statusGroups.find((status) =>
      status.values.includes(
        String(value || '')
          .trim()
          .toUpperCase(),
      ),
    ) || {
      key: 'other',
      label: value || 'Chưa xác định',
      color: 'bg-slate-100 text-slate-600',
    }
  );
}

export function paymentCategory(value) {
  const type = String(value || '').toUpperCase();
  if (/MEMBERSHIP|GÓI|PKG/.test(type)) return 'Gói hội viên';
  if (/COURT|SÂN/.test(type)) return 'Đặt sân';
  if (/CLASS|LỚP|(^|_)PT($|_)/.test(type)) return 'Lớp học & huấn luyện';
  if (/EQUIP|DỤNG CỤ/.test(type)) return 'Thuê dụng cụ';
  if (/POS/.test(type)) return 'Dịch vụ tại quầy';
  return 'Dịch vụ khác';
}

export function getRevenueBreakdown(payments, totalRevenue) {
  const groups = new Map();
  for (const payment of payments) {
    if (getPaymentStatus(payment.status).key !== 'completed') continue;
    const category = paymentCategory(payment.type);
    const group = groups.get(category) || { category, amount: 0, count: 0 };
    group.amount += Number(payment.amount) || 0;
    group.count += 1;
    groups.set(category, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      percent: Number(totalRevenue) > 0 ? Math.round((group.amount / Number(totalRevenue)) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}
