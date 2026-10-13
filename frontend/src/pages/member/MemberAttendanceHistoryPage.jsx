import React, { useState, useMemo } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

export default function MemberAttendanceHistoryPage() {
  const { checkIns, healthProfile } = useApp();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'checkin' | 'performance'
  const [selectedLog, setSelectedLog] = useState(null);

  // Dữ liệu mẫu báo cáo kết quả tập luyện chi tiết kèm nhận xét HLV
  const workoutResultsList = useMemo(() => [
    {
      id: 'res_01',
      date: '18/11/2026',
      time: '18:00 - 19:30',
      title: 'Pickleball Chiến Thuật Nâng Cao',
      coachName: 'HLV Lê Anh Tuấn',
      sport: 'Pickleball',
      checkInTime: '17:48 (Sớm 12 phút)',
      locker: '#24',
      status: 'PRESENT', // PRESENT | LATE | ABSENT
      caloriesBurned: 520,
      coachFeedback: 'Học viên di chuyển bộ chân tốt, đòn Dink bóng ở lưới chuẩn xác. Cần cải thiện kiểm soát lực cổ tay khi Smash ở cuối sân.',
      performanceMetrics: [
        { label: 'Tỷ lệ thắng Dink Net', value: '85%' },
        { label: 'Tốc độ phát bóng Max', value: '62 km/h' },
        { label: 'Mức độ hoàn thành giáo án', value: '95%' },
      ],
    },
    {
      id: 'res_02',
      date: '17/11/2026',
      time: '16:00 - 17:30',
      title: 'PT 1:1 Phục Hồi Khớp Cổ Chân',
      coachName: 'HLV Lê Anh Tuấn',
      sport: 'PT 1:1 Rehab',
      checkInTime: '15:55 (Đúng giờ)',
      locker: '#12',
      status: 'PRESENT',
      caloriesBurned: 380,
      coachFeedback: 'Khớp cổ chân phải đã tải được 95% biên độ co giãn mà không đau. Đã hoàn thành 4 hiệp Squat đơn chân với tạ Kettlebell 16kg.',
      performanceMetrics: [
        { label: 'Mức tạ Squat đơn chân', value: '16 kg' },
        { label: 'Biên độ vận động khớp (ROM)', value: '115°' },
        { label: 'Chỉ số đau (VAS)', value: '0/10' },
      ],
    },
    {
      id: 'res_03',
      date: '14/11/2026',
      time: '07:00 - 08:30',
      title: 'Yoga Phục Hồi Thể Lực',
      coachName: 'HLV Vũ Thu Hà',
      sport: 'Yoga',
      checkInTime: '07:05 (Trễ 5 phút)',
      locker: '#08',
      status: 'LATE',
      caloriesBurned: 290,
      coachFeedback: 'Cơ đùi sau và nhượng chân còn khá căng. Cần duy trì ép dẻo 10 phút mỗi tối trước khi ngủ.',
      performanceMetrics: [
        { label: 'Độ dẻo cột sống', value: 'Đạt chuẩn' },
        { label: 'Kiểm soát nhịp thở', value: 'Tốt' },
      ],
    },
    {
      id: 'res_04',
      date: '10/11/2026',
      time: '17:00 - 18:30',
      title: 'PT 1:1 Sửa Kỹ Thuật Smash',
      coachName: 'HLV Nguyễn Quốc Bảo',
      sport: 'Cầu Lông',
      checkInTime: 'Không check-in',
      locker: 'Không cấp',
      status: 'ABSENT',
      caloriesBurned: 0,
      coachFeedback: 'Học viên vắng mặt có lý do bận đột xuất. Đã bảo lưu 1 buổi PT vào quỹ lớp.',
      performanceMetrics: [],
    },
  ], []);

  // Tổng hợp KPI
  const kpiStats = useMemo(() => {
    const total = workoutResultsList.length;
    const presentCount = workoutResultsList.filter((item) => item.status === 'PRESENT' || item.status === 'LATE').length;
    const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 100;
    const totalCalories = workoutResultsList.reduce((acc, cur) => acc + cur.caloriesBurned, 0);

    return {
      attendanceRate,
      totalSessions: total,
      presentCount,
      totalCalories,
    };
  }, [workoutResultsList]);

  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="relative z-10 space-y-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
              ATTENDANCE & PERFORMANCE LOGS
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Lịch Sử Điểm Danh & Kết Quả Tập Luyện
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              Theo dõi nhật ký check-in qua cổng RFID, tỷ lệ chuyên cần và đánh giá kết quả kỹ thuật chi tiết từ Huấn luyện viên.
            </p>
          </div>
        </div>

        {/* Cụm KPI Thống Kê Tổng Quan */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Tỷ lệ chuyên cần</span>
              <span className="material-symbols-outlined text-orange-500 text-[20px]">verified</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">{kpiStats.attendanceRate}%</div>
            <div className="text-[11px] text-slate-500 font-medium">
              Đã tham gia <strong className="text-slate-900">{kpiStats.presentCount}/{kpiStats.totalSessions}</strong> ca tập
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Năng lượng tiêu hao</span>
              <span className="material-symbols-outlined text-amber-500 text-[20px]">local_fire_department</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">{kpiStats.totalCalories.toLocaleString('vi-VN')} kcal</div>
            <div className="text-[11px] text-slate-500 font-medium">Ước tính qua các ca tập</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Chỉ số InBody gần nhất</span>
              <span className="material-symbols-outlined text-emerald-500 text-[20px]">monitor_weight</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">{healthProfile?.weight || 64.2} kg</div>
            <div className="text-[11px] text-slate-500 font-medium">
              Cơ: <strong className="text-slate-900">{healthProfile?.smm || 32.5}kg</strong> • Mỡ: <strong className="text-slate-900">{healthProfile?.pbf || 17.8}%</strong>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Đánh giá phong độ</span>
              <span className="material-symbols-outlined text-blue-500 text-[20px]">military_tech</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 uppercase">Xuất Sắc</div>
            <div className="text-[11px] text-slate-500 font-medium">Đạt 95% mục tiêu tháng 11</div>
          </div>
        </div>

        {/* Thanh Chuyển Tab Lọc */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'all', label: 'Tất cả nhật ký' },
            { id: 'checkin', label: 'Lịch sử quét cổng RFID & Tủ đồ' },
            { id: 'performance', label: 'Đánh giá & Kết quả HLV' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danh Sách Báo Cáo Buổi Tập & Điểm Danh */}
        <div className="space-y-4">
          {workoutResultsList.map((item) => {
            const isPresent = item.status === 'PRESENT';
            const isLate = item.status === 'LATE';
            const isAbsent = item.status === 'ABSENT';

            if (activeTab === 'checkin' && isAbsent) return null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header Thẻ Ca Tập */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black font-mono bg-slate-100 text-slate-800 px-3 py-1 rounded-xl">
                      {item.date}
                    </span>
                    <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      {item.sport}
                    </span>

                    {isPresent && (
                      <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                        ✓ Đúng giờ
                      </span>
                    )}
                    {isLate && (
                      <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                        • Đi trễ
                      </span>
                    )}
                    {isAbsent && (
                      <span className="text-[10px] font-black uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded flex items-center gap-1">
                        ✕ Vắng mặt
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    HLV Phụ Trách: <strong className="text-slate-900">{item.coachName}</strong>
                  </div>
                </div>

                {/* Nội Dung Buổi Tập */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 space-y-2">
                    <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <span>Khung giờ: <strong className="text-slate-900 font-bold">{item.time}</strong></span>
                      <span>•</span>
                      <span>Quét cổng: <strong className="text-slate-900 font-bold">{item.checkInTime}</strong></span>
                      <span>•</span>
                      <span>Tủ đồ: <strong className="text-orange-600 font-bold">{item.locker}</strong></span>
                    </div>

                    {/* Nhận xét của HLV */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-orange-500">rate_review</span>
                        <span>Nhận xét chuyên môn từ HLV:</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed italic">"{item.coachFeedback}"</p>
                    </div>
                  </div>

                  {/* Cột Bên Phải: Chỉ số Đo Lường Performance */}
                  <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-4 space-y-2 shrink-0">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="font-bold text-orange-400 uppercase text-[10px] tracking-wider">Chỉ Số Đạt ĐƯỢC</span>
                      <span className="font-mono text-emerald-400 font-bold">+{item.caloriesBurned} kcal</span>
                    </div>

                    {item.performanceMetrics.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">Không có chỉ số ghi nhận cho buổi vắng mặt.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        {item.performanceMetrics.map((metric, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-0.5">
                            <div className="text-[10px] text-slate-400 truncate">{metric.label}</div>
                            <div className="text-xs font-black text-white font-mono">{metric.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MemberLayout>
  );
}