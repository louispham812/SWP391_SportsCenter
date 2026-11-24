import { membershipDaysRemaining } from '../../utils/memberMemberships';

const formatDate = (value) => value
  ? new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN') : '—';

export default function ActiveMemberPackages({ memberships, onRenew }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3" aria-label="Hạng hội viên đang dùng">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-900 text-sm">Hạng hội viên đang dùng</h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{memberships.length} hạng</span>
      </div>
      {memberships.length ? memberships.map((membership) => {
        const days = membershipDaysRemaining(membership.endDate);
        return (
          <div key={membership.membershipId} className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <strong className="text-base font-bold text-slate-900">{membership.packageName}</strong>
              <p className="mt-1 text-sm text-slate-600">Hiệu lực: {formatDate(membership.startDate)} – {formatDate(membership.endDate)}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${days > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{days === 0 ? 'Hết hạn hôm nay' : `Còn ${days} ngày`}</span>
              {onRenew && <button type="button" onClick={() => onRenew(membership)} className="rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-50">Gia hạn gói này</button>}
            </div>
          </div>
        );
      }) : <p className="py-2 text-xs text-slate-500">Chưa có hạng hội viên đang hoạt động.</p>}
    </section>
  );
}
