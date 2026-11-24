import { useEffect, useState } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import ModalDialog from '../../components/common/ModalDialog';
import { TableSkeleton } from '../../components/common/Skeleton';
import { createCoachLeaveRequest, getCoachLeaveRequests } from '../../services/coachApi';
import { useApp } from '../../context/AppContext';

const getLeaveStorageKey = (coachId) => (
  coachId ? `sports_center_coach_leave_requests_${coachId}` : 'sports_center_coach_leave_requests'
);

const getTodayLocalDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const LEAVE_TYPE_LABELS = {
  SICK_LEAVE: 'Nghỉ ốm / Y tế',
  PERSONAL_LEAVE: 'Việc cá nhân',
  PERSONAL: 'Việc cá nhân',
  SCHEDULE_CHANGE: 'Đổi ca dạy',
};

const INITIAL_LEAVE_FORM = {
  leaveType: 'SICK_LEAVE',
  startDate: '',
  endDate: '',
  reason: '',
};

export default function CoachLeavePage() {
  const { showToast, currentUser } = useApp();
  const storageKey = getLeaveStorageKey(currentUser?.id);
  const todayStr = getTodayLocalDate();
  const [leaveRequests, setLeaveRequests] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveForm, setLeaveForm] = useState(INITIAL_LEAVE_FORM);

  useEffect(() => {
    let active = true;
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) setLeaveRequests(JSON.parse(cached));
    } catch {
      // ignore storage errors
    }
    getCoachLeaveRequests()
      .then((data) => {
        if (active && Array.isArray(data)) {
          setLeaveRequests(data);
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không thể tải danh sách đơn xin nghỉ.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storageKey]);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      showToast('Thiếu thông tin', 'Vui lòng chọn ngày bắt đầu, ngày kết thúc và lý do xin nghỉ.', 'warning');
      return;
    }
    if (leaveForm.startDate < todayStr) {
      showToast('Ngày không hợp lệ', 'Ngày bắt đầu xin nghỉ không được ở trong quá khứ.', 'warning');
      return;
    }
    if (leaveForm.endDate < leaveForm.startDate) {
      showToast('Ngày không hợp lệ', 'Ngày kết thúc không được trước ngày bắt đầu.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createCoachLeaveRequest({
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason.trim(),
      });
      setLeaveRequests((prev) => {
        const updated = [created, ...prev];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      showToast(
        'Gửi đơn thành công',
        'Đơn xin nghỉ đã được chuyển đến Quản lý trung tâm để duyệt và điều phối Coach thay thế.',
        'success'
      );
      setIsLeaveModalOpen(false);
      setLeaveForm(INITIAL_LEAVE_FORM);
    } catch (err) {
      showToast('Không thể gửi đơn', err.message || 'Vui lòng kiểm tra lại thông tin và thử lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = leaveRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <CoachLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT COACH · NGHỈ PHÉP &amp; ĐỔI CA
            </div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">
              Đơn Xin Nghỉ &amp; Đổi Ca
            </h1>
            <p className="text-sm text-slate-500">
              Gửi đơn xin nghỉ phép, yêu cầu đổi ca dạy và theo dõi kết quả phê duyệt từ Quản lý trung tâm.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsLeaveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-orange-500/25 transition-all cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">event_busy</span>
            <span>Gửi Đơn Xin Nghỉ / Đổi Ca</span>
          </button>
        </header>

        <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl text-xs text-orange-950 flex items-start gap-3">
          <span className="material-symbols-outlined text-orange-600 text-xl shrink-0 mt-0.5">policy</span>
          <div>
            <strong className="block font-bold">Quy định xin nghỉ &amp; đổi ca của Coach:</strong>
            <p className="mt-1 leading-relaxed text-orange-900">
              Khi Coach xin nghỉ (ốm đau hoặc cá nhân), hệ thống sẽ chuyển đơn tới Quản lý trung tâm để duyệt.
              Quản lý sẽ phân công Coach thay thế phù hợp và tự động thông báo học viên. Học viên hoàn toàn không phát sinh thêm chi phí.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Lịch sử đơn xin nghỉ / đổi ca</h2>
                <p className="text-xs text-slate-500">Danh sách các yêu cầu nghỉ phép và trạng thái phê duyệt</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                {pendingCount} chờ duyệt
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Tạo đơn mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading && leaveRequests.length === 0 ? (
              <div className="p-4">
                <TableSkeleton rows={4} cols={6} />
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="p-10 text-center text-slate-500 space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">free_cancellation</span>
                <p className="text-sm font-semibold text-slate-700">Chưa có đơn xin nghỉ hoặc đổi ca nào</p>
                <p className="text-xs text-slate-400">
                  Khi cần nghỉ phép hoặc đổi ca dạy, hãy tạo đơn để Quản lý trung tâm điều phối HLV thay thế.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-5 py-3">Mã đơn</th>
                    <th className="px-5 py-3">Loại nghỉ</th>
                    <th className="px-5 py-3">Thời gian nghỉ</th>
                    <th className="px-5 py-3">Lý do</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Xử lý bởi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {leaveRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-mono font-bold text-slate-800">
                        #{req.requestId}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-800">
                          {LEAVE_TYPE_LABELS[req.leaveType] || 'Đổi ca dạy'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                        {req.startDate} → {req.endDate}
                      </td>
                      <td className="px-5 py-4 max-w-xs text-slate-600 truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {req.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : req.status === 'REJECTED'
                            ? 'Từ chối'
                            : 'Chờ Manager duyệt'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-[11px] space-y-0.5">
                        <div>
                          {req.approvedByName || (req.approvedBy ? `Quản lý #${req.approvedBy}` : null) || req.rejectionReason || 'Đang thẩm định'}
                        </div>
                        {req.reassignedCoachName && (
                          <div className="text-orange-700 font-semibold">
                            HLV dạy thay: {req.reassignedCoachName}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <ModalDialog
        open={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        titleId="coach-leave-modal-title"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">event_busy</span>
              </span>
              <h2 id="coach-leave-modal-title" className="text-base font-bold text-slate-900">
                Gửi đơn xin nghỉ / đổi ca giảng dạy
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              aria-label="Đóng hộp thoại"
              className="text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg p-1"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmitLeave} className="space-y-3.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="leave-type" className="text-xs font-bold uppercase text-slate-700">
                Loại yêu cầu *
              </label>
              <select
                id="leave-type"
                autoFocus
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
              >
                <option value="SICK_LEAVE">Nghỉ ốm / Khám bệnh y tế (SICK_LEAVE)</option>
                <option value="PERSONAL_LEAVE">Nghỉ việc cá nhân / Gia đình (PERSONAL_LEAVE)</option>
                <option value="SCHEDULE_CHANGE">Yêu cầu đổi ca trực / Dời lịch (SCHEDULE_CHANGE)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="leave-start-date" className="text-xs font-bold uppercase text-slate-700">
                  Ngày bắt đầu nghỉ *
                </label>
                <input
                  id="leave-start-date"
                  type="date"
                  required
                  min={todayStr}
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="leave-end-date" className="text-xs font-bold uppercase text-slate-700">
                  Ngày kết thúc nghỉ *
                </label>
                <input
                  id="leave-end-date"
                  type="date"
                  required
                  min={leaveForm.startDate || todayStr}
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="leave-reason" className="text-xs font-bold uppercase text-slate-700">
                Lý do xin nghỉ chi tiết *
              </label>
              <textarea
                id="leave-reason"
                required
                rows={3}
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="Ghi rõ lý do xin nghỉ hoặc đề xuất Coach thay thế (nếu có)..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
              ℹ️ <strong>Lưu ý:</strong> Quản lý trung tâm sẽ thẩm định đơn và tự động chuyển các ca học bị ảnh hưởng sang Coach thay thế kèm thông báo cho học viên.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Gửi Đơn Xin Nghỉ'}
              </button>
            </div>
          </form>
        </div>
      </ModalDialog>
    </CoachLayout>
  );
}
