import { useCallback, useEffect, useMemo, useState } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';
import { createMemberTicket, getMemberTickets } from '../../services/memberApi';
import {
  formatTicketDate,
  getCategoryLabel,
  getTicketSeverityMeta,
  getTicketStatusMeta,
} from '../../utils/ticketLabels';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'SUBMITTED', label: 'Chờ tiếp nhận' },
  { key: 'IN_REVIEW', label: 'Đang xử lý' },
  { key: 'RESOLVED', label: 'Đã giải quyết' },
  { key: 'REJECTED', label: 'Từ chối' },
];

const CATEGORY_OPTIONS = [
  { value: 'ATTENDANCE_DISPUTE', label: 'Điểm danh sai / Vắng mặt' },
  { value: 'COACH_DISPUTE', label: 'Vấn đề Huấn luyện viên' },
  { value: 'FACILITY_ISSUE', label: 'Cơ sở vật chất / Sân bãi' },
  { value: 'SERVICE_QUALITY', label: 'Chất lượng dịch vụ' },
  { value: 'PAYMENT_ISSUE', label: 'Hóa đơn / Thanh toán' },
  { value: 'OTHER', label: 'Yêu cầu hỗ trợ khác' },
];

export default function MemberTicketsPage() {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  const [category, setCategory] = useState('SERVICE_QUALITY');
  const [severity, setSeverity] = useState('NORMAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMemberTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Lỗi tải dữ liệu', err?.message || 'Không thể tải danh sách khiếu nại.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const counts = useMemo(() => {
    const pending = tickets.filter((t) => ['SUBMITTED', 'IN_REVIEW'].includes(t.status)).length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
    return { total: tickets.length, pending, resolved };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'ALL') return tickets;
    return tickets.filter((t) => (t.status || '').toUpperCase() === statusFilter);
  }, [tickets, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim().length < 5) {
      showToast('Tiêu đề quá ngắn', 'Tiêu đề khiếu nại cần tối thiểu 5 ký tự.', 'error');
      return;
    }
    if (description.trim().length < 10) {
      showToast('Mô tả quá ngắn', 'Vui lòng mô tả chi tiết tối thiểu 10 ký tự.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createMemberTicket({
        category,
        severity,
        title: title.trim(),
        description: description.trim(),
      });
      setTickets((prev) => [created, ...prev.filter((t) => t.ticketId !== created.ticketId)]);
      setShowModal(false);
      setTitle('');
      setDescription('');
      setCategory('SERVICE_QUALITY');
      setSeverity('NORMAL');
      window.dispatchEvent(new Event('sporthub:notifications-updated'));
      showToast('Gửi khiếu nại thành công', 'Bộ phận CSKH và Quản lý sẽ phản hồi sớm nhất.', 'success');
    } catch (err) {
      showToast('Gửi khiếu nại thất bại', err?.message || 'Không thể gửi khiếu nại lúc này.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Khiếu nại &amp; Hỗ trợ</h1>
            <p className="text-sm text-slate-500 mt-1">
              Gửi phản hồi về điểm danh, sân bãi, hóa đơn hoặc huấn luyện viên và theo dõi kết quả xử lý.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_comment</span>
            <span>Gửi Khiếu Nại Mới</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold text-slate-500 uppercase">Tổng số phiếu</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{counts.total}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-xs font-bold text-amber-800 uppercase">Đang chờ / Đang xử lý</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{counts.pending}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="text-xs font-bold text-emerald-800 uppercase">Đã giải quyết</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{counts.resolved}</p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === f.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={loadTickets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Làm mới</span>
            </button>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">Đang tải danh sách khiếu nại...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">support_agent</span>
                <h3 className="text-sm font-bold text-slate-800">Chưa có phiếu khiếu nại nào</h3>
                <p className="text-xs text-slate-500">
                  Bấm &quot;Gửi Khiếu Nại Mới&quot; nếu bạn cần hỗ trợ hoặc phản ánh vấn đề phát sinh.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => {
                  const statusMeta = getTicketStatusMeta(ticket.status);
                  const sevMeta = getTicketSeverityMeta(ticket.severity);
                  return (
                    <article
                      key={ticket.ticketId}
                      className="rounded-2xl border border-slate-200 p-4 space-y-2.5 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500">#TK-{ticket.ticketId}</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {getCategoryLabel(ticket.category)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${sevMeta.badgeClass}`}>
                              {sevMeta.label}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">{ticket.title}</h3>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusMeta.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                            {statusMeta.label}
                          </span>
                          <span className="text-[11px] text-slate-400">{formatTicketDate(ticket.createdAt)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{ticket.description}</p>

                      {ticket.adminResponse ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
                          <div className="font-bold flex items-center gap-1.5 text-emerald-800 mb-1">
                            <span className="material-symbols-outlined text-[16px]">quickreply</span>
                            <span>Phản hồi từ trung tâm</span>
                          </div>
                          <p className="whitespace-pre-line leading-relaxed">{ticket.adminResponse}</p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>Đang chờ bộ phận hỗ trợ tiếp nhận và phản hồi...</span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">report_problem</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Gửi Khiếu Nại &amp; Hỗ Trợ</h3>
                  <p className="text-xs text-slate-500">Lễ tân và Quản lý sẽ tiếp nhận và phản hồi cho bạn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Danh Mục</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mức Độ</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="NORMAL">Bình thường (Phản hồi trong 24h)</option>
                    <option value="URGENT">Khẩn cấp (Phản hồi trong 4h)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tiêu Đề *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Sân số 2 đèn bị nhấp nháy hoặc sai trạng thái điểm danh"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mô Tả Chi Tiết *</label>
                <textarea
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả cụ thể thời gian, sân/lớp hoặc giao dịch liên quan để trung tâm kiểm tra nhanh nhất..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi Khiếu Nại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
