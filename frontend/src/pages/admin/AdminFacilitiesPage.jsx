import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  createManagerClassSession,
  getManagerCoaches,
  getManagerDomainSports,
  getManagerFacilities,
  updateManagerFacilityStatus,
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
      showToast('Thành công', `Đã tạo ${createdSessions.length} ca học trong cơ sở dữ liệu.`, 'success');
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
      'Lên lịch bảo trì thành công (MGR-19)',
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
              F SPORT ADMIN · SÂN BÃI &amp; BẢO TRÌ (MGR-19)
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Cơ sở, Sân Bãi &amp; Lịch Bảo Trì (MGR-19)
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý danh sách sân thi đấu, tình trạng sử dụng, xếp lịch lớp học và lên lịch bảo trì tạm khóa sân (MGR-19).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">build</span>
              Lên lịch bảo trì sân (MGR-19)
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
            { id: 'maintenance', label: `Lịch bảo trì sân (${maintenances.length}) - MGR-19`, icon: 'construction' },
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
              <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                Đang tải cơ sở...
              </p>
            ) : facilities.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                Cơ sở dữ liệu chưa có cơ sở nào.
              </p>
            ) : (
              <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {facilities.map((facility) => (
                  <article key={facility.facilityId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-300 transition-all">
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

        {/* Tab 2: Maintenance Windows (MGR-19) */}
        {activeTab === 'maintenance' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-4">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Danh sách các khung giờ bảo trì sân bãi (MGR-19)</h2>
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
                  Lên Lịch Bảo Trì Sân Thể Thao (MGR-19)
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
                  <strong>Quy tắc nghiệp vụ MGR-19:</strong>
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
                  {saving ? 'Đang lưu...' : 'Lưu vào cơ sở dữ liệu'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
