import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { orders, coaches } = useApp();
  
  // Shift tuần dựa trên ngày gốc (17/11/2026 - Thứ 2)
  const [weekOffset, setWeekOffset] = useState(0); 
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  
  // Modals State
  const [qrModalSession, setQrModalSession] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null); // Modal xem chi tiết HLV

  // 1. TÍNH TOÁN NGÀY THỰC TẾ CHO 7 NGÀY TRONG TUẦN (MỐC HÔM NAY: 18/11/2026)
  const weekDaysInfo = useMemo(() => {
    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    
    // Ngày gốc Thứ 2 tuần hiện tại: 17/11/2026
    const baseMonday = new Date(2026, 10, 17); 
    baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);

    // Ngày hôm nay thực tế trong hệ thống: 18/11/2026
    const todayDate = new Date(2026, 10, 18);
    todayDate.setHours(0, 0, 0, 0);

    return dayNames.map((name, index) => {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + index);
      d.setHours(0, 0, 0, 0);

      const dayStr = String(d.getDate()).padStart(2, '0');
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const formattedDate = `${dayStr}/${monthStr}`;

      const isToday = d.getTime() === todayDate.getTime();
      const isPast = d.getTime() < todayDate.getTime();
      const isFuture = d.getTime() > todayDate.getTime();

      return {
        dayName: name,
        date: formattedDate,
        fullYear: year,
        fullYearDate: d,
        isToday,
        isPast,
        isFuture,
      };
    });
  }, [weekOffset]);

  // Hiển thị khoảng ngày trên header
  const dateRangeText = useMemo(() => {
    const start = weekDaysInfo[0];
    const end = weekDaysInfo[6];
    return `${start.date}/${start.fullYear} - ${end.date}/${end.fullYear}`;
  }, [weekDaysInfo]);

  // 2. MOCK DATA CHUẨN LỊCH MẪU
  const predefinedSchedules = useMemo(() => ({
    '-1': [
      [{ id: 'w46_1', title: 'Pickleball Căn Bản', time: '18:00 - 19:30', coach: 'HLV Lê Anh Tuấn', room: 'Sân Pro 01', status: 'COMPLETED' }],
      [],
      [{ id: 'w46_2', title: 'Yoga Phục Hồi Thể Lực', time: '07:00 - 08:30', coach: 'HLV Vũ Thu Hà', room: 'Studio 02', status: 'COMPLETED' }],
      [],
      [{ id: 'w46_3', title: 'PT 1:1 Cổ Chân & Cơ Cốt Lõi', time: '16:00 - 17:30', coach: 'HLV Lê Anh Tuấn', room: 'Phòng Rehab', status: 'COMPLETED' }],
      [],
      [],
    ],
    '0': [
      // T2 (17/11)
      [{ id: 's_01', title: 'PT 1:1 Phục Hồi Khớp Cổ Chân', time: '16:00 - 17:30', coach: 'HLV Lê Anh Tuấn', room: 'Phòng Rehab 01', status: 'COMPLETED' }],
      // T3 (18/11 - Hôm nay)
      [{ id: 's_02', title: 'Pickleball Chiến Thuật Nâng Cao', time: '18:00 - 19:30', coach: 'HLV Lê Anh Tuấn', room: 'Sân Pro 01', status: 'UPCOMING' }],
      [],
      // T5 (20/11)
      [{ id: 's_03', title: 'Yoga Phục Hồi Thể Lực', time: '07:00 - 08:30', coach: 'HLV Vũ Thu Hà', room: 'Studio 02', status: 'UPCOMING' }],
      // T6 (21/11)
      [{ id: 's_04', title: 'PT 1:1 Sửa Kỹ Thuật Smash', time: '17:00 - 18:30', coach: 'HLV Nguyễn Quốc Bảo', room: 'Nhà Đa Năng 01', status: 'UPCOMING' }],
      [],
      // CN (23/11)
      [{ id: 's_05', title: 'Giao Lưu Trận Đấu Pickleball Cup', time: '08:30 - 11:00', coach: 'Ban Huấn Luyện', room: 'Cụm Sân Pro 01-04', status: 'UPCOMING' }],
    ],
    '1': [
      [{ id: 'w48_1', title: 'Pickleball Chiến Thuật Nâng Cao', time: '18:00 - 19:30', coach: 'HLV Lê Anh Tuấn', room: 'Sân Pro 01', status: 'UPCOMING' }],
      [],
      [{ id: 'w48_2', title: 'Yoga Phục Hồi Thể Lực', time: '07:00 - 08:30', coach: 'HLV Vũ Thu Hà', room: 'Studio 02', status: 'UPCOMING' }],
      [],
      [{ id: 'w48_3', title: 'PT 1:1 Sửa Kỹ Thuật Đập Cầu', time: '17:00 - 18:30', coach: 'HLV Nguyễn Quốc Bảo', room: 'Nhà Đa Năng 01', status: 'UPCOMING' }],
      [],
      [],
    ],
  }), []);

  // 3. THUẬT TOÁN BÓC TÁCH NGÀY CHỐNG LẶP DỮ LIỆU
  const matchesDay = (shiftTime, day) => {
    if (!shiftTime) return false;
    if (shiftTime.includes(day.date)) return true;
    if (shiftTime.includes('Mỗi ngày') || shiftTime.includes('Hàng ngày')) return true;

    const dayNameMap = {
      'Thứ Hai': { num: '2', keywords: ['Thứ 2', 'Thứ Hai', 'T2'] },
      'Thứ Ba': { num: '3', keywords: ['Thứ 3', 'Thứ Ba', 'T3'] },
      'Thứ Tư': { num: '4', keywords: ['Thứ 4', 'Thứ Tư', 'T4'] },
      'Thứ Năm': { num: '5', keywords: ['Thứ 5', 'Thứ Năm', 'T5'] },
      'Thứ Sáu': { num: '6', keywords: ['Thứ 6', 'Thứ Sáu', 'T6'] },
      'Thứ Bảy': { num: '7', keywords: ['Thứ 7', 'Thứ Bảy', 'T7'] },
      'Chủ Nhật': { num: 'CN', keywords: ['Chủ Nhật', 'CN'] },
    };

    const target = dayNameMap[day.dayName];
    if (!target) return false;

    if (target.keywords.some((kw) => shiftTime.includes(kw))) return true;

    if (shiftTime.includes('Thứ')) {
      const daysPart = shiftTime.split('Thứ')[1] || '';
      const numberRegex = new RegExp(`\\b${target.num}\\b`);
      if (numberRegex.test(daysPart)) return true;
    }

    return false;
  };

  // 4. GHÉP DỮ LIỆU VÀO CỘT VÀ LỌC TRÙNG
  const weeklySchedule = useMemo(() => {
    const rawData = predefinedSchedules[String(weekOffset)];
    const confirmedOrders = (orders || []).filter((o) => o.status === 'CONFIRMED');

    return weekDaysInfo.map((day, idx) => {
      let items = rawData && rawData[idx] ? [...rawData[idx]] : [];

      if (weekOffset === 0 && confirmedOrders.length > 0) {
        confirmedOrders.forEach((ord) => {
          if (matchesDay(ord.shiftTime, day)) {
            const timeClean = ord.shiftTime ? ord.shiftTime.split('(')[0].trim() : '18:00 - 19:30';
            
            const isDuplicate = items.some(
              (it) => it.id === ord.id || (it.title === ord.className && it.time === timeClean)
            );

            if (!isDuplicate) {
              items.push({
                id: ord.id,
                title: ord.className,
                time: timeClean,
                coach: ord.coachName || 'HLV Lê Anh Tuấn',
                room: ord.room || 'Sân Tập FPT',
                status: 'UPCOMING',
              });
            }
          }
        });
      }

      const sanitizedItems = items.map((item) => {
        if (day.isFuture && item.status === 'ABSENT') {
          return { ...item, status: 'UPCOMING' };
        }
        return item;
      });

      return {
        ...day,
        items: sanitizedItems,
      };
    });
  }, [weekDaysInfo, weekOffset, predefinedSchedules, orders]);

  const totalSessions = useMemo(() => {
    return weeklySchedule.reduce((acc, col) => acc + col.items.length, 0);
  }, [weeklySchedule]);

  // HÀM TÌM & MỞ MODAL THÔNG TIN HUẤN LUYỆN VIÊN
  const handleOpenCoachModal = (coachName) => {
    // Tìm HLV trong danh sách coaches của AppContext
    const foundCoach = (coaches || []).find((c) =>
      c.name?.toLowerCase().includes(coachName.toLowerCase()) ||
      coachName.toLowerCase().includes(c.name?.toLowerCase())
    );

    // Dữ liệu mặc định nếu chưa có record chi tiết
    const fallbackCoach = {
      id: 'coa_temp',
      name: coachName,
      role: 'Master Coach FPT Sports Center',
      specialty: 'Pickleball PPR Certified & Biomechanics (NASM)',
      rating: 4.9,
      reviewCount: 38,
      experience: '6 năm kinh nghiệm huấn luyện thi đấu chuyên nghiệp',
      certifications: ['Chứng chỉ PPR Level 2 Pro', 'NASM Certified Personal Trainer', 'Cử nhân Thể dục Thể thao'],
      phone: '0905 333 444',
      email: 'anhtuan.le@fpt.edu.vn',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: 'Chuyên gia huấn luyện kỹ thuật bộ môn Pickleball & Tennis. Đã đào tạo thành công hơn 200+ học viên đạt giải phong trào FPT.',
    };

    setSelectedCoach(foundCoach || fallbackCoach);
  };

  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                  MEMBER TIMETABLE
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Lịch Tập Cá Nhân
              </h1>

              <p className="text-xs text-slate-300 font-medium">
                Theo dõi các ca tập cá nhân, xem thông tin HLV phụ trách và mã check-in.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/member/classes"
                className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Đặt Lớp Học Mới</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Thanh Điều Hướng Thời Gian */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Cụm Nút Chuyển Tuần */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                <span>Trước</span>
              </button>

              <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 font-extrabold text-xs text-slate-800 font-mono">
                {dateRangeText}
              </div>

              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Sau</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>

              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="px-3.5 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 text-xs font-black uppercase hover:bg-orange-100 cursor-pointer ml-1"
                >
                  Hôm nay
                </button>
              )}
            </div>

            {/* Chuyển chế độ xem */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  viewMode === 'calendar' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
                title="Xem lịch tuần"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
                title="Xem dạng danh sách"
              >
                <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
              </button>
            </div>
          </div>

          {/* Chú thích trạng thái */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Ca Sắp Diễn Ra
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Đã Tham Gia
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Vắng Mặt
              </span>
            </div>
            <span>Tổng cộng: <strong className="text-slate-900 font-extrabold">{totalSessions} ca/tuần</strong></span>
          </div>
        </div>

        {/* Màn Hình Lịch Dạng Tuần */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              {weeklySchedule.map((col, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-3.5 flex flex-col gap-3 border transition-all ${
                    col.isToday
                      ? 'bg-orange-50/40 border-2 border-orange-500 shadow-sm'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-black block uppercase ${col.isToday ? 'text-orange-600' : 'text-slate-900'}`}>
                        {col.dayName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">{col.date}</span>
                    </div>
                    {col.isToday && (
                      <span className="text-[9px] bg-orange-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                        Hôm nay
                      </span>
                    )}
                  </div>

                  {col.items.length === 0 ? (
                    <div className="py-10 text-center text-slate-300 text-[11px] font-medium italic">
                      Trống lịch
                    </div>
                  ) : (
                    col.items.map((it) => (
                      <div
                        key={it.id}
                        className={`p-3 rounded-2xl border text-xs space-y-2 shadow-xs relative ${
                          it.status === 'COMPLETED'
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : it.status === 'ABSENT'
                            ? 'bg-red-50/80 border-red-200 text-red-950 opacity-75'
                            : 'bg-slate-50/90 border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {it.status === 'COMPLETED' ? (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                              ✓ Đã tham gia
                            </span>
                          ) : it.status === 'ABSENT' ? (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-200 text-red-800">
                              • Vắng mặt
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              • Sắp diễn ra
                            </span>
                          )}

                          {it.status === 'UPCOMING' && (
                            <button
                              type="button"
                              onClick={() => setQrModalSession(it)}
                              className="p-1 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Mã Check-in"
                            >
                              <span className="material-symbols-outlined text-[18px]">qr_code</span>
                            </button>
                          )}
                        </div>

                        <div className="font-black text-xs leading-snug">{it.title}</div>
                        
                        <div className="font-mono text-[10px] font-bold text-slate-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          <span>{it.time}</span>
                        </div>
                        
                        <div className="text-[10px] text-slate-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">location_on</span>
                          <span className="truncate">{it.room}</span>
                        </div>

                        {/* NÚT TÊN HLV CHO PHÉP BẤM XEM CHI TIẾT HOÀN TRỈNH */}
                        <button
                          type="button"
                          onClick={() => handleOpenCoachModal(it.coach)}
                          className="pt-1.5 border-t border-slate-200/60 font-bold text-[10px] text-orange-600 hover:text-orange-800 hover:underline flex items-center gap-1 cursor-pointer w-full text-left transition-colors"
                          title="Bấm để xem hồ sơ HLV"
                        >
                          <span className="material-symbols-outlined text-[13px]">badge</span>
                          <span className="truncate">{it.coach}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Màn Hình Dạng Danh Sách */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {totalSessions === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                <span className="material-symbols-outlined text-[40px] text-slate-300">event_busy</span>
                <p className="text-xs font-bold text-slate-500">Trống lịch tập trong khoảng thời gian này.</p>
              </div>
            ) : (
              weeklySchedule.flatMap(col => col.items.map(item => ({ ...item, dayName: col.dayName, date: col.date }))).map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-orange-400 flex items-center justify-center shrink-0 shadow-md font-black">
                      ⚡
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-orange-600 uppercase">
                          {session.dayName} ({session.date})
                        </span>
                        
                        {session.status === 'COMPLETED' ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            ✓ Đã tham gia
                          </span>
                        ) : session.status === 'ABSENT' ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                            • Vắng mặt
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            • Sắp diễn ra
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-slate-900">{session.title}</h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span>Thời gian: <strong className="text-slate-900 font-bold">{session.time}</strong></span>
                        <span>•</span>
                        <span>Địa điểm: <strong className="text-slate-900 font-bold">{session.room}</strong></span>
                        <span>•</span>
                        <span>HLV: 
                          <button
                            type="button"
                            onClick={() => handleOpenCoachModal(session.coach)}
                            className="ml-1 text-orange-600 hover:text-orange-800 hover:underline font-bold cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <span>{session.coach}</span>
                            <span className="material-symbols-outlined text-[14px]">info</span>
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>

                  {session.status === 'UPCOMING' && (
                    <button
                      type="button"
                      onClick={() => setQrModalSession(session)}
                      className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20 shrink-0 self-end sm:self-center"
                    >
                      <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                      <span>Mã Check-in</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* MODAL 1: QR CHECK-IN */}
        {qrModalSession && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative border border-slate-200">
              <button
                type="button"
                onClick={() => setQrModalSession(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 inline-block">
                MÃ ENTRY PASS VÀO SÂN
              </span>

              <div>
                <h3 className="text-base font-black text-slate-900">{qrModalSession.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{qrModalSession.time} • {qrModalSession.room}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SESSION_${qrModalSession.id}`}
                  alt="Session QR"
                  className="w-44 h-44 mx-auto rounded-lg shadow-sm"
                />
                <p className="font-mono text-xs font-bold text-slate-800 mt-2">MÃ CA: #{qrModalSession.id.toUpperCase()}</p>
              </div>

              <p className="text-xs text-slate-500">Đưa mã trước máy quét tại cổng xoay RFID để điểm danh vào tập.</p>
            </div>
          </div>
        )}

        {/* MODAL 2: XEM HỒ SƠ & ĐÁNH GIÁ HUẤN LUYỆN VIÊN */}
        {selectedCoach && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-slate-200 animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => setSelectedCoach(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <img
                  src={selectedCoach.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={selectedCoach.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500 shadow-sm shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      MASTER COACH
                    </span>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                      ★ {selectedCoach.rating || 4.9} ({selectedCoach.reviewCount || 38})
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{selectedCoach.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedCoach.specialty}</p>
                </div>
              </div>

              {/* Thông tin kinh nghiệm & chứng chỉ */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Kinh nghiệm & Tiểu sử:</span>
                  <p className="text-slate-600 leading-relaxed">{selectedCoach.bio || selectedCoach.experience}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-900 block mb-1">Bằng cấp & Chứng chỉ chuyên môn:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedCoach.certifications || ['Chứng chỉ PPR Level 2 Pro', 'NASM Personal Trainer', 'Cử nhân TDTT']).map((cert, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
                        ✓ {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Liên hệ: <strong className="text-slate-800">{selectedCoach.phone || '0905 333 444'}</strong></span>
                  <span>Email: <strong className="text-slate-800">{selectedCoach.email || 'hlv@fpt.edu.vn'}</strong></span>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCoach(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCoach(null);
                    navigate('/member/coach-reviews');
                  }}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">rate_review</span>
                  <span>Đánh Giá HLV</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}