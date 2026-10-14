import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CoachLayout from '../../components/layouts/CoachLayout';
import { useApp } from '../../context/AppContext';

export default function CoachSchedulePage() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  // Shift tuần (0 = Tuần hiện tại, -1 = Tuần trước, 1 = Tuần sau)
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'UPCOMING'

  // Modal xem chi tiết ca dạy
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);

  // 1. TÍNH TOÁN DỮ LIỆU 7 NGÀY TRONG TUẦN (MỐC HÔM NAY: THỨ BA 18/11/2026)
  const weekDaysInfo = useMemo(() => {
    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    const baseMonday = new Date(2026, 10, 17); // 17/11/2026 là Thứ 2
    baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);

    const todayDate = new Date(2026, 10, 18); // 18/11/2026 là Hôm nay
    todayDate.setHours(0, 0, 0, 0);

    return dayNames.map((name, index) => {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + index);
      d.setHours(0, 0, 0, 0);

      const dayStr = String(d.getDate()).padStart(2, '0');
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      const isToday = d.getTime() === todayDate.getTime();

      return {
        dayName: name,
        date: `${dayStr}/${monthStr}`,
        fullYear: year,
        isToday,
      };
    });
  }, [weekOffset]);

  const dateRangeText = useMemo(() => {
    const start = weekDaysInfo[0];
    const end = weekDaysInfo[6];
    return `${start.date}/${start.fullYear} - ${end.date}/${end.fullYear}`;
  }, [weekDaysInfo]);

  // 2. MOCK DỮ LIỆU LỊCH GIẢNG DẠY CỦA HLV
  const predefinedScheduleData = useMemo(() => ({
    '0': [
      // T2 (17/11)
      [
        { id: 'cs_01', title: 'Pickleball Căn Bản & Footwork', time: '07:30 - 09:00', room: 'Sân Pro 01', type: 'CLASS', studentsCount: 12, maxStudents: 12, status: 'COMPLETED', roster: ['Nguyễn Văn An', 'Lê Hoàng Nam', 'Phạm Minh Đức', 'Trần Thu Trang'] },
        { id: 'cs_02', title: 'PT 1:1 Phục Hồi Khớp Cổ Chân', time: '14:00 - 15:30', room: 'Studio PT 03', type: 'PRIVATE', studentName: 'Võ Tấn Triều', status: 'COMPLETED', roster: ['Võ Tấn Triều'] },
      ],
      // T3 (18/11 - Hôm nay)
      [
        { id: 'cs_03', title: 'Pickleball Chiến Thuật Nâng Cao', time: '09:00 - 10:30', room: 'Sân Mái Che Pro 02', type: 'CLASS', studentsCount: 8, maxStudents: 10, status: 'COMPLETED', roster: ['Trần Thị Mai Anh', 'Lê Văn Tám', 'Đặng Tuấn Tú'] },
        { id: 'cs_04', title: 'Pickleball Chiến Thuật Nâng Cao (Ca Chiều)', time: '18:00 - 19:30', room: 'Sân Mái Che Pro 01', type: 'CLASS', studentsCount: 10, maxStudents: 10, status: 'IN_PROGRESS', isCurrent: true, roster: ['Võ Tấn Triều', 'Nguyễn Văn An', 'Trần Thị Mai Anh'] },
        { id: 'cs_05', title: 'PT 1:1 Sửa Kỹ Thuật Smash', time: '19:45 - 20:45', room: 'Phòng Rehab 01', type: 'PRIVATE', studentName: 'Võ Tấn Triều', status: 'UPCOMING', roster: ['Võ Tấn Triều'] },
      ],
      // T4 (19/11)
      [
        { id: 'cs_06', title: 'Gym Kháng Lực Thân Dưới (Leg Day)', time: '17:00 - 18:30', room: 'Phòng Gym Zone A', type: 'CLASS', studentsCount: 15, maxStudents: 15, status: 'UPCOMING', roster: ['Hội viên lớp Gym A1'] },
      ],
      // T5 (20/11)
      [
        { id: 'cs_07', title: 'Pickleball Giao Lưu & Đấu Tập', time: '08:30 - 10:00', room: 'Sân Pro 02', type: 'CLASS', studentsCount: 10, maxStudents: 12, status: 'UPCOMING', roster: ['Hội viên Lớp Đấu Tập'] },
        { id: 'cs_08', title: 'PT 1:1 Phục Hồi Khớp Cổ Chân', time: '16:00 - 17:30', room: 'Phòng Rehab 01', type: 'PRIVATE', studentName: 'Nguyễn Minh Anh', status: 'UPCOMING', roster: ['Nguyễn Minh Anh'] },
      ],
      // T6 (21/11)
      [
        { id: 'cs_09', title: 'Pickleball Chiến Thuật Nâng Cao', time: '18:00 - 19:30', room: 'Sân Pro 01', type: 'CLASS', studentsCount: 10, maxStudents: 10, status: 'UPCOMING', roster: ['Lớp B2'] },
      ],
      // T7 (22/11)
      [],
      // CN (23/11)
      [
        { id: 'cs_10', title: 'Giao Lưu Trận Đấu Pickleball Cup', time: '08:30 - 11:00', room: 'Cụm Sân Pro 01-04', type: 'EVENT', studentsCount: 24, maxStudents: 30, status: 'UPCOMING', roster: ['VĐV Giải FPT Open'] },
      ],
    ],
  }), []);

  // Ghép dữ liệu theo cột tuần
  const weeklySchedule = useMemo(() => {
    const rawData = predefinedScheduleData[String(weekOffset)] || [[], [], [], [], [], [], []];
    return weekDaysInfo.map((day, idx) => ({
      ...day,
      sessions: rawData[idx] || [],
    }));
  }, [weekDaysInfo, weekOffset, predefinedScheduleData]);

  // Thống kê nhanh số lượng
  const statsSummary = useMemo(() => {
    let total = 0;
    let completed = 0;
    let upcoming = 0;

    weeklySchedule.forEach((col) => {
      col.sessions.forEach((s) => {
        total++;
        if (s.status === 'COMPLETED') completed++;
        else upcoming++;
      });
    });

    return { total, completed, upcoming };
  }, [weeklySchedule]);

  // Phân loại danh sách phẳng cho List View
  const flatSessionsList = useMemo(() => {
    const list = [];
    weeklySchedule.forEach((col) => {
      col.sessions.forEach((s) => {
        list.push({ ...s, dayName: col.dayName, date: col.date });
      });
    });

    if (statusFilter === 'COMPLETED') return list.filter((s) => s.status === 'COMPLETED');
    if (statusFilter === 'UPCOMING') return list.filter((s) => s.status === 'UPCOMING' || s.status === 'IN_PROGRESS');
    return list;
  }, [weeklySchedule, statusFilter]);

  return (
    <CoachLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                WEEKLY TEACHING TIMETABLE
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Lịch Giảng Dạy Trong Tuần
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
                Quản lý các ca dạy nhóm, lớp PT 1:1, kiểm tra sĩ số và chuẩn bị giáo án huấn luyện.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/coach/attendance')}
                className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                <span>Điểm Danh Ca Dạy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Thanh Chuyển Tuần & Thanh Công Cụ */}
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
                <span>Tuần trước</span>
              </button>

              <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 font-extrabold text-xs text-slate-800 font-mono">
                {dateRangeText}
              </div>

              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Tuần sau</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>

              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="px-3.5 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 text-xs font-black uppercase hover:bg-orange-100 cursor-pointer ml-1"
                >
                  Tuần hiện tại
                </button>
              )}
            </div>

            {/* Chuyển Chế Độ Xem (Tuần / Danh Sách) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'calendar' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
                  <span>Lịch Tuần</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'list' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                  <span>Danh Sách</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chú Thích & Tóm Tắt Stats */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Đã hoàn thành ({statsSummary.completed})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Sắp diễn ra ({statsSummary.upcoming})
              </span>
            </div>
            <span>Tổng cộng: <strong className="text-slate-900 font-black">{statsSummary.total} ca dạy/tuần</strong></span>
          </div>
        </div>

        {/* 1. MÀN HÌNH CHẾ ĐỘ XEM CỘT TUẦN (CALENDAR VIEW) */}
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

                  {col.sessions.length === 0 ? (
                    <div className="py-12 text-center text-slate-300 text-[11px] font-medium italic">
                      Trống lịch dạy
                    </div>
                  ) : (
                    col.sessions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedSessionModal(item)}
                        className={`p-3 rounded-2xl border text-xs space-y-2 shadow-xs relative cursor-pointer hover:border-orange-300 transition-all ${
                          item.isCurrent
                            ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-orange-500/50'
                            : item.status === 'COMPLETED'
                            ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                            : 'bg-slate-50/90 border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            item.isCurrent
                              ? 'bg-orange-500 text-white animate-pulse'
                              : item.status === 'COMPLETED'
                              ? 'bg-emerald-200 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.isCurrent ? '⚡ Đang dạy' : item.status === 'COMPLETED' ? '✓ Đã hoàn thành' : '• Sắp diễn ra'}
                          </span>

                          <span className={`text-[9px] font-bold ${item.isCurrent ? 'text-orange-400' : 'text-orange-600'}`}>
                            {item.type === 'PRIVATE' ? 'PT 1:1' : 'Lớp nhóm'}
                          </span>
                        </div>

                        <div className="font-black text-xs leading-snug">{item.title}</div>

                        <div className={`font-mono text-[10px] font-bold flex items-center gap-1 ${item.isCurrent ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          <span>{item.time}</span>
                        </div>

                        <div className={`text-[10px] flex items-center gap-1 ${item.isCurrent ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="material-symbols-outlined text-[12px]">location_on</span>
                          <span className="truncate">{item.room}</span>
                        </div>

                        <div className={`pt-1.5 border-t text-[10px] font-bold flex items-center justify-between ${
                          item.isCurrent ? 'border-slate-800 text-orange-400' : 'border-slate-200/60 text-orange-600'
                        }`}>
                          <span>{item.type === 'PRIVATE' ? `HV: ${item.studentName}` : `Sĩ số: ${item.studentsCount}/${item.maxStudents}`}</span>
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. MÀN HÌNH CHẾ ĐỘ XEM DANH SÁCH (LIST VIEW) */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            
            {/* Lọc Trạng Thái Trong List View */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Lọc theo:</span>
              {[
                { id: 'ALL', label: 'Tất cả ca' },
                { id: 'UPCOMING', label: 'Ca sắp diễn ra' },
                { id: 'COMPLETED', label: 'Ca đã xong' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === filter.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {flatSessionsList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                <span className="material-symbols-outlined text-[40px] text-slate-300">event_busy</span>
                <p className="text-xs font-bold text-slate-500">Không có ca dạy nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              flatSessionsList.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-orange-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md font-black">
                      <span className="material-symbols-outlined text-[22px]">
                        {session.type === 'PRIVATE' ? 'person' : 'sports_tennis'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-orange-600 uppercase">
                          {session.dayName} ({session.date})
                        </span>
                        
                        {session.status === 'COMPLETED' ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            ✓ Đã hoàn thành
                          </span>
                        ) : session.isCurrent ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800 animate-pulse">
                            ⚡ Đang diễn ra
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
                        <span>{session.type === 'PRIVATE' ? `HV: ${session.studentName}` : `Sĩ số: ${session.studentsCount}/${session.maxStudents}`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setSelectedSessionModal(session)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Xem Chi Tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/coach/attendance')}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer"
                    >
                      Điểm Danh
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MODAL XEM NHANH DANH SÁCH HỌC VIÊN CA DẠY */}
        {selectedSessionModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-slate-200 animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => setSelectedSessionModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shrink-0">
                  <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    CLASS ROSTER PREVIEW
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedSessionModal.title}</h3>
                </div>
              </div>

              {/* Thông tin thời gian & địa điểm */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Khung giờ</span>
                  <strong className="text-slate-900 font-mono">{selectedSessionModal.time}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Địa điểm sân</span>
                  <strong className="text-slate-900">{selectedSessionModal.room}</strong>
                </div>
              </div>

              {/* Danh sách học viên trong ca */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Danh sách học viên trong ca:</span>
                  <span className="text-orange-600 font-mono">
                    {selectedSessionModal.type === 'PRIVATE' ? '1/1 Học viên' : `${selectedSessionModal.studentsCount}/${selectedSessionModal.maxStudents} Học viên`}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto space-y-1.5 text-xs">
                  {selectedSessionModal.roster && selectedSessionModal.roster.length > 0 ? (
                    selectedSessionModal.roster.map((name, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0">
                        <span className="font-bold text-slate-800">{i + 1}. {name}</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Đã giữ chỗ
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">Chưa có học viên giữ chỗ.</p>
                  )}
                </div>
              </div>

              {/* Chuyển tới điểm danh */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSessionModal(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSessionModal(null);
                    navigate('/coach/attendance');
                  }}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">fact_check</span>
                  <span>Điểm Danh Ca Này</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CoachLayout>
  );
}