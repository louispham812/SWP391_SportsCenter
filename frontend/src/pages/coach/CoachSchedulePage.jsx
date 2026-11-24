import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CoachLayout from '../../components/layouts/CoachLayout';
import { ScheduleSkeleton } from '../../components/common/Skeleton';
import { getCoachSchedule } from '../../services/bookingApi';
import { getCoachAvailability, updateCoachAvailability } from '../../services/coachApi';
import { useApp } from '../../context/AppContext';

const mondayOf = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const dateKey = (date) => {
  if (typeof date === 'string') {
    if (date.length >= 10 && date[4] === '-' && date[7] === '-') {
      return date.slice(0, 10);
    }
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

const INITIAL_AVAILABILITY = [
  { day: 'MONDAY', label: 'Thứ Hai', morning: true, afternoon: true, evening: true },
  { day: 'TUESDAY', label: 'Thứ Ba', morning: true, afternoon: true, evening: true },
  { day: 'WEDNESDAY', label: 'Thứ Tư', morning: true, afternoon: true, evening: true },
  { day: 'THURSDAY', label: 'Thứ Năm', morning: true, afternoon: true, evening: true },
  { day: 'FRIDAY', label: 'Thứ Sáu', morning: true, afternoon: true, evening: true },
  { day: 'SATURDAY', label: 'Thứ Bảy', morning: true, afternoon: true, evening: true },
  { day: 'SUNDAY', label: 'Chủ Nhật', morning: true, afternoon: true, evening: true },
];

const normalizeAvailability = (rawList) => {
  if (!Array.isArray(rawList) || rawList.length === 0) return INITIAL_AVAILABILITY;
  const byDay = new Map(
    rawList
      .filter((item) => item && typeof item.day === 'string')
      .map((item) => [item.day.toUpperCase(), item])
  );
  return INITIAL_AVAILABILITY.map((defaults) => {
    const match = byDay.get(defaults.day);
    if (!match) return defaults;
    return {
      day: defaults.day,
      label: match.label || defaults.label,
      morning: Boolean(match.morning),
      afternoon: Boolean(match.afternoon),
      evening: Boolean(match.evening),
    };
  });
};

const SCHEDULE_TABS = [
  { id: 'schedule', label: 'Lịch giảng dạy tuần', icon: 'calendar_month' },
  { id: 'availability', label: 'Khai báo lịch rảnh', icon: 'more_time' },
];

const SHIFT_SLOTS = [
  { key: 'morning', label: 'Sáng (06:00 - 12:00)' },
  { key: 'afternoon', label: 'Chiều (12:00 - 18:00)' },
  { key: 'evening', label: 'Tối (18:00 - 22:00)' },
];

function WeekToolbar({ weekStart, endOfWeek, onPrev, onToday, onNext }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-800 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
        <span className="material-symbols-outlined text-orange-500 text-[18px]">calendar_today</span>
        <span>
          {weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long' })} –{' '}
          {endOfWeek.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Tuần trước"
          onClick={onPrev}
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-300 text-slate-700 transition-all shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <button
          type="button"
          onClick={onToday}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm cursor-pointer"
        >
          Tuần hiện tại
        </button>
        <button
          type="button"
          aria-label="Tuần sau"
          onClick={onNext}
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-300 text-slate-700 transition-all shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export default function CoachSchedulePage({ initialTab = 'schedule' }) {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState(
    initialTab === 'availability' ? 'availability' : 'schedule'
  );

  // Weekly Schedule State
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [scheduleResponse, setScheduleResponse] = useState(null);
  const startKey = dateKey(weekStart);
  const loading = scheduleResponse?.key !== startKey;
  const classes = scheduleResponse?.key === startKey ? scheduleResponse.rows : [];
  const error = scheduleResponse?.key === startKey ? scheduleResponse.error : '';

  // Availability State (COA-14)
  const [availability, setAvailability] = useState(INITIAL_AVAILABILITY);
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Load Coach Availability from Backend (COA-14)
  useEffect(() => {
    let active = true;
    getCoachAvailability()
      .then((res) => {
        if (active && res?.availabilityJson) {
          try {
            const parsed = JSON.parse(res.availabilityJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAvailability(normalizeAvailability(parsed));
            }
          } catch (e) {
            console.warn('Lỗi phân tích availabilityJson:', e);
          }
        }
      })
      .catch((err) => console.warn('Không thể tải lịch rảnh từ DB:', err));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getCoachSchedule(startKey)
      .then((rows) => {
        if (active) setScheduleResponse({ key: startKey, rows, error: '' });
      })
      .catch((requestError) => {
        if (active) {
          setScheduleResponse({
            key: startKey,
            rows: [],
            error: requestError.message || 'Không thể tải lịch giảng dạy.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [startKey]);

  const handleSaveAvailability = async () => {
    if (savingAvailability) return;
    setSavingAvailability(true);
    try {
      await updateCoachAvailability(JSON.stringify(availability));
      showToast('Đã lưu thành công', 'Lịch rảnh cố định hàng tuần đã được cập nhật lên hệ thống F Sport.', 'success');
    } catch (err) {
      showToast('Không thể lưu lịch rảnh', err.message || 'Không thể lưu lịch rảnh.', 'danger');
    } finally {
      setSavingAvailability(false);
    }
  };

  // Toggle Shift Availability (COA-14)
  const handleToggleShift = async (dayCode, shiftKey) => {
    if (savingAvailability) return;
    const updated = availability.map((item) =>
      item.day === dayCode ? { ...item, [shiftKey]: !item[shiftKey] } : item
    );
    setSavingAvailability(true);
    try {
      await updateCoachAvailability(JSON.stringify(updated));
      setAvailability(updated);
      showToast(
        'Đã lưu lịch rảnh',
        `Đã cập nhật ca ${shiftKey === 'morning' ? 'Sáng' : shiftKey === 'afternoon' ? 'Chiều' : 'Tối'} lên hệ thống.`,
        'success'
      );
    } catch (err) {
      showToast(
        'Không thể cập nhật ca',
        err.message || 'Không thể cập nhật lịch rảnh.',
        'danger'
      );
    } finally {
      setSavingAvailability(false);
    }
  };

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index);
    return {
      key: dateKey(date),
      date,
      classes: classes.filter((classItem) => dateKey(new Date(classItem.startTime)) === dateKey(date)),
    };
  });

  const todayKey = dateKey(new Date());
  const endOfWeek = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const goToPrevWeek = () => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7));
  const goToCurrentWeek = () => setWeekStart(mondayOf(new Date()));
  const goToNextWeek = () => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7));

  return (
    <CoachLayout>
      <div className="space-y-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            F SPORT COACH · LỊCH DẠY &amp; LỊCH RẢNH
          </div>
          <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">
            Lịch Giảng Dạy Tuần &amp; Khai Báo Lịch Rảnh
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi lịch phân công lớp học theo tuần và tự khai báo khung giờ sẵn sàng nhận lớp.
          </p>
        </header>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Lịch giảng dạy và lịch rảnh"
          className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto"
        >
          {SCHEDULE_TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`schedule-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white border border-slate-900 shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: LỊCH GIẢNG DẠY TUẦN (WEEKLY SCHEDULE) */}
        {activeTab === 'schedule' && (
          <div role="tabpanel" aria-labelledby="schedule-tab-schedule" className="space-y-4">
            <WeekToolbar
              weekStart={weekStart}
              endOfWeek={endOfWeek}
              onPrev={goToPrevWeek}
              onToday={goToCurrentWeek}
              onNext={goToNextWeek}
            />

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
            {loading ? (
              <ScheduleSkeleton rows={3} cols={4} />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {days.map((day) => {
                  const isToday = day.key === todayKey;
                  return (
                    <section
                      key={day.key}
                      className={`flex flex-col rounded-2xl border p-4 shadow-sm transition-all ${
                        isToday ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <header className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            {day.date.toLocaleDateString('vi-VN', { weekday: 'long' })}
                          </p>
                          <p className={`text-base font-black ${isToday ? 'text-orange-600' : 'text-slate-900'}`}>
                            {day.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            day.classes.length > 0 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {day.classes.length} ca
                        </span>
                      </header>

                      {day.classes.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-slate-400">
                          Không có ca dạy
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {[...day.classes]
                            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                            .map((classItem, idx) => {
                              const isNext = isToday && idx === 0;
                              const hasConflict = day.classes.some(
                                (other) =>
                                  other.sessionId !== classItem.sessionId &&
                                  other.status !== 'CANCELLED' &&
                                  classItem.status !== 'CANCELLED' &&
                                  new Date(classItem.startTime) < new Date(other.endTime) &&
                                  new Date(classItem.endTime) > new Date(other.startTime)
                              );
                              return (
                                <article
                                  key={classItem.sessionId}
                                  className={`rounded-xl border p-3.5 transition-all ${
                                    hasConflict
                                      ? 'border-rose-400 bg-rose-50/60 ring-1 ring-rose-400'
                                      : isNext
                                      ? 'border-orange-500 bg-slate-900 text-white shadow-md'
                                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        hasConflict
                                          ? 'bg-rose-100 text-rose-800'
                                          : isNext
                                          ? 'bg-orange-500 text-white'
                                          : 'bg-orange-100 text-orange-800'
                                      }`}
                                    >
                                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                                      {formatTime(classItem.startTime)} – {formatTime(classItem.endTime)}
                                    </span>
                                    {hasConflict && (
                                      <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-300">
                                        <span className="material-symbols-outlined text-[12px]">warning</span>
                                        Trùng giờ
                                      </span>
                                    )}
                                    {isNext && !hasConflict && (
                                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                        Ca kế tiếp
                                      </span>
                                    )}
                                  </div>
                                  <h3 className={`mt-2 text-xs font-bold leading-snug ${isNext && !hasConflict ? 'text-white' : 'text-slate-900'}`}>
                                    {classItem.className}
                                  </h3>
                                  <p className={`mt-1 text-[11px] ${isNext && !hasConflict ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {classItem.sportName || 'Lớp thể thao'} · {classItem.facilityName || 'Cơ sở F Sport'}
                                  </p>
                                  <div className="mt-3 pt-2.5 border-t border-slate-200/40 flex items-center justify-between">
                                    <span className={`text-[11px] font-semibold ${isNext && !hasConflict ? 'text-orange-300' : 'text-slate-600'}`}>
                                      Sĩ số: <strong className={isNext && !hasConflict ? 'text-white' : 'text-slate-900'}>{classItem.bookedSlots ?? 0}</strong> / {classItem.maxSlots ?? '—'}
                                    </span>
                                  </div>
                                  <Link
                                    to="/coach/attendance"
                                    className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-lg bg-orange-500 hover:bg-orange-600 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-white shadow-xs transition-all"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">fact_check</span>
                                    Điểm danh ca này
                                  </Link>
                                </article>
                              );
                            })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KHAI BÁO LỊCH RẢNH (COA-14) */}
        {activeTab === 'availability' && (
          <div role="tabpanel" aria-labelledby="schedule-tab-availability" className="space-y-5">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-950 flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-xl shrink-0 mt-0.5">more_time</span>
              <div>
                <strong className="block font-bold">Chính sách lịch rảnh cố định hàng tuần</strong>
                <p className="mt-1 leading-relaxed text-blue-900">
                  Đây là mẫu khung giờ cố định hàng tuần (Thứ Hai – Chủ Nhật) để Manager xếp lớp mới và Member đặt lịch tập PT.
                  Các ca đã có lớp được xếp lịch sẵn sẽ không thể tự tắt — nếu cần nghỉ đột xuất, vui lòng gửi{' '}
                  <Link to="/coach/leave" className="font-bold underline text-blue-700 hover:text-blue-900">
                    Đơn xin nghỉ &amp; đổi ca
                  </Link>.
                </p>
              </div>
            </div>

            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Khung giờ nhận ca cố định hàng tuần</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Áp dụng lặp lại cho mọi tuần. Click vào ô để bật/tắt ca nhận lớp mới.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAvailability}
                  disabled={savingAvailability}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{savingAvailability ? 'Đang lưu...' : 'Lưu Lịch Rảnh Lên Máy Chủ'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {availability.map((dayItem) => (
                  <div
                    key={dayItem.day}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-3 transition-all"
                  >
                    <div className="text-center pb-2.5 border-b border-slate-200">
                      <div className="text-xs font-black uppercase tracking-wide text-slate-900">
                        {dayItem.label}
                      </div>
                    </div>

                    {SHIFT_SLOTS.map((slot) => {
                      const active = Boolean(dayItem[slot.key]);
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          disabled={savingAvailability}
                          onClick={() => handleToggleShift(dayItem.day, slot.key)}
                          aria-pressed={active}
                          className={`w-full py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex flex-col items-center gap-0.5 ${
                            active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{slot.label}</span>
                          <span className="text-[10px] font-semibold">{active ? '🟢 Sẵn sàng' : '⚪ Nghỉ'}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </CoachLayout>
  );
}
