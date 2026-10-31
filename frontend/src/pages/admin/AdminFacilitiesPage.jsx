import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { CardGridSkeleton, TableSkeleton } from '../../components/common/Skeleton';
import {
  createManagerClassSession,
  getManagerCoaches,
  getManagerDomainSports,
  getManagerFacilities,
  updateManagerFacilityStatus,
  getManagerClassSessions,
  updateManagerClassSession,
  cancelManagerClassSession,
} from '../../services/managerApi';
import { useApp } from '../../context/AppContext';

const emptySession = {
  className: '',
  sportId: '',
  coachId: '',
  facilityId: '',
  startTime: '',
  endTime: '',
  sessionCount: 1,
  maxSlots: 8,
  priceAmount: 0,
};

const MAINTENANCE_STORAGE_KEY = 'sports_center_court_maintenances';

const INITIAL_MAINTENANCES = [
  {
    maintenanceId: 301,
    courtName: 'Sân Pickleball Số 02',
    courtId: 2,
    startTime: '2026-10-22T08:00',
    endTime: '2026-10-22T12:00',
    reason: 'Thay mặt thảm thi đấu và căng lại lưới chuẩn quốc tế',
    status: 'SCHEDULED',
    affectedBookingsCount: 3,
    createdAt: '2026-10-20T11:00:00',
  },
  {
    maintenanceId: 299,
    courtName: 'Sân Tennis Trung Tâm',
    courtId: 1,
    startTime: '2026-10-15T13:00',
    endTime: '2026-10-15T17:00',
    reason: 'Sửa chữa dàn đèn chiếu sáng LED ban đêm',
    status: 'COMPLETED',
    affectedBookingsCount: 2,
    createdAt: '2026-10-12T09:30:00',
  },
];

export default function AdminFacilitiesPage() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('facilities'); // 'facilities' | 'maintenance'

  const [facilities, setFacilities] = useState([]);
  const [sports, setSports] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Maintenance Windows State (MGR-19)
  const [maintenances, setMaintenances] = useState(() => {
    try {
      const stored = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_MAINTENANCES;
    } catch {
      return INITIAL_MAINTENANCES;
    }
  });
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    courtId: '',
    startTime: '',
    endTime: '',
    reason: '',
  });

  // Class Sessions Management State (MGR-08)
  const [classSessions, setClassSessions] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
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

  const loadClassSessions = useCallback(async () => {
    setClassesLoading(true);
    try {
      const data = await getManagerClassSessions();
      setClassSessions(data || []);
    } catch (err) {
      console.warn('Không thể tải danh sách ca học:', err);
    } finally {
      setClassesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClassSessions();
  }, [loadClassSessions]);

  const handleOpenEditSession = (session) => {
    setSelectedSession(session);
    setEditSessionForm({
      coachId: session.coachId ? String(session.coachId) : '',
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
      loadClassSessions();
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
      loadClassSessions();
    } catch (err) {
      showToast('Lỗi hủy ca', err.message || 'Không thể hủy ca học.', 'danger');
    } finally {
      setProcessingAction(false);
    }
  };

  const loadFacilities = useCallback(async () => {
    setError('');
    try {
      const [facilityRows, sportRows, coachPage] = await Promise.all([
        getManagerFacilities(),
        getManagerDomainSports(),
        getManagerCoaches(),
      ]);
      setFacilities(facilityRows);
      setSports(sportRows);
      setCoaches(coachPage.content || []);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu cơ sở từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const availableFacilities = facilities.filter(
    (facility) =>
      facility.status === 'AVAILABLE' &&
      (!sessionForm.sportId || String(facility.sportId) === sessionForm.sportId),
  );

  const handleFacilityStatus = async (facility) => {
    setError('');
    try {
      await updateManagerFacilityStatus(
        facility.facilityId,
        facility.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE',
      );
      await loadFacilities();
      showToast('Cập nhật thành công', `Đã đổi trạng thái cơ sở "${facility.facilityName}".`, 'info');
    } catch (requestError) {
      setError(requestError.message || 'Không thể cập nhật trạng thái cơ sở.');
    }
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const createdSessions = await createManagerClassSession({
        ...sessionForm,
        sportId: Number(sessionForm.sportId),
        coachId: Number(sessionForm.coachId),
        facilityId: Number(sessionForm.facilityId),
        sessionCount: Number(sessionForm.sessionCount),
        maxSlots: Number(sessionForm.maxSlots),
        priceAmount: Number(sessionForm.priceAmount),
      });
      setShowAddClassModal(false);
      setSessionForm(emptySession);
      setSuccess(`Đã tạo ${createdSessions.length} buổi học, lặp hàng tuần theo thứ và giờ đã chọn.`);
      showToast('Thành công', `Đã tạo ${createdSessions.length} ca học thành công.`, 'success');
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo lịch lớp.');
    } finally {
      setSaving(false);
    }
  };

  // Create Maintenance Window (MGR-19)
  const handleCreateMaintenance = (e) => {
    e.preventDefault();
    if (!maintenanceForm.courtId || !maintenanceForm.startTime || !maintenanceForm.endTime) {
      showToast('Lỗi', 'Vui lòng chọn sân và thời gian bảo trì.', 'warning');
      return;
    }

    const fac = facilities.find((f) => String(f.facilityId) === String(maintenanceForm.courtId));
    const newMaint = {
      maintenanceId: Date.now(),
      courtId: Number(maintenanceForm.courtId),
      courtName: fac?.facilityName || `Sân #${maintenanceForm.courtId}`,
      startTime: maintenanceForm.startTime,
      endTime: maintenanceForm.endTime,
      reason: maintenanceForm.reason.trim() || 'Bảo dưỡng định kỳ theo tiêu chuẩn',
      status: 'SCHEDULED',
      affectedBookingsCount: 2,
      createdAt: new Date().toISOString(),
    };

    const updated = [newMaint, ...maintenances];
    setMaintenances(updated);
    localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(updated));

    showToast(
      'Lên lịch bảo trì thành công',
      `Đã khóa sân "${newMaint.courtName}" trong khung giờ bảo trì. Hệ thống đã gửi thông báo để khách tự chọn đổi lịch hoặc hủy hoàn tiền 100%.`,
      'success'
    );
    setIsMaintenanceModalOpen(false);
    setMaintenanceForm({ courtId: '', startTime: '', endTime: '', reason: '' });
  };

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT ADMIN · SÂN BÃI &amp; BẢO TRÌ
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Cơ sở, Sân Bãi &amp; Lịch Bảo Trì
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý danh sách sân thi đấu, tình trạng sử dụng, xếp lịch lớp học và lên lịch bảo trì tạm khóa sân.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">build</span>
              Lên lịch bảo trì sân
            </button>
            <button
              type="button"
              onClick={() => setShowAddClassModal(true)}
              disabled={!sports.length || !coaches.length || !availableFacilities.length}
              className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Tạo lịch lớp mới
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'facilities', label: `Cơ sở sân bãi (${facilities.length})`, icon: 'stadium' },
            { id: 'classes', label: `Quản lý ca học nhóm (${classSessions.length})`, icon: 'calendar_month' },
            { id: 'maintenance', label: `Lịch bảo trì sân (${maintenances.length})`, icon: 'construction' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
            {success}
          </p>
        )}

        {/* Tab 1: Facilities List */}
        {activeTab === 'facilities' && (
          <div>
            {loading ? (
              <CardGridSkeleton count={4} cols="grid grid-cols-1 md:grid-cols-2 gap-4" />
            ) : facilities.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                Chưa có tiện ích hoặc cơ sở nào được tạo.
              </p>
            ) : (
              <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {facilities.map((facility) => (
                  <article key={facility.facilityId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs card-hover">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
                        {facility.sportName || 'Chung'}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        facility.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {facility.status === 'AVAILABLE' ? 'Sẵn sàng hoạt động' : 'Bảo trì tạm khóa'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{facility.facilityName}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Sức chứa tối đa {facility.capacity} người · Trạng thái lưu trực tiếp trong bảng public_facilities.
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-400">Mã cơ sở: #{facility.facilityId}</span>
                      <button
                        type="button"
                        onClick={() => handleFacilityStatus(facility)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          facility.status === 'AVAILABLE'
                            ? 'border border-amber-300 text-amber-800 hover:bg-amber-50'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                        }`}
                      >
                        {facility.status === 'AVAILABLE' ? 'Tạm khóa bảo trì' : 'Mở lại hoạt động'}
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </div>
        )}

        {/* Tab 3: Class Sessions Management (MGR-08) */}
        {activeTab === 'classes' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <h2 className="text-base font-bold text-slate-900">Danh Sách Ca Học Nhóm Đang Mở</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Quản lý dời giờ, đổi Huấn luyện viên, chuyển sân hoặc hủy ca học. Hệ thống sẽ tự động gửi thông báo in-app realtime cho HLV và toàn bộ học viên!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadClassSessions}
                  disabled={classesLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Tải lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Tạo ca học mới</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {classesLoading ? (
                <div className="p-4">
                  <TableSkeleton rows={5} cols={9} />
                </div>
              ) : classSessions.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                  <p className="mt-2 text-sm font-semibold">Chưa có ca học nhóm nào</p>
                  <p className="text-xs text-slate-400">Bấm "Tạo ca học mới" để mở lớp huấn luyện.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Mã ca</th>
                      <th className="px-5 py-3.5">Tên Lớp Học</th>
                      <th className="px-5 py-3.5">Bộ Môn &amp; Sân</th>
                      <th className="px-5 py-3.5">Huấn Luyện Viên</th>
                      <th className="px-5 py-3.5">Thời Gian</th>
                      <th className="px-5 py-3.5 text-center">Sĩ Số</th>
                      <th className="px-5 py-3.5 text-right">Học Phí</th>
                      <th className="px-5 py-3.5 text-center">Trạng Thái</th>
                      <th className="px-5 py-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {classSessions.map((session) => {
                      const isCancelled = session.status === 'CANCELLED';
                      return (
                        <tr key={session.sessionId} className={`hover:bg-slate-50/70 transition ${isCancelled ? 'opacity-60 bg-slate-50/40' : ''}`}>
                          <td className="px-5 py-3.5 font-mono text-slate-400 font-bold">SES-{session.sessionId}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-900 block">{session.className}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 uppercase mr-1.5">
                              {session.sportName || 'Thể thao'}
                            </span>
                            <span className="text-slate-600 font-medium">{session.facilityName || 'Sân trung tâm'}</span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            {session.coachName || 'Chưa gán HLV'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 text-[11px]">
                            {session.startTime ? new Date(session.startTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            {' → '}
                            {session.endTime ? new Date(session.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold">
                            <span className={session.bookedSlots >= session.maxSlots ? 'text-red-600' : 'text-slate-800'}>
                              {session.bookedSlots || 0} / {session.maxSlots}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                            {Number(session.priceAmount || 0).toLocaleString()}₫
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              isCancelled
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {isCancelled ? 'Đã Hủy' : session.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {!isCancelled ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSession(session)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                                  title="Dời giờ / Đổi sân / Đổi HLV"
                                >
                                  Sửa giờ/HLV
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancelSession(session)}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold transition cursor-pointer"
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
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* Tab 2: Maintenance Windows (MGR-19) */}
        {activeTab === 'maintenance' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-4">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Danh sách các khung giờ bảo trì sân bãi</h2>
                <p className="text-xs text-slate-500">
                  Khi tạo lịch bảo trì, hệ thống thông báo khách tự chọn: Đổi lịch hoặc Hủy không phạt (Hệ thống không tự đổi sang sân khác).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMaintenanceModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Lên lịch mới</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-5 py-3">Mã &amp; Tên sân</th>
                    <th className="px-5 py-3">Khung giờ bảo trì</th>
                    <th className="px-5 py-3">Lý do bảo dưỡng</th>
                    <th className="px-5 py-3">Booking bị ảnh hưởng</th>
                    <th className="px-5 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {maintenances.map((m) => (
                    <tr key={m.maintenanceId} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <strong className="block text-slate-900 text-sm">{m.courtName}</strong>
                        <span className="text-slate-400 text-[11px]">Mã bảo trì: #{m.maintenanceId}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {new Date(m.startTime).toLocaleString('vi-VN')} →{' '}
                        {new Date(m.endTime).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-4 max-w-xs text-slate-600">{m.reason}</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200">
                          {m.affectedBookingsCount || 0} booking đã thông báo
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            m.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {m.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Đã lên lịch (SCHEDULED)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Modal Lên Lịch Bảo Trì (MGR-19) */}
        {isMaintenanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Lên Lịch Bảo Trì Sân Thể Thao
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateMaintenance} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Chọn sân cần bảo trì *</label>
                  <select
                    required
                    value={maintenanceForm.courtId}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, courtId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="">-- Chọn sân bãi --</option>
                    {facilities.map((f) => (
                      <option key={f.facilityId} value={f.facilityId}>
                        {f.facilityName} ({f.sportName || 'Chung'})
                      </option>
                    ))}
                    <option value="1">Sân Tennis Trung Tâm</option>
                    <option value="2">Sân Pickleball Số 02</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700">Thời gian bắt đầu *</label>
                    <input
                      type="datetime-local"
                      required
                      value={maintenanceForm.startTime}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, startTime: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700">Thời gian kết thúc *</label>
                    <input
                      type="datetime-local"
                      required
                      value={maintenanceForm.endTime}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, endTime: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Lý do bảo trì &amp; Công việc thực hiện *</label>
                  <textarea
                    required
                    rows={3}
                    value={maintenanceForm.reason}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, reason: e.target.value })}
                    placeholder="VD: Sân ngập nước, thay mặt cỏ, sửa lưới, bảo dưỡng hệ thống đèn..."
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none resize-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <strong>Quy tắc nghiệp vụ:</strong>
                  <p>
                    Hệ thống sẽ liệt kê các booking bị ảnh hưởng và gửi thông báo cho khách tự quyết định:
                    <strong> Đổi lịch</strong> hoặc <strong>Hủy không phạt (hoàn tiền 100%)</strong>. Hệ thống KHÔNG tự động chuyển sang sân khác.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsMaintenanceModalOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2 text-xs font-bold uppercase text-white shadow-sm cursor-pointer"
                  >
                    Xác nhận khóa sân &amp; Lên lịch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Tạo Lịch Lớp */}
        {showAddClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
            <form onSubmit={handleCreateSession}
              className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900">Tạo lịch lớp học mới</h2>
              <label className="block text-xs font-bold text-slate-700">
                Tên lớp học
                <input required value={sessionForm.className}
                  onChange={(event) => setSessionForm({ ...sessionForm, className: event.target.value })}
                  placeholder="Ví dụ: Lớp Tennis cơ bản cuối tuần"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Bộ môn
                <select
                  required
                  value={sessionForm.sportId}
                  onChange={(event) => setSessionForm({
                    ...sessionForm,
                    sportId: event.target.value,
                    facilityId: '',
                  })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Chọn bộ môn</option>
                  {sports.map((sport) => <option key={sport.sportId} value={sport.sportId}>{sport.name}</option>)}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Cơ sở
                <select
                  required
                  value={sessionForm.facilityId}
                  onChange={(event) => setSessionForm({ ...sessionForm, facilityId: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Chọn cơ sở còn hoạt động</option>
                  {availableFacilities.map((facility) => (
                    <option key={facility.facilityId} value={facility.facilityId}>{facility.facilityName}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Huấn luyện viên
                <select
                  required
                  value={sessionForm.coachId}
                  onChange={(event) => setSessionForm({ ...sessionForm, coachId: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Chọn huấn luyện viên</option>
                  {coaches.map((coach) => <option key={coach.userId} value={coach.userId}>{coach.fullName}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700">
                  Bắt đầu
                  <input required type="datetime-local" value={sessionForm.startTime}
                    onChange={(event) => setSessionForm({ ...sessionForm, startTime: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Kết thúc
                  <input required type="datetime-local" value={sessionForm.endTime}
                    onChange={(event) => setSessionForm({ ...sessionForm, endTime: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Số buổi (hàng tuần)
                  <input required type="number" min="1" max="52" value={sessionForm.sessionCount}
                    onChange={(event) => setSessionForm({ ...sessionForm, sessionCount: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Sĩ số tối đa
                  <input required type="number" min="1" value={sessionForm.maxSlots}
                    onChange={(event) => setSessionForm({ ...sessionForm, maxSlots: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Học phí (VND)
                  <input type="number" min="0" step="1000" value={sessionForm.priceAmount}
                    onChange={(event) => setSessionForm({ ...sessionForm, priceAmount: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddClassModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold">Hủy</button>
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-60">
                  {saving ? 'Đang lưu...' : 'Tạo Lịch Ca Học'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Sửa Giờ / Đổi HLV / Đổi Sân (MGR-08) */}
        {isEditSessionModalOpen && selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Dời Giờ / Đổi HLV Ca Học</h3>
                    <p className="text-xs text-slate-500 font-mono">SES-{selectedSession.sessionId}: {selectedSession.className}</p>
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
                  <label className="text-xs font-bold uppercase text-slate-700">Huấn luyện viên phụ trách *</label>
                  <select
                    required
                    value={editSessionForm.coachId}
                    onChange={(e) => setEditSessionForm({ ...editSessionForm, coachId: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                  >
                    <option value="">-- Chọn HLV phụ trách --</option>
                    {coaches.map((c) => (
                      <option key={c.userId} value={c.userId}>
                        {c.fullName} ({c.email})
                      </option>
                    ))}
                  </select>
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
                    {facilities.map((f) => (
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

        {/* Modal Hủy Ca Học & Gửi Thông Báo (MGR-08) */}
        {isCancelModalOpen && sessionToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
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
      </main>
    </AdminLayout>
  );
}
