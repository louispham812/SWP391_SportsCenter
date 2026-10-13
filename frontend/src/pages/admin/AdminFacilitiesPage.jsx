import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  createManagerClassSession,
  getManagerCoaches,
  getManagerDomainSports,
  getManagerFacilities,
  updateManagerFacilityStatus,
} from '../../services/managerApi';

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

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [sports, setSports] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    (facility) => facility.status === 'AVAILABLE'
      && (!sessionForm.sportId || String(facility.sportId) === sessionForm.sportId),
  );

  const handleFacilityStatus = async (facility) => {
    setError('');
    try {
      await updateManagerFacilityStatus(
        facility.facilityId,
        facility.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE',
      );
      await loadFacilities();
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
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo lịch lớp.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-secondary">
              QUẢN LÝ CƠ SỞ &amp; LỊCH LỚP
            </p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Cơ sở, sân bãi &amp; lịch hoạt động
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Danh sách và trạng thái được tải trực tiếp từ cơ sở dữ liệu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddClassModal(true)}
            disabled={!sports.length || !coaches.length || !availableFacilities.length}
            className="rounded-xl bg-secondary-container px-5 py-2.5 text-xs font-bold uppercase text-primary shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tạo lịch lớp mới
          </button>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {success}
          </p>
        )}

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
              <article key={facility.facilityId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
                    {facility.sportName || 'Chưa phân môn'}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                    facility.status === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-amber-50 text-amber-800'
                  }`}>
                    {facility.status === 'AVAILABLE' ? 'Đang hoạt động' : 'Bảo trì'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{facility.facilityName}</h2>
                <p className="mt-2 text-sm text-slate-600">Sức chứa: {facility.capacity}</p>
                <button
                  type="button"
                  onClick={() => handleFacilityStatus(facility)}
                  className="mt-5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  {facility.status === 'AVAILABLE' ? 'Đặt bảo trì' : 'Mở lại cơ sở'}
                </button>
              </article>
            ))}
          </section>
        )}

        {showAddClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <form onSubmit={handleCreateSession} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-slate-900">Tạo lịch lớp</h2>
              <label className="block text-xs font-bold text-slate-700">
                Tên lớp
                <input
                  required
                  maxLength={100}
                  value={sessionForm.className}
                  onChange={(event) => setSessionForm({ ...sessionForm, className: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Bộ môn
                <select
                  required
                  value={sessionForm.sportId}
                  onChange={(event) => setSessionForm({ ...sessionForm, sportId: event.target.value, facilityId: '' })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Chọn bộ môn</option>
                  {sports.map((sport) => <option key={sport.sportId} value={sport.sportId}>{sport.sportName}</option>)}
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
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
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
