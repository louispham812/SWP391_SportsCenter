import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useApp } from '../../context/AppContext';
import { createManagerClassSession, getManagerCoaches, getManagerDomainSports, getManagerFacilities } from '../../services/managerApi';
import { coachTeachesSport } from '../../utils/coachSport';

const emptySession = {
  className: '',
  sportId: '',
  coachId: '',
  facilityId: '',
  startTime: '',
  endTime: '',
  sessionCount: 1,
  maxSlots: 8,
  priceAmount: '',
};

export default function AdminCreateClassPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [facilities, setFacilities] = useState([]);
  const [sports, setSports] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let current = true;
    Promise.all([getManagerFacilities(), getManagerDomainSports(), getManagerCoaches()])
      .then(([facilityRows, sportRows, coachPage]) => {
        if (!current) return;
        setFacilities(facilityRows || []);
        setSports(sportRows || []);
        setCoaches(coachPage.content || []);
      })
      .catch((requestError) => { if (current) setError(requestError.message || 'Không thể tải dữ liệu tạo lớp.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const availableFacilities = facilities.filter(
    (facility) =>
      facility.status === 'AVAILABLE' &&
      (sessionForm.sportId && String(facility.sportId) === String(sessionForm.sportId)),
  );

  const selectedCreateSport = sports.find((s) => String(s.sportId) === String(sessionForm.sportId));
  const eligibleCreateCoaches = useMemo(() => {
    if (!sessionForm.sportId) return [];
    const sportName = selectedCreateSport?.sportName || selectedCreateSport?.name || '';
    return coaches.filter(
      (coach) =>
        (!coach.status || coach.status.toUpperCase() === 'ACTIVE') &&
        coachTeachesSport(coach, sessionForm.sportId, sportName),
    );
  }, [coaches, sessionForm.sportId, selectedCreateSport]);

  const handleCreateSession = async (event) => {
    event.preventDefault();
    if (String(sessionForm.priceAmount).trim() === '' || !Number.isFinite(Number(sessionForm.priceAmount)) || Number(sessionForm.priceAmount) < 0) {
      showToast('Chưa có học phí', 'Vui lòng nhập học phí mỗi buổi. Nhập 0 nếu lớp miễn phí.', 'danger');
      return;
    }
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
      setSessionForm(emptySession);
      setSuccess(`Đã tạo ${createdSessions.length} buổi học, lặp hàng tuần theo thứ và giờ đã chọn.`);
      showToast('Thành công', `Đã tạo ${createdSessions.length} ca học thành công.`, 'success');
    } catch (requestError) {
      const msg = requestError.message || 'Không thể tạo lịch lớp.';
      setError(msg);
      showToast('Lỗi tạo lịch lớp', msg, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <main className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tạo lịch lớp học</h1>
            <p className="mt-2 text-sm text-slate-500">Chọn bộ môn, sân và huấn luyện viên, sau đó thiết lập thời gian và học phí mỗi buổi.</p>
          </div>
          <Link to="/admin/classes" className="text-sm font-semibold text-orange-700">Xem lịch lớp đã tạo →</Link>
        </header>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{success}</p>}
        {loading && <p role="status" className="text-sm text-slate-500">Đang tải bộ môn, sân và huấn luyện viên...</p>}
            <form onSubmit={handleCreateSession}
              className="w-full max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Thông tin lớp học</h2>
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
                  onChange={(event) => {
                    const nextSportId = event.target.value;
                    const nextSport = sports.find((s) => String(s.sportId) === String(nextSportId));
                    const keepCoach = nextSportId && sessionForm.coachId
                      ? coaches.some(
                          (coach) =>
                            String(coach.userId) === String(sessionForm.coachId) &&
                            coachTeachesSport(coach, nextSportId, nextSport?.sportName || nextSport?.name || ''),
                        )
                      : false;
                    setSessionForm({
                      ...sessionForm,
                      sportId: nextSportId,
                      facilityId: '',
                      coachId: keepCoach ? sessionForm.coachId : '',
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Chọn bộ môn</option>
                  {sports.map((sport) => (
                    <option key={sport.sportId} value={sport.sportId}>
                      {sport.sportName || sport.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Cơ sở
                <select
                  required
                  value={sessionForm.facilityId}
                  disabled={!sessionForm.sportId || availableFacilities.length === 0}
                  onChange={(event) => setSessionForm({ ...sessionForm, facilityId: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {sessionForm.sportId
                      ? availableFacilities.length === 0
                        ? '-- Không có cơ sở khả dụng cho bộ môn này --'
                        : `-- Chọn cơ sở còn hoạt động (${availableFacilities.length}) --`
                      : '-- Vui lòng chọn bộ môn trước --'}
                  </option>
                  {availableFacilities.map((facility) => (
                    <option key={facility.facilityId} value={facility.facilityId}>{facility.facilityName}</option>
                  ))}
                </select>
                {sessionForm.sportId && availableFacilities.length === 0 && (
                  <p className="mt-1 text-xs text-rose-500 font-normal">
                    ⚠️ Chưa có cơ sở/phòng tập nào đang ở trạng thái hoạt động cho bộ môn này.
                  </p>
                )}
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Huấn luyện viên
                <select
                  required
                  disabled={!sessionForm.sportId || eligibleCreateCoaches.length === 0}
                  value={sessionForm.coachId}
                  onChange={(event) => setSessionForm({ ...sessionForm, coachId: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {!sessionForm.sportId
                      ? 'Vui lòng chọn bộ môn trước'
                      : eligibleCreateCoaches.length === 0
                        ? 'Chưa có HLV phù hợp cho bộ môn này'
                        : 'Chọn huấn luyện viên'}
                  </option>
                  {eligibleCreateCoaches.map((coach) => (
                    <option key={coach.userId} value={coach.userId}>
                      {coach.fullName}{coach.specialty ? ` (${coach.specialty})` : ''}
                    </option>
                  ))}
                </select>
                {sessionForm.sportId && eligibleCreateCoaches.length === 0 && (
                  <p className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                    Chưa có HLV nào dạy bộ môn {selectedCreateSport?.sportName || selectedCreateSport?.name}. Vui lòng gán bộ môn cho HLV trong mục Quản lý nhân sự.
                  </p>
                )}
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
                  Tổng số buổi
                  <input required type="number" min="1" max="52" value={sessionForm.sessionCount}
                    aria-describedby="class-session-repeat-help"
                    onChange={(event) => setSessionForm({ ...sessionForm, sessionCount: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <span id="class-session-repeat-help" className="mt-1.5 block text-[11px] font-normal leading-5 text-slate-500">
                    Bao gồm buổi đầu tiên. Mỗi tuần lặp 1 buổi, cùng thứ và khung giờ. Nhập 1 để chỉ tạo một buổi.
                  </span>
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Sĩ số tối đa
                  <input required type="number" min="1" value={sessionForm.maxSlots}
                    onChange={(event) => setSessionForm({ ...sessionForm, maxSlots: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Học phí mỗi buổi (VND) *
                  <input required type="number" min="0" step="1000" value={sessionForm.priceAmount}
                    placeholder="Nhập học phí mỗi buổi"
                    onChange={(event) => setSessionForm({ ...sessionForm, priceAmount: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <span className="mt-1.5 block text-[11px] font-normal leading-5 text-slate-500">Nhập 0 nếu lớp miễn phí.</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => navigate('/admin/facilities')}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold">Hủy</button>
                <button type="submit" disabled={loading || saving || String(sessionForm.priceAmount).trim() === '' || !Number.isFinite(Number(sessionForm.priceAmount)) || Number(sessionForm.priceAmount) < 0}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-60">
                  {saving ? 'Đang lưu...' : 'Tạo Lịch Ca Học'}
                </button>
              </div>
            </form>
      </main>
    </AdminLayout>
  );
}
