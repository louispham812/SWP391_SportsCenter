import React, { useState } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

export default function MemberSchedulePage() {
  const { classes, bookClass, cancelClass } = useApp();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my-bookings'
  const [selectedSport, setSelectedSport] = useState('all');
  const [bookingSuccessModal, setBookingSuccessModal] = useState(null);

  const handleBook = (cls) => {
    if (cls.enrolled >= cls.capacity) {
      alert('Lớp học đã kín chỗ! Vui lòng chọn ca tập khác.');
      return;
    }
    bookClass(cls.id);
    setBookingSuccessModal(cls);
  };

  const handleCancelBooking = (clsId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đặt chỗ buổi học này không?')) {
      cancelClass(clsId);
    }
  };

  const filteredClasses = classes.filter((c) => {
    if (activeTab === 'my-bookings' && !c.isBooked) return false;
    if (selectedSport !== 'all' && c.sport !== selectedSport) return false;
    return true;
  });

  return (
    <MemberLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                FLOW 2: CLASS BOOKING & SCHEDULE
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-primary">
              Thời Khóa Biểu & Đặt Lớp Học
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Chủ động giữ chỗ trước giờ tập để đảm bảo chất lượng lớp học và thiết bị.
            </p>
          </div>

          {/* Toggle View Tabs */}
          <div className="p-1 rounded-xl bg-white border border-slate-200 flex items-center shadow-sm self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả lớp học
            </button>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'my-bookings'
                  ? 'bg-secondary-container text-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Lớp đã đặt của tôi</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary text-secondary-container font-mono">
                {classes.filter((c) => c.isBooked).length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter by Sport Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'Tất cả bộ môn' },
            { id: 'pickleball', label: 'Pickleball' },
            { id: 'tennis', label: 'Tennis' },
            { id: 'yoga', label: 'Yoga & Pilates' },
            { id: 'swimming', label: 'Bơi lội' },
            { id: 'boxing', label: 'Boxing / HIIT' },
          ].map((sp) => (
            <button
              key={sp.id}
              onClick={() => setSelectedSport(sp.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSport === sp.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Class Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <span className="material-symbols-outlined text-[48px] text-slate-300">
                event_busy
              </span>
              <h3 className="font-headline-sm text-lg font-bold text-slate-700">
                Chưa có lớp học nào phù hợp
              </h3>
              <p className="text-xs text-slate-500">
                {activeTab === 'my-bookings'
                  ? 'Bạn chưa đăng ký lớp học nào. Hãy chuyển sang tab "Tất cả lớp học" để đặt chỗ nhé!'
                  : 'Vui lòng chọn bộ môn khác hoặc quay lại sau.'}
              </p>
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const isFull = cls.enrolled >= cls.capacity;
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
                            : isFull
                            ? 'bg-red-100 text-red-800'
                            : 'bg-secondary-container/40 text-secondary'
                        }`}
                      >
                        {cls.isBooked
                          ? 'Đã đặt chỗ'
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
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">
                          person
                        </span>
                        <span>{cls.coachName || cls.coach}</span>
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
                            width: `${(cls.enrolled / cls.capacity) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Booking CTA Button */}
                  <div className="mt-5 pt-3">
                    {cls.isBooked ? (
                      <button
                        onClick={() => handleCancelBooking(cls.id)}
                        className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>Hủy Đặt Chỗ</span>
                      </button>
                    ) : (
                      <button
                        disabled={isFull}
                        onClick={() => handleBook(cls)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          isFull
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-secondary-container hover:bg-secondary-fixed-dim text-primary shadow-sm'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                        <span>{isFull ? 'Hết Chỗ' : 'Giữ Chỗ Lớp Này'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Booking Confirmation Dialog */}
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
              <div>• Vui lòng đến sớm trước 10 phút để nhận tủ đồ và chuẩn bị trang phục.</div>
            </div>

            <button
              onClick={() => setBookingSuccessModal(null)}
              className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider"
            >
              Đã Hiểu & Đóng
            </button>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
