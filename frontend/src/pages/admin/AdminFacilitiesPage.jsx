import React, { useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminFacilitiesPage() {
  const { showToast, addAuditLog } = useApp();
  const [facilities] = useState([
    {
      id: 1,
      name: 'Cụm Sân Pickleball Có Mái Che (Sân Pro 01 - 05)',
      sport: 'Pickleball',
      totalCourts: '5 Sân',
      status: 'active',
      occupancy: '80% (4/5 sân đang có lớp/khách)',
      lighting: 'LED chống chói 500 Lux',
    },
    {
      id: 2,
      name: 'Cụm Sân Tennis Chuẩn ITF (Sân 01 - 07)',
      sport: 'Tennis',
      totalCourts: '7 Sân',
      status: 'active',
      occupancy: '71% (5/7 sân đang sử dụng)',
      lighting: 'Plexipave Grand Slam Pro',
    },
    {
      id: 3,
      name: 'Studio Yoga & Pilates Reformer (Phòng 01 & 02)',
      sport: 'Yoga & Pilates',
      totalCourts: '2 Phòng Cách Âm',
      status: 'active',
      occupancy: '100% (Đang diễn ra lớp Yoga phục hồi)',
      lighting: 'Ánh sáng tự nhiên & Reformer Allegro 2',
    },
    {
      id: 4,
      name: 'Bể Bơi Bốn Mùa Điện Phân Muối Khoáng',
      sport: 'Swimming',
      totalCourts: '8 Làn 50m Olympic',
      status: 'active',
      occupancy: '50% (4 làn mở bơi tự do, 4 làn lớp)',
      lighting: 'Nhiệt độ nước tự động 29°C',
    },
    {
      id: 5,
      name: 'Phòng Thí Nghiệm Thể Lực & Biomechanics Lab',
      sport: 'PT 1:1 Rehab',
      totalCourts: '1 Phòng Kèm 1-1',
      status: 'maintenance',
      occupancy: 'Đang hiệu chuẩn cảm biến InBody 770',
      lighting: 'Hệ thống Camera AI Motion Capture',
    },
  ]);

  const [showAddClassModal, setShowAddClassModal] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                FLOW 2: FACILITY & CLASS SCHEDULE COORDINATION
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-slate-900">
              Quản Lý Cơ Sở, Sân Bãi & Lịch Hoạt Động
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kiểm soát trạng thái phòng tập, cụm sân thi đấu và điều phối lịch giảng dạy của HLV.
            </p>
          </div>

          <button
            onClick={() => setShowAddClassModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary-container text-primary font-bold text-xs uppercase tracking-wider hover:bg-secondary-fixed-dim transition-all shadow-md self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add_alarm</span>
            <span>Tạo Lịch Lớp Mới & Gán HLV</span>
          </button>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {facilities.map((fac) => (
            <div
              key={fac.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                    {fac.sport}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      fac.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        fac.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    ></span>
                    {fac.status === 'active' ? 'Đang mở cửa' : 'Bảo trì thiết bị'}
                  </span>
                </div>

                <h3 className="font-headline-sm text-base font-bold text-slate-900 mb-2">
                  {fac.name}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quy mô:</span>
                    <strong className="text-slate-800">{fac.totalCourts}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tỷ lệ lấp đầy:</span>
                    <strong className="text-primary font-bold">{fac.occupancy}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tiêu chuẩn:</span>
                    <span className="text-slate-700">{fac.lighting}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Bảo trì định kỳ: Thứ Hai hàng tuần</span>
                <button
                  onClick={() => alert(`Xem lịch chi tiết của cơ sở: ${fac.name}`)}
                  className="text-secondary font-bold hover:underline flex items-center gap-1"
                >
                  <span>Xem Thời Khóa Biểu</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tạo Lịch Lớp Mới (Popup Flow 2) */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setShowAddClassModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Tạo Lớp Học Mới & Phân Công HLV
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addAuditLog('Tạo lớp học', 'Quản lý đã tạo lịch lớp mới và phân công HLV');
                showToast('Tạo lớp học thành công', 'Lịch lớp học và phân công HLV đã được phê duyệt và mở đăng ký!', 'success');
                setShowAddClassModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Tên lớp học
                </label>
                <input
                  type="text"
                  required
                  defaultValue="Pickleball Kỹ Thuật Đôi Master"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Cơ sở / Phòng tập
                  </label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white">
                    <option>Sân Pickleball Pro 01</option>
                    <option>Sân Pickleball Pro 02</option>
                    <option>Sân Tennis Trung Tâm</option>
                    <option>Studio Yoga 02</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    HLV Phụ trách
                  </label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white">
                    <option>HLV Lê Anh Tuấn (Master)</option>
                    <option>HLV Vũ Thu Hà (Yoga)</option>
                    <option>HLV Trần Minh Quân (Tennis)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Khung giờ
                  </label>
                  <input
                    type="text"
                    defaultValue="18:00 - 19:30"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Sĩ số tối đa
                  </label>
                  <input
                    type="number"
                    defaultValue="8"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Lưu & Mở Đặt Chỗ
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
