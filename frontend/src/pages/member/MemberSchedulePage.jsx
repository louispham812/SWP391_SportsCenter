import React, { useState } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

export default function MemberSchedulePage() {
  const { classes, bookClass, cancelClass, joinWaitlist, coaches } = useApp();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my-bookings' | 'calendar'
  const [selectedSport, setSelectedSport] = useState('all');
  const [bookingSuccessModal, setBookingSuccessModal] = useState(null);
  const [selectedCoachProfile, setSelectedCoachProfile] = useState(null);

  const handleBook = (cls) => {
    if (cls.enrolled >= cls.capacity) {
      joinWaitlist(cls.id);
      return;
    }
    bookClass(cls.id);
    setBookingSuccessModal(cls);
  };

  const handleCancelBooking = (clsId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đặt chỗ buổi học này không? Chỗ sẽ được hoàn lại cho người khác.')) {
      cancelClass(clsId);
    }
  };

  const filteredClasses = classes.filter((c) => {
    if (activeTab === 'my-bookings' && !c.isBooked) return false;
    if (selectedSport !== 'all' && c.sport !== selectedSport) return false;
    return true;
  });

  const calendarDays = [
    { dayName: 'Thứ Hai (18/11)', date: '18/11', items: [{ title: 'PT 1:1 Phục Hồi Khớp Cổ Chân', time: '16:00 - 17:30', coach: 'HLV Lê Anh Tuấn', room: 'Rehab Zone', type: 'pt' }] },
    { dayName: 'Thứ Ba (19/11)', date: '19/11', isToday: true, items: [{ title: 'Pickleball Chiến Thuật Nâng Cao', time: '18:00 - 19:30', coach: 'HLV Lê Anh Tuấn', room: 'Sân Mái Che Pro 01', type: 'group' }] },
    { dayName: 'Thứ Tư (20/11)', date: '20/11', items: [] },
    { dayName: 'Thứ Năm (21/11)', date: '21/11', items: [{ title: 'Yoga Phục Hồi Thể Lực & Trị Liệu', time: '07:00 - 08:30', coach: 'HLV Vũ Thu Hà', room: 'Studio Thiền Định 02', type: 'group' }] },
    { dayName: 'Thứ Sáu (22/11)', date: '22/11', items: [{ title: 'Bơi Sải Sức Bền Nước Ấm Bốn Mùa', time: '06:30 - 08:00', coach: 'HLV Nguyễn Đức Duy', room: 'Bể Bơi Olympic', type: 'group' }] },
    { dayName: 'Thứ Bảy (23/11)', date: '23/11', items: [] },
    { dayName: 'Chủ Nhật (24/11)', date: '24/11', items: [{ title: 'Giao Lưu Trận Đấu Pickleball Cup', time: '08:30 - 11:00', coach: 'Ban Huấn Luyện', room: 'Sân Pro 01 - 04', type: 'match' }] },
  ];

  return (
    <MemberLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                FLOW 2: CLASS BOOKING & SCHEDULE MANAGEMENT
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-primary">
              Thời Khóa Biểu & Đặt Chỗ Lớp Học
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Tra cứu lịch học nhóm, kiểm tra sĩ số thời gian thực và quản lý lịch tập cá nhân.
            </p>
          </div>

          {/* Toggle View Tabs (MEM-13, MEM-18) */}
          <div className="p-1 rounded-xl bg-white border border-slate-200 flex items-center shadow-sm self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả lớp học
            </button>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'my-bookings'
                  ? 'bg-secondary-container text-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Lớp đã đặt</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary text-secondary-container font-mono">
                {classes.filter((c) => c.isBooked).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Lịch Tuần Cá Nhân (MEM-18)</span>
            </button>
          </div>
        </div>

        {/* Filter by Sport Pills */}
        {activeTab !== 'calendar' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'Tất cả bộ môn' },
              { id: 'pickleball', label: 'Pickleball Pro' },
              { id: 'tennis', label: 'Tennis Grand Slam' },
              { id: 'yoga', label: 'Yoga & Pilates' },
              { id: 'swimming', label: 'Bơi lội 4 Mùa' },
              { id: 'boxing', label: 'Boxing / HIIT' },
            ].map((sp) => (
              <button
                key={sp.id}
                onClick={() => setSelectedSport(sp.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedSport === sp.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        )}

        {/* TAB 1 & 2: Class Cards Grid */}
        {activeTab !== 'calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClasses.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <span className="material-symbols-outlined text-[48px] text-slate-300">
                  event_busy
                </span>
                <h3 className="font-headline-sm text-lg font-bold text-slate-700">
                  Không tìm thấy lớp học phù hợp
                </h3>
                <p className="text-xs text-slate-500">
                  {activeTab === 'my-bookings'
                    ? 'Bạn chưa đặt chỗ lớp nào. Hãy chuyển sang "Tất cả lớp học" để đăng ký nhé!'
                    : 'Hãy chọn bộ môn khác để xem lịch tập.'}
                </p>
              </div>
            ) : (
              filteredClasses.map((cls) => {
                const isFull = cls.enrolled >= cls.capacity;
                const coachObj = coaches.find((c) => c.name === (cls.coachName || cls.coach));

                return (
                  <div
                    key={cls.id}
                    className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Header Card */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                          {cls.day}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            cls.isBooked
                              ? 'bg-emerald-100 text-emerald-800'
                              : cls.isWaitlisted
                              ? 'bg-amber-100 text-amber-800'
                              : isFull
                              ? 'bg-red-100 text-red-800'
                              : 'bg-secondary-container/40 text-secondary'
                          }`}
                        >
                          {cls.isBooked
                            ? 'Đã đặt chỗ'
                            : cls.isWaitlisted
                            ? 'Đang hàng đợi'
                            : isFull
                            ? 'Đã hết chỗ'
                            : `Còn ${cls.capacity - cls.enrolled} slot`}
                        </span>
                      </div>

                      <h3 className="font-headline-sm text-base font-bold text-primary mb-1">
                        {cls.title}
                      </h3>

                      <div className="space-y-1.5 my-3 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            schedule
                          </span>
                          <strong className="text-slate-900">{cls.time}</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">
                            stadium
                          </span>
                          <span>{cls.room}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">
                              person
                            </span>
                            <span className="font-semibold text-slate-800">{cls.coachName || cls.coach}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedCoachProfile(coachObj || { name: cls.coachName || cls.coach, title: 'Master Coach', specialty: 'Chuyên gia huấn luyện thể thao', rating: 4.95 })}
                            className="text-[11px] text-secondary font-bold hover:underline cursor-pointer"
                          >
                            Xem profile HLV (MEM-14)
                          </button>
                        </div>
                      </div>

                      {/* Progress bar slot */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>Sĩ số lớp:</span>
                          <span className="font-bold text-slate-800">
                            {cls.enrolled} / {cls.capacity} học viên
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              isFull ? 'bg-red-500' : 'bg-secondary'
                            }`}
                            style={{
                              width: `${Math.min(100, (cls.enrolled / cls.capacity) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Booking CTA Button (MEM-15, MEM-16, MEM-17) */}
                    <div className="mt-5 pt-3">
                      {cls.isBooked ? (
                        <button
                          onClick={() => handleCancelBooking(cls.id)}
                          className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          <span>Hủy Đặt Chỗ (MEM-17)</span>
                        </button>
                      ) : isFull ? (
                        <button
                          onClick={() => handleBook(cls)}
                          disabled={cls.isWaitlisted}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            cls.isWaitlisted
                              ? 'bg-amber-100 text-amber-800 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                          <span>{cls.isWaitlisted ? 'Đang Trong Hàng Đợi' : 'Vào Danh Sách Chờ (MEM-16)'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBook(cls)}
                          className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-secondary-container hover:bg-secondary-fixed-dim text-primary shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                          <span>Đăng Ký Tham Gia Lớp (MEM-15)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: PERSONAL WEEKLY CALENDAR (MEM-18) */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-lg font-bold text-primary uppercase">
                  Lịch Tập Cá Nhân Trong Tuần (MEM-18)
                </h2>
                <p className="text-xs text-slate-500">
                  Lịch tổng hợp các buổi học nhóm, ca PT 1:1 và trận đấu giao hữu đã được xác nhận.
                </p>
              </div>
              <span className="text-xs text-secondary font-bold bg-secondary-container/30 px-3 py-1 rounded-full">
                Tuần 47 · Tháng 11/2026
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              {calendarDays.map((col, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-3.5 flex flex-col gap-2.5 border transition-all ${
                    col.isToday
                      ? 'bg-slate-50 border-2 border-primary shadow-sm'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="border-b border-slate-100 pb-2">
                    <span className={`text-xs font-bold block ${col.isToday ? 'text-primary' : 'text-slate-800'}`}>
                      {col.dayName}
                    </span>
                    {col.isToday && (
                      <span className="text-[10px] bg-secondary-container text-primary font-bold px-1.5 py-0.2 rounded uppercase">
                        Hôm nay
                      </span>
                    )}
                  </div>

                  {col.items.length === 0 ? (
                    <div className="py-8 text-center text-slate-300 text-[11px] italic">
                      Trống lịch
                    </div>
                  ) : (
                    col.items.map((it, itIdx) => (
                      <div
                        key={itIdx}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 shadow-2xs ${
                          it.type === 'pt'
                            ? 'bg-purple-50 border-purple-200 text-purple-950'
                            : it.type === 'match'
                            ? 'bg-amber-50 border-amber-200 text-amber-950'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        }`}
                      >
                        <div className="font-bold text-[11px] leading-snug">{it.title}</div>
                        <div className="font-mono text-[10px] font-semibold text-slate-600">{it.time}</div>
                        <div className="text-[10px] text-slate-500 truncate">• {it.room}</div>
                        <div className="text-[10px] font-medium text-slate-700">• {it.coach}</div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>

            <h3 className="font-headline-sm text-xl font-bold text-slate-900">
              Đặt Chỗ Thành Công!
            </h3>

            <p className="text-xs text-slate-600">
              Bạn đã đăng ký thành công lớp <strong>{bookingSuccessModal.title}</strong> vào lúc{' '}
              <strong>{bookingSuccessModal.time}</strong> ({bookingSuccessModal.day}).
            </p>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 text-left space-y-1">
              <div>• Phòng tập: <strong>{bookingSuccessModal.room}</strong></div>
              <div>• Huấn luyện viên: <strong>{bookingSuccessModal.coachName || bookingSuccessModal.coach}</strong></div>
              <div>• Vui lòng check-in trước giờ học 10 phút qua cổng RFID để nhận tủ đồ.</div>
            </div>

            <button
              onClick={() => setBookingSuccessModal(null)}
              className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Đã Hiểu & Đóng
            </button>
          </div>
        </div>
      )}

      {/* Coach Profile Modal (MEM-14) */}
      {selectedCoachProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setSelectedCoachProfile(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary text-secondary-container flex items-center justify-center font-bold text-lg shadow-sm">
                {selectedCoachProfile.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-primary">
                  {selectedCoachProfile.name}
                </h3>
                <div className="text-xs text-slate-500 font-semibold">{selectedCoachProfile.title}</div>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-0.5">
                  <span>★</span>
                  <span>{selectedCoachProfile.rating || 4.95}</span>
                  <span className="text-slate-400 font-normal">({selectedCoachProfile.studentsCount || 24} học viên)</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <div>
                <span className="font-bold text-slate-900 block mb-0.5">Chứng chỉ chuyên môn:</span>
                <span>{selectedCoachProfile.certifications || 'PPR Certified / NASM-CPT / Biomechanics Specialist'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block mb-0.5">Kinh nghiệm & Chuyên sâu:</span>
                <span>{selectedCoachProfile.specialty || 'Huấn luyện chiến thuật nâng cao, chỉnh đòn phát bóng và phục hồi chấn thương khớp gối.'}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCoachProfile(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Đóng Profile
            </button>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
