import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { cancelMemberBooking, getMemberBookingSchedule } from '../../services/bookingApi';

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 23;
const HOUR_HEIGHT = 64;
const WEEKDAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(amount || 0);

const formatTime = (value) => new Date(value).toLocaleTimeString('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

const formatShortDate = (date) => date.toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
});

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfWeek = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const getWeekDays = (weekStart) => WEEKDAYS.map((weekday, index) => {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + index);
  return { weekday, date, key: getDateKey(date) };
});

const getWeekLabel = (weekStart, weekEnd) => {
  const startLabel = weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const endLabel = weekEnd.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
};

const getPositionedEntries = (entries) => {
  const sortedEntries = [...entries].sort(
    (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
  );
  const lanes = [];
  const positionedEntries = sortedEntries.map((entry) => {
    const start = new Date(entry.startTime).getTime();
    const end = new Date(entry.endTime).getTime();
    let lane = lanes.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) lane = lanes.length;
    lanes[lane] = end;
    return { entry, lane };
  });

  return positionedEntries.map((positioned) => ({
    ...positioned,
    laneCount: lanes.length,
  }));
};

function ScheduleGrid({ entries, weekDays, bookingType }) {
  const entriesByDate = useMemo(() => {
    const groups = new Map(weekDays.map(({ key }) => [key, []]));
    entries.forEach((entry) => {
      const key = getDateKey(new Date(entry.startTime));
      if (groups.has(key)) groups.get(key).push(entry);
    });
    return groups;
  }, [entries, weekDays]);

  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR },
    (_, index) => DAY_START_HOUR + index,
  );
  const gridHeight = hours.length * HOUR_HEIGHT;
  const accentClass = bookingType === 'CLASS'
    ? 'border-l-4 border-l-violet-500 bg-violet-50 text-violet-950'
    : 'border-l-4 border-l-sky-500 bg-sky-50 text-sky-950';

  return (
    <div className="overflow-x-auto rounded-b-2xl">
      <div className="min-w-[980px]">
        <div
          className="grid border-b border-slate-200 bg-slate-50"
          style={{ gridTemplateColumns: '68px repeat(7, minmax(125px, 1fr))' }}
        >
          <div className="border-r border-slate-200" aria-hidden="true" />
          {weekDays.map(({ weekday, date, key }) => {
            const isToday = key === getDateKey(new Date());
            return (
              <div
                key={key}
                className={`border-r border-slate-200 px-2 py-3 text-center last:border-r-0 ${isToday ? 'bg-lime-50' : ''}`}
              >
                <div className="text-xs font-semibold text-slate-500">{weekday}</div>
                <div className={`mt-1 text-sm font-bold ${isToday ? 'text-lime-800' : 'text-slate-800'}`}>
                  {formatShortDate(date)}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: '68px repeat(7, minmax(125px, 1fr))' }}
        >
          <div className="relative border-r border-slate-200" style={{ height: gridHeight }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-slate-400"
                style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {weekDays.map(({ key }) => {
            const positionedEntries = getPositionedEntries(entriesByDate.get(key) || []);
            return (
              <div
                key={key}
                className="relative border-r border-slate-200 last:border-r-0"
                style={{ height: gridHeight }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-slate-100"
                    style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
                    aria-hidden="true"
                  />
                ))}
                {positionedEntries.map(({ entry, lane, laneCount }) => {
                  const start = new Date(entry.startTime);
                  const end = new Date(entry.endTime);
                  const startMinutes = start.getHours() * 60 + start.getMinutes();
                  const endMinutes = end.getHours() * 60 + end.getMinutes();
                  const top = Math.max(
                    0,
                    ((startMinutes - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT,
                  );
                  const bottom = Math.min(
                    gridHeight,
                    ((endMinutes - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT,
                  );
                  const height = Math.max(48, bottom - top);
                  const width = 100 / laneCount;
                  const left = width * lane;

                  return (
                    <article
                      key={`${entry.bookingType}-${entry.bookingId}`}
                      aria-label={`${entry.title}, ${formatTime(entry.startTime)}–${formatTime(entry.endTime)}, ${entry.location}`}
                      className={`absolute z-10 overflow-hidden rounded-md px-2 py-1.5 text-left shadow-sm ${accentClass}`}
                      style={{
                        top: Math.min(top, gridHeight - 48),
                        height: Math.min(height, gridHeight - Math.min(top, gridHeight - 48)),
                        left: `calc(${left}% + 3px)`,
                        width: `calc(${width}% - 6px)`,
                      }}
                    >
                      <h3 className="truncate text-xs font-bold leading-4">{entry.title}</h3>
                      <p className="mt-0.5 truncate text-[11px] leading-4">{entry.sportName}</p>
                      <p className="truncate text-[11px] leading-4">{formatTime(entry.startTime)}–{formatTime(entry.endTime)}</p>
                      <p className="truncate text-[11px] leading-4" title={entry.location}>{entry.location}</p>
                      <p className="truncate text-[11px] font-semibold leading-4">{formatMoney(entry.amountPaid)}</p>
                    </article>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MemberSchedulePage() {
  const [entries, setEntries] = useState([]);
  const [bookingType, setBookingType] = useState('CLASS');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const intervalId = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let current = true;
    getMemberBookingSchedule()
      .then((rows) => {
        if (current) setEntries(rows);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải thời khóa biểu.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekEnd = weekDays[weekDays.length - 1].date;
  const selectedEntries = entries.filter((entry) => entry.bookingType === bookingType);
  const entriesForWeek = selectedEntries.filter((entry) => {
    const key = getDateKey(new Date(entry.startTime));
    return weekDays.some((day) => day.key === key);
  });
  const classCount = entries.filter((entry) => entry.bookingType === 'CLASS').length;
  const courtCount = entries.filter((entry) => entry.bookingType === 'COURT').length;

  const handleCancelBooking = async (entry) => {
    const bookingLabel = entry.bookingType === 'CLASS' ? 'lớp học' : 'sân';
    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy ${bookingLabel} "${entry.title}" không?\n\n` +
      'Yêu cầu hủy phải được thực hiện trước giờ bắt đầu ít nhất 2 tiếng. ' +
      'Khoản đã thanh toán không được tự động hoàn lại.',
    );
    if (!confirmed) return;

    const bookingKey = `${entry.bookingType}-${entry.bookingId}`;
    setCancellingBookingId(bookingKey);
    setError('');
    setSuccessMessage('');
    try {
      await cancelMemberBooking(entry.bookingType, entry.bookingId);
      setEntries((currentEntries) => currentEntries.filter(
        (currentEntry) => `${currentEntry.bookingType}-${currentEntry.bookingId}` !== bookingKey,
      ));
      setSuccessMessage(`Đã hủy ${bookingLabel} "${entry.title}". Khoản đã thanh toán không được tự động hoàn lại.`);
      try {
        const refreshedEntries = await getMemberBookingSchedule();
        setEntries(refreshedEntries);
      } catch (refreshError) {
        setError(`Đã hủy booking thành công nhưng không thể tải lại lịch: ${refreshError.message}`);
      }
    } catch (cancelError) {
      setError(cancelError.message || 'Không thể hủy booking. Vui lòng thử lại.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  const changeWeek = (amount) => {
    setWeekStart((currentWeek) => {
      const nextWeek = new Date(currentWeek);
      nextWeek.setDate(nextWeek.getDate() + amount * 7);
      return nextWeek;
    });
  };

  const goToCurrentWeek = () => setWeekStart(startOfWeek(new Date()));

  return (
    <MemberLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-secondary">LỊCH BOOKING CỦA BẠN</div>
            <h1 className="mt-1 font-headline-xl text-2xl font-bold text-primary sm:text-3xl">Thời khóa biểu của tôi</h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi riêng lịch các lớp học và lịch đặt sân đã xác nhận từ hệ thống.
            </p>
          </div>
          <Link to="/member/book" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">
            Đặt sân hoặc booking lớp
          </Link>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {successMessage && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Thời khóa biểu booking">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn thời khóa biểu">
              <button
                type="button"
                aria-pressed={bookingType === 'CLASS'}
                onClick={() => setBookingType('CLASS')}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  bookingType === 'CLASS'
                    ? 'bg-violet-100 text-violet-900 ring-1 ring-violet-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Lịch lớp học <span className="ml-1 opacity-70">({classCount})</span>
              </button>
              <button
                type="button"
                aria-pressed={bookingType === 'COURT'}
                onClick={() => setBookingType('COURT')}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  bookingType === 'COURT'
                    ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Lịch đặt sân <span className="ml-1 opacity-70">({courtCount})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeWeek(-1)}
                aria-label="Tuần trước"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={goToCurrentWeek}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => changeWeek(1)}
                aria-label="Tuần sau"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
              <span className="hidden min-w-32 text-right text-sm font-semibold text-slate-700 sm:inline">
                {getWeekLabel(weekStart, weekEnd)}
              </span>
            </div>
          </div>

          <div className="px-4 pt-4">
            <h2 className={`text-lg font-bold ${bookingType === 'CLASS' ? 'text-violet-950' : 'text-sky-950'}`}>
              {bookingType === 'CLASS' ? 'Thời khóa biểu lớp học' : 'Thời khóa biểu đặt sân'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {bookingType === 'CLASS'
                ? 'Các buổi học bạn đã đăng ký, hiển thị theo ngày và giờ trong tuần.'
                : 'Các khung giờ sân bạn đã đặt, hiển thị theo ngày và giờ trong tuần.'}
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">Đang tải thời khóa biểu...</div>
          ) : entriesForWeek.length === 0 ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">
                {bookingType === 'CLASS' ? 'school' : 'sports_tennis'}
              </span>
              <h3 className="mt-3 font-bold text-slate-800">
                {bookingType === 'CLASS' ? 'Tuần này bạn chưa có lịch lớp học' : 'Tuần này bạn chưa có lịch đặt sân'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedEntries.length > 0
                  ? 'Dùng mũi tên để xem lịch của các tuần khác.'
                  : 'Các booking đã xác nhận sẽ xuất hiện tại đây.'}
              </p>
              {selectedEntries.length === 0 && (
                <Link to="/member/book" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">
                  {bookingType === 'CLASS' ? 'Tìm lớp học' : 'Tìm sân chơi'}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-4">
              <ScheduleGrid entries={entriesForWeek} weekDays={weekDays} bookingType={bookingType} />
              <div className="space-y-3" aria-label="Các booking trong tuần">
                {entriesForWeek.map((entry) => {
                  const bookingKey = `${entry.bookingType}-${entry.bookingId}`;
                  const canCancel = new Date(entry.startTime).getTime() - (2 * 60 * 60 * 1000) >= currentTime;
                  const isCancelling = cancellingBookingId === bookingKey;
                  return (
                    <article
                      key={bookingKey}
                      data-booking-id={entry.bookingId}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-slate-900">{entry.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {entry.sportName} · {entry.location}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(entry.startTime).toLocaleString('vi-VN', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' – '}{formatTime(entry.endTime)} · {formatMoney(entry.amountPaid)}
                        </p>
                      </div>
                      {canCancel ? (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(entry)}
                          disabled={isCancelling}
                          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-lg">event_busy</span>
                          {isCancelling ? 'Đang hủy...' : entry.bookingType === 'CLASS' ? 'Hủy lớp học' : 'Hủy sân'}
                        </button>
                      ) : (
                        <span className="shrink-0 text-xs font-medium text-slate-500">
                          Không thể hủy trong vòng 2 tiếng trước giờ bắt đầu
                        </span>
                      )}
                    </article>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                Có thể hủy booking trước giờ bắt đầu ít nhất 2 tiếng. Hủy booking không tự động hoàn tiền đã thanh toán.
              </p>
            </div>
          )}
        </section>
      </div>
    </MemberLayout>
  );
}
