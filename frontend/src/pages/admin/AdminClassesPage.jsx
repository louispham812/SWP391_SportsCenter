import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import { TableSkeleton } from '../../components/common/Skeleton';
import {
  cancelManagerClassSession,
  getManagerClassSessions,
  getManagerCoaches,
  getManagerDomainSports,
  getManagerFacilities,
  updateManagerClassSession,
} from '../../services/managerApi';
import { useApp } from '../../context/AppContext';
import { coachTeachesSport } from '../../utils/coachSport';
import { getSportIcon } from '../../utils/sportIcon';

function ClassSessionRows({ groupName, items, onEdit, onCancel }) {
  return (
    <>
      {groupName && (
        <tr className="bg-orange-50/60 border-y border-orange-100">
          <td colSpan={8} className="px-5 py-2.5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 font-bold text-orange-900 text-xs">
                <span className="material-symbols-outlined text-[16px] text-orange-600">{getSportIcon(groupName)}</span>
                <span>{groupName}</span>
              </div>
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-800">
                {items.length} ca học
              </span>
            </div>
          </td>
        </tr>
      )}
      {items.map((session) => {
        const isCancelled = session.status === 'CANCELLED';
        return (
          <tr key={session.sessionId} className={`hover:bg-slate-50/70 transition ${isCancelled ? 'opacity-60 bg-slate-50/40' : ''}`}>
            <td className="pl-5 pr-2 py-3.5">
              <span className="font-bold text-slate-900 block">{session.className}</span>
              <span className="font-mono text-[11px] font-semibold text-slate-400">SES-{session.sessionId}</span>
            </td>
            <td className="px-2 py-3.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 uppercase mr-1.5 whitespace-nowrap">
                {session.sportName || 'Thể thao'}
              </span>
              <span className="text-slate-600 font-medium">{session.facilityName || 'Sân trung tâm'}</span>
            </td>
            <td className="px-2 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
              {session.coachName || 'Chưa gán HLV'}
            </td>
            <td className="px-2 py-3.5 text-slate-600 text-[11px] whitespace-nowrap">
              {session.startTime ? new Date(session.startTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
              {' → '}
              {session.endTime ? new Date(session.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </td>
            <td className="px-2 py-3.5 text-center font-bold whitespace-nowrap">
              <span className={session.bookedSlots >= session.maxSlots ? 'text-red-600' : 'text-slate-800'}>
                {session.bookedSlots || 0} / {session.maxSlots}
              </span>
            </td>
            <td className="px-2 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
              {Number(session.priceAmount || 0).toLocaleString()}₫
            </td>
            <td className="px-2 py-3.5 text-center whitespace-nowrap">
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${
                isCancelled
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isCancelled ? 'Đã Hủy' : session.status || 'ACTIVE'}
              </span>
            </td>
            <td className="pl-2 pr-5 py-3.5 text-right whitespace-nowrap">
              {!isCancelled ? (
                <div className="inline-flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(session)}
                    className="inline-flex h-7 items-center rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 px-2.5 text-[11px] font-bold text-slate-700 transition cursor-pointer whitespace-nowrap"
                    title="Dời giờ / Đổi sân / Đổi HLV"
                  >
                    Sửa giờ/HLV
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancel(session)}
                    className="inline-flex h-7 items-center rounded-lg bg-red-50 hover:bg-red-100 px-2.5 text-[11px] font-bold text-red-700 transition cursor-pointer whitespace-nowrap"
                    title="Hủy ca học & phát thông báo in-app"
                  >
                    Hủy ca
                  </button>
                </div>
              ) : (
                <span className="text-slate-400 text-[11px] italic">Không khả dụng</span>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}

/**
 * Dedicated admin page for managing group class sessions (filtering by sport,
 * rescheduling, swapping coach/facility, and cancelling with notifications).
 */
export default function AdminClassesPage() {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [classSessions, setClassSessions] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [sports, setSports] = useState([]);
  const [coaches, setCoaches] = useState([]);

  const [classSportFilter, setClassSportFilter] = useState('ALL');
  const [classStatusFilter, setClassStatusFilter] = useState('ALL');
  const [classSearch, setClassSearch] = useState('');
  const [groupClassesBySport, setGroupClassesBySport] = useState(true);

  const [selectedSession, setSelectedSession] = useState(null);
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState(false);
  const [editSessionForm, setEditSessionForm] = useState({
    coachId: '',
    facilityId: '',
    startTime: '',
    endTime: '',
  });
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Bảo trì cơ sở vật chất hoặc điều chuyển lịch trung tâm');
  const [processingAction, setProcessingAction] = useState(false);

  const loadClassSessions = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setClassesLoading(true);
    }
    try {
      const data = await getManagerClassSessions();
      setClassSessions(data || []);
    } catch (err) {
      console.warn('Không thể tải danh sách ca học:', err);
    } finally {
      if (!silent) {
        setClassesLoading(false);
      }
    }
  }, []);

  const loadSupportingData = useCallback(async () => {
    try {
      const [facilityRows, sportRows, coachPage] = await Promise.all([
        getManagerFacilities(),
        getManagerDomainSports(),
        getManagerCoaches(),
      ]);
      setFacilities(facilityRows || []);
      setSports(sportRows || []);
      setCoaches(coachPage.content || []);
    } catch (err) {
      console.warn('Không thể tải dữ liệu sân/bộ môn/HLV:', err);
    }
  }, []);

  useEffect(() => {
    loadClassSessions();
    loadSupportingData();
  }, [loadClassSessions, loadSupportingData]);

  const handleOpenEditSession = (session) => {
    setSelectedSession(session);
    const currentCoach = coaches.find((c) => String(c.userId) === String(session.coachId));
    const matchedSport = sports.find((s) => String(s.sportId) === String(session.sportId));
    const sportName = session.sportName || matchedSport?.sportName || matchedSport?.name || '';
    const isCurrentCoachValid = !currentCoach || !session.sportId || coachTeachesSport(currentCoach, session.sportId, sportName);
    setEditSessionForm({
      coachId: session.coachId && isCurrentCoachValid ? String(session.coachId) : '',
      facilityId: session.facilityId ? String(session.facilityId) : '',
      startTime: session.startTime ? session.startTime.slice(0, 16) : '',
      endTime: session.endTime ? session.endTime.slice(0, 16) : '',
    });
    setIsEditSessionModalOpen(true);
  };

  const handleSaveEditSession = async (e) => {
    e.preventDefault();
    setProcessingAction(true);
    try {
      await updateManagerClassSession(selectedSession.sessionId, {
        coachId: Number(editSessionForm.coachId),
        facilityId: Number(editSessionForm.facilityId),
        startTime: editSessionForm.startTime,
        endTime: editSessionForm.endTime,
      });
      showToast(
        'Đổi ca thành công',
        `Đã dời giờ / đổi HLV cho ca "${selectedSession.className}". Hệ thống tự động gửi thông báo in-app đến HLV và toàn bộ học viên!`,
        'success'
      );
      setIsEditSessionModalOpen(false);
      loadClassSessions({ silent: true });
    } catch (err) {
      showToast('Lỗi dời ca', err.message || 'Không thể cập nhật ca học.', 'danger');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleOpenCancelSession = (session) => {
    setSessionToCancel(session);
    setCancelReason('Bảo trì cơ sở vật chất hoặc điều chuyển lịch trung tâm');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelSession = async (e) => {
    e.preventDefault();
    setProcessingAction(true);
    try {
      await cancelManagerClassSession(sessionToCancel.sessionId, cancelReason);
      showToast(
        'Hủy ca học thành công',
        `Đã hủy ca "${sessionToCancel.className}". Hệ thống đã tự động gửi thông báo in-app tới HLV và toàn bộ học viên đã đăng ký!`,
        'success'
      );
      setIsCancelModalOpen(false);
      loadClassSessions({ silent: true });
    } catch (err) {
      showToast('Lỗi hủy ca', err.message || 'Không thể hủy ca học.', 'danger');
    } finally {
      setProcessingAction(false);
    }
  };

  const editSportId = selectedSession?.sportId;
  const editSport = sports.find((s) => String(s.sportId) === String(editSportId));
  const editSportName = selectedSession?.sportName || editSport?.sportName || editSport?.name || '';
  const eligibleEditCoaches = useMemo(() => {
    const activeCoaches = coaches.filter((coach) => !coach.status || coach.status.toUpperCase() === 'ACTIVE');
    if (!editSportId) return activeCoaches;
    return activeCoaches.filter((coach) => coachTeachesSport(coach, editSportId, editSportName));
  }, [coaches, editSportId, editSportName]);

  const eligibleEditFacilities = useMemo(() => {
    if (!editSportId) return facilities;
    return facilities.filter((f) => String(f.sportId) === String(editSportId));
  }, [facilities, editSportId]);

  const classSportOptions = useMemo(() => {
    const counts = new Map();
    for (const session of classSessions) {
      const sportLabel = session.sportName?.trim() || 'Thể thao';
      counts.set(sportLabel, (counts.get(sportLabel) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'vi'))
      .map(([name, count]) => ({ name, count }));
  }, [classSessions]);

  const filteredClassSessions = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    return classSessions
      .filter((session) => {
        const sportLabel = session.sportName?.trim() || 'Thể thao';
        if (classSportFilter !== 'ALL' && sportLabel !== classSportFilter) return false;
        const status = session.status?.toUpperCase();
        if (classStatusFilter === 'ACTIVE' && status === 'CANCELLED') return false;
        if (classStatusFilter === 'CANCELLED' && status !== 'CANCELLED') return false;
        if (q) {
          const haystack = [
            session.className,
            session.coachName,
            session.facilityName,
            session.sportName,
            `SES-${session.sessionId}`,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aCancelled = a.status === 'CANCELLED' ? 1 : 0;
        const bCancelled = b.status === 'CANCELLED' ? 1 : 0;
        if (aCancelled !== bCancelled) return aCancelled - bCancelled;
        return new Date(a.startTime || 0) - new Date(b.startTime || 0);
      });
  }, [classSearch, classSessions, classSportFilter, classStatusFilter]);

  const groupedClassSessions = useMemo(() => {
    const groups = new Map();
    for (const session of filteredClassSessions) {
      const sportLabel = session.sportName?.trim() || 'Thể thao';
      if (!groups.has(sportLabel)) groups.set(sportLabel, []);
      groups.get(sportLabel).push(session);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'vi'));
  }, [filteredClassSessions]);

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT ADMIN · QUẢN LÝ LỚP HỌC
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Quản lý lớp học &amp; ca học nhóm</h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi theo từng bộ môn, dời giờ, đổi Huấn luyện viên, chuyển sân hoặc hủy ca học kèm thông báo tự động.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadClassSessions()}
              disabled={classesLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Tải lại</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/classes/new')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Tạo lịch lớp mới</span>
            </button>
          </div>
        </header>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {!classesLoading && classSessions.length > 0 && (
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setClassSportFilter('ALL')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    classSportFilter === 'ALL'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>Tất cả</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                    classSportFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {classSessions.length}
                  </span>
                </button>
                {classSportOptions.map((sport) => {
                  const active = classSportFilter === sport.name;
                  return (
                    <button
                      key={sport.name}
                      type="button"
                      onClick={() => setClassSportFilter(sport.name)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px] leading-none">{getSportIcon(sport.name)}</span>
                      <span>{sport.name}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                        active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sport.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
                  <input
                    type="search"
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    placeholder="Tìm theo tên lớp, HLV, sân hoặc mã SES..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-orange-500"
                  />
                </div>
                <select
                  value={classStatusFilter}
                  onChange={(e) => setClassStatusFilter(e.target.value)}
                  aria-label="Lọc theo trạng thái ca học"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-orange-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang mở</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
                {classSportFilter === 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setGroupClassesBySport((prev) => !prev)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      groupClassesBySport
                        ? 'border-orange-200 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] leading-none">
                      {groupClassesBySport ? 'view_agenda' : 'view_list'}
                    </span>
                    <span>Nhóm theo môn</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {classesLoading ? (
              <div className="p-4">
                <TableSkeleton rows={5} cols={8} />
              </div>
            ) : classSessions.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                <p className="mt-2 text-sm font-semibold">Chưa có ca học nhóm nào</p>
                <p className="text-xs text-slate-400">Bấm "Tạo lịch lớp mới" để mở lớp huấn luyện.</p>
              </div>
            ) : filteredClassSessions.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl text-slate-300">filter_alt_off</span>
                <p className="mt-2 text-sm font-semibold">Không có ca học nào khớp bộ lọc</p>
                <button
                  type="button"
                  onClick={() => {
                    setClassSportFilter('ALL');
                    setClassStatusFilter('ALL');
                    setClassSearch('');
                  }}
                  className="mt-2 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[11px] whitespace-nowrap">
                  <tr>
                    <th className="pl-5 pr-2 py-3.5">Lớp Học</th>
                    <th className="px-2 py-3.5">Bộ Môn &amp; Sân</th>
                    <th className="px-2 py-3.5">Huấn Luyện Viên</th>
                    <th className="px-2 py-3.5">Thời Gian</th>
                    <th className="px-2 py-3.5 text-center">Sĩ Số</th>
                    <th className="px-2 py-3.5 text-right">Học Phí</th>
                    <th className="px-2 py-3.5 text-center">Trạng Thái</th>
                    <th className="pl-2 pr-5 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(classSportFilter === 'ALL' && groupClassesBySport
                    ? groupedClassSessions
                    : [['__FLAT__', filteredClassSessions]]
                  ).map(([groupName, groupItems]) => (
                    <ClassSessionRows
                      key={groupName}
                      groupName={groupName === '__FLAT__' ? null : groupName}
                      items={groupItems}
                      onEdit={handleOpenEditSession}
                      onCancel={handleOpenCancelSession}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {isEditSessionModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 !m-0">
          <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Dời Giờ / Đổi HLV Ca Học</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    SES-{selectedSession.sessionId}: {selectedSession.className}
                    {editSportName ? ` · Bộ môn: ${editSportName}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditSessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                ℹ️ <strong>Thông báo tự động:</strong> Khi bạn lưu giờ mới hoặc HLV mới, hệ thống sẽ tự động phát thông báo in-app realtime đến HLV phụ trách và toàn bộ học viên đã đăng ký ca này.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-slate-700">Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editSessionForm.startTime}
                    onChange={(e) => setEditSessionForm({ ...editSessionForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-slate-700">Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editSessionForm.endTime}
                    onChange={(e) => setEditSessionForm({ ...editSessionForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-slate-700">
                  Huấn luyện viên phụ trách ({editSportName || 'theo bộ môn'}) *
                </label>
                <select
                  required
                  disabled={eligibleEditCoaches.length === 0}
                  value={editSessionForm.coachId}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, coachId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {eligibleEditCoaches.length === 0
                      ? 'Chưa có HLV phù hợp cho bộ môn này'
                      : '-- Chọn HLV phụ trách --'}
                  </option>
                  {eligibleEditCoaches.map((c) => (
                    <option key={c.userId} value={c.userId}>
                      {c.fullName}{c.specialty ? ` · ${c.specialty}` : ''}
                    </option>
                  ))}
                </select>
                {eligibleEditCoaches.length === 0 && (
                  <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                    Chưa có HLV nào dạy bộ môn {editSportName}. Vui lòng gán bộ môn cho HLV trong mục Quản lý nhân sự.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-slate-700">Sân bãi / Phòng tập *</label>
                <select
                  required
                  value={editSessionForm.facilityId}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, facilityId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                >
                  <option value="">-- Chọn sân bãi --</option>
                  {eligibleEditFacilities.map((f) => (
                    <option key={f.facilityId} value={f.facilityId}>
                      {f.facilityName} ({f.sportName || 'Đa năng'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {processingAction ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCancelModalOpen && sessionToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 !m-0">
          <div className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </span>
                <h3 className="text-base font-bold text-slate-900">Xác Nhận Hủy Ca Học</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmCancelSession} className="space-y-4">
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-red-900 leading-relaxed">
                ⚠️ <strong>Cảnh báo:</strong> Ca học <strong>{sessionToCancel.className}</strong> (SES-{sessionToCancel.sessionId}) sẽ được đánh dấu <code>CANCELLED</code>. Hệ thống sẽ tự động gửi thông báo in-app thông tri tới HLV <strong>{sessionToCancel.coachName || 'HLV'}</strong> và toàn bộ học viên đã đăng ký kèm lý do hủy dưới đây.
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-slate-700">Lý do hủy ca học *</label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy ca học gửi đến học viên..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {processingAction ? 'Đang xử lý...' : 'Xác Nhận Hủy Ca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
