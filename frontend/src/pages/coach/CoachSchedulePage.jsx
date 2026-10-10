import React from 'react';
import { Link } from 'react-router-dom';
import CoachLayout from '../../components/layouts/CoachLayout';

export default function CoachSchedulePage() {
  const weeklySchedule = [
    {
      day: 'Thứ Hai',
      date: '18/11',
      classes: [
        { title: 'Tennis Căn Bản', time: '07:30 - 09:00', room: 'Sân Pro 03', students: 6, status: 'Đã hoàn thành' },
        { title: 'PT Cá Nhân 1:1', time: '14:00 - 15:30', room: 'Biomechanics Lab', studentName: 'Đặng Tuấn Tú', status: 'Đã hoàn thành' },
      ],
    },
    {
      day: 'Thứ Ba (Hôm nay)',
      date: '19/11',
      isToday: true,
      classes: [
        { title: 'Yoga Năng Lượng', time: '07:00 - 08:30', room: 'Studio 01', students: 18, status: 'Đã hoàn thành' },
        { title: 'Pickleball Chiến Thuật', time: '09:00 - 10:30', room: 'Sân Pro 01', students: 8, status: 'Đã hoàn thành' },
        { title: 'Yoga Phục Hồi Thể Lực', time: '18:00 - 19:30', room: 'Studio 02', students: 12, status: 'Sắp diễn ra', isNext: true },
      ],
    },
    {
      day: 'Thứ Tư',
      date: '20/11',
      classes: [
        { title: 'Tennis Nâng Cao', time: '17:30 - 19:00', room: 'Sân Trung Tâm', students: 6, status: 'Chưa diễn ra' },
      ],
    },
    {
      day: 'Thứ Năm',
      date: '21/11',
      classes: [
        { title: 'Pickleball Giao Lưu & Đấu Tập', time: '08:30 - 10:00', room: 'Sân Pro 02', students: 10, status: 'Chưa diễn ra' },
        { title: 'PT 1:1 Phục Hồi Khớp', time: '16:00 - 17:30', room: 'Rehab Zone', studentName: 'Nguyễn Minh Anh', status: 'Chưa diễn ra' },
      ],
    },
    {
      day: 'Thứ Sáu',
      date: '22/11',
      classes: [
        { title: 'Yoga Thư Giãn Cuối Tuần', time: '18:00 - 19:30', room: 'Studio 01', students: 16, status: 'Chưa diễn ra' },
      ],
    },
  ];

  return (
    <CoachLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                COACH DASHBOARD · FLOW 2
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-slate-900">
              Lịch Giảng Dạy Trong Tuần
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Quản lý ca dạy, sĩ số học viên và chuẩn bị giáo án cho từng buổi tập.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/coach/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-secondary-container font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">fact_check</span>
              <span>Điểm Danh Ca Dạy Hiện Tại</span>
            </Link>
          </div>
        </div>

        {/* Timetable Weekly Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {weeklySchedule.map((col, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-4 flex flex-col gap-3 border transition-all ${
                col.isToday
                  ? 'bg-white border-2 border-primary shadow-md ring-2 ring-secondary-container/30'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className={`text-xs font-bold uppercase block ${col.isToday ? 'text-secondary' : 'text-slate-800'}`}>
                    {col.day}
                  </span>
                  <span className="text-[11px] text-slate-400">{col.date}</span>
                </div>
                {col.isToday && (
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-primary text-[10px] font-bold uppercase">
                    Hôm nay
                  </span>
                )}
              </div>

              {/* Class Cards in Column */}
              <div className="flex flex-col gap-3">
                {col.classes.map((cls, cIdx) => (
                  <div
                    key={cIdx}
                    className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                      cls.isNext
                        ? 'bg-primary text-white border-primary shadow-md ring-2 ring-secondary-container'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold font-mono ${cls.isNext ? 'text-secondary-container' : 'text-slate-700'}`}>
                          {cls.time}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            cls.isNext
                              ? 'bg-secondary-container text-primary'
                              : cls.status === 'Đã hoàn thành'
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {cls.status}
                        </span>
                      </div>

                      <h4 className={`font-bold text-sm mb-1 ${cls.isNext ? 'text-white' : 'text-slate-900'}`}>
                        {cls.title}
                      </h4>

                      <div className={`text-[11px] flex items-center gap-1 ${cls.isNext ? 'text-slate-300' : 'text-slate-500'}`}>
                        <span className="material-symbols-outlined text-[14px]">stadium</span>
                        <span>{cls.room}</span>
                      </div>

                      {cls.students && (
                        <div className={`text-[11px] mt-1 font-semibold ${cls.isNext ? 'text-secondary-container' : 'text-primary'}`}>
                          Sĩ số: {cls.students} học viên
                        </div>
                      )}
                      {cls.studentName && (
                        <div className={`text-[11px] mt-1 font-semibold ${cls.isNext ? 'text-secondary-container' : 'text-primary'}`}>
                          HV: {cls.studentName}
                        </div>
                      )}
                    </div>

                    {cls.isNext && (
                      <Link
                        to="/coach/attendance"
                        className="mt-3 py-1.5 rounded-lg bg-secondary-container text-primary font-bold text-center uppercase tracking-wider block hover:bg-secondary-fixed-dim transition-colors"
                      >
                        Bắt đầu điểm danh
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CoachLayout>
  );
}
