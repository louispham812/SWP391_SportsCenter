import React, { useState } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

export default function MemberWorkoutPlanPage() {
  const { showToast } = useApp();

  const [selectedWeek, setSelectedWeek] = useState(2); // Mặc định hiển thị Tuần 2
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestText, setRequestText] = useState('');

  // Giáo án mẫu 4 Tuần biên soạn riêng bởi Master Coach Lê Anh Tuấn
  const [workoutPlanData, setWorkoutPlanData] = useState({
    title: 'Giáo Án Pickleball Chiến Thuật Nâng Cao & Phục Hồi Khớp Cổ Chân',
    coachName: 'HLV Master Lê Anh Tuấn',
    startDate: '01/11/2026',
    endDate: '30/11/2026',
    targetGoal: 'Tăng phản xạ điều bóng lưới, làm chủ đòn Smash xoáy và củng cố dây chằng cổ chân phải.',
    overallProgress: 65, // %
    weeks: [
      {
        weekNum: 1,
        phaseName: 'Giai đoạn 1: Phục hồi biên độ & Footwork căn bản',
        status: 'COMPLETED',
        exercises: [
          { id: 'ex_101', name: 'Nhón chân Single-leg Calf Raise với tạ', setsReps: '4 hiệp x 15 lần', completed: true, note: 'Khớp cổ chân phản hồi tốt, không đau vas=0' },
          { id: 'ex_102', name: 'Di chuyển hình thoi kiểm soát trọng tâm', setsReps: '5 phút x 3 vòng', completed: true, note: 'Trọng tâm giữ thấp, không bị xô khớp' },
          { id: 'ex_103', name: 'Kỹ thuật Dink bóng chuẩn điểm nảy lưới', setsReps: '100 quả/buổi', completed: true, note: 'Đạt tỷ lệ lọt lưới 88%' },
        ],
        coachWeeklyReview: 'Tuần 1 hoàn thành xuất sắc. Cổ chân đáp ứng tải lực tốt, sẵn sàng sang tuần 2 tăng tốc độ phản xạ.',
      },
      {
        weekNum: 2,
        phaseName: 'Giai đoạn 2: Tăng tốc độ phản xạ Net & Đòn Smash xoáy',
        status: 'IN_PROGRESS',
        exercises: [
          { id: 'ex_201', name: 'Phản xạ cắt bóng lưới Dink-Volley liên hoàn', setsReps: '4 hiệp x 30 quả', completed: true, note: 'Tốc độ ra vợt nhanh hơn 15%' },
          { id: 'ex_202', name: 'Smash bật nhảy thu hông điều góc sân', setsReps: '5 hiệp x 12 quả', completed: true, note: 'Tập trung bật bằng cả 2 chân' },
          { id: 'ex_203', name: 'Thắt lưng & Bụng dưới liên sườn với bóng Wall-Ball 6kg', setsReps: '3 hiệp x 20 lần', completed: false, note: 'Cần duy trì siết cơ core' },
          { id: 'ex_204', name: 'Giãn cơ PNF cổ chân & Châm cứu lạnh sau tập', setsReps: '15 phút', completed: false, note: 'Thực hiện ngay sau ca tập' },
        ],
        coachWeeklyReview: 'Tuần 2 phản xạ lưới tiến bộ rõ rệt! Đòn Smash đã có lực xoáy căng. Lưu ý không bỏ qua bài giãn cơ lạnh PNF để tránh căng cứng dây chằng.',
      },
      {
        weekNum: 3,
        phaseName: 'Giai đoạn 3: Phối hợp đánh đôi & Bẫy chiến thuật',
        status: 'UPCOMING',
        exercises: [
          { id: 'ex_301', name: 'Phối hợp di chuyển đổi vị trí Đôi nam/Nữ', setsReps: '3 trận x 15 phút', completed: false, note: 'Giao tiếp tốt với đồng đội' },
          { id: 'ex_302', name: 'Đánh bóng xoáy chìm sâu góc sân (Third Shot Drop)', setsReps: '50 quả/hiệp', completed: false, note: 'Kiểm soát mặt vợt mở 45°' },
        ],
        coachWeeklyReview: 'Chưa diễn ra. Sẽ đánh giá sau ca tập giao lưu tuần tới.',
      },
      {
        weekNum: 4,
        phaseName: 'Giai đoạn 4: Thi đấu cọ xát & Đánh giá InBody cuối kỳ',
        status: 'UPCOMING',
        exercises: [
          { id: 'ex_401', name: 'Thi đấu giải nội bộ FPT Sports Center Cup', setsReps: 'Toàn giải', completed: false, note: 'Thi đấu tối đa 100% phong độ' },
          { id: 'ex_402', name: 'Đo InBody 270 & Kiểm tra sức bật dọc', setsReps: '1 lần', completed: false, note: 'Tổng kết chu kỳ 1 tháng' },
        ],
        coachWeeklyReview: 'Chưa diễn ra.',
      },
    ],
  });

  // Xử lý đánh dấu hoàn thành bài tập
  const handleToggleExercise = (exerciseId) => {
    setWorkoutPlanData((prev) => {
      const updatedWeeks = prev.weeks.map((w) => {
        if (w.weekNum === selectedWeek) {
          const updatedExercises = w.exercises.map((ex) => {
            if (ex.id === exerciseId) {
              const nextState = !ex.completed;
              showToast?.(
                nextState ? 'Đã hoàn thành bài tập' : 'Đã bỏ chọn bài tập',
                `Bài tập: "${ex.name}"`,
                nextState ? 'success' : 'info'
              );
              return { ...ex, completed: nextState };
            }
            return ex;
          });
          return { ...w, exercises: updatedExercises };
        }
        return w;
      });
      return { ...prev, weeks: updatedWeeks };
    });
  };

  // Gửi yêu cầu điều chỉnh giáo án tới HLV
  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!requestText.trim()) return;

    showToast?.('Đã gửi đề xuất', 'Yêu cầu điều chỉnh giáo án đã gửi trực tiếp tới HLV Lê Anh Tuấn.', 'success');
    setRequestText('');
    setIsRequestModalOpen(false);
  };

  const currentWeekData = workoutPlanData.weeks.find((w) => w.weekNum === selectedWeek) || workoutPlanData.weeks[1];

  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                PERSONALIZED TRAINING ROUTINE
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Kế Hoạch Tập Luyện & Nhận Xét HLV
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
                Giáo án huấn luyện chuyên sâu được biên soạn riêng theo thể trạng InBody và nhận xét theo sát của Huấn luyện viên.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              <span>Đề Xuất Điều Chỉnh Giáo Án</span>
            </button>
          </div>
        </div>

        {/* Khối Thông Tin Tổng Quan Kế Hoạch */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                  Lộ Trình 30 Ngày
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Thời gian: {workoutPlanData.startDate} - {workoutPlanData.endDate}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900">{workoutPlanData.title}</h2>
              <p className="text-xs text-slate-600 font-medium">Mục tiêu: <strong>{workoutPlanData.targetGoal}</strong></p>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 text-right shrink-0 min-w-[200px]">
              <span className="text-[10px] font-extrabold uppercase text-orange-600 block">Tiến Độ Kế Hoạch</span>
              <div className="text-2xl font-black text-orange-600 font-mono">{workoutPlanData.overallProgress}%</div>
              <div className="w-full bg-orange-200 h-2 rounded-full overflow-hidden mt-1">
                <div className="bg-orange-500 h-full transition-all" style={{ width: `${workoutPlanData.overallProgress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-orange-500 text-[18px]">person</span>
              <span>Huấn luyện viên phụ trách: <strong className="text-slate-900 font-bold">{workoutPlanData.coachName}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
              <span>Cập nhật mới nhất: <strong>Hôm nay 18/11/2026</strong></span>
            </span>
          </div>
        </div>

        {/* Thanh Chọn Tuần Tập */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {workoutPlanData.weeks.map((w) => {
            const isSelected = selectedWeek === w.weekNum;
            return (
              <button
                key={w.weekNum}
                type="button"
                onClick={() => setSelectedWeek(w.weekNum)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-orange-400' : 'text-orange-600'}`}>
                    TUẦN {w.weekNum}
                  </span>
                  {w.status === 'COMPLETED' && <span className="text-[10px] font-black text-emerald-400">✓ Hoàn thành</span>}
                  {w.status === 'IN_PROGRESS' && <span className="text-[10px] font-black text-amber-400">⚡ Đang tập</span>}
                </div>
                <div className="text-xs font-black truncate mt-1">{w.phaseName}</div>
              </button>
            );
          })}
        </div>

        {/* Chi Tiết Bài Tập & Nhận Xét Của HLV Cho Tuần Đã Chọn */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Cột Trái: Checklist Bài Tập Luyện */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  EXERCISES CHECKLIST
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Danh Sách Bài Tập Tuần {currentWeekData.weekNum}
                </h3>
              </div>

              <span className="text-xs font-bold text-slate-500">
                {currentWeekData.exercises.filter((e) => e.completed).length}/{currentWeekData.exercises.length} bài hoàn thành
              </span>
            </div>

            <div className="space-y-3">
              {currentWeekData.exercises.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => handleToggleExercise(ex.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    ex.completed
                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-700'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    ex.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {ex.completed && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${ex.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {ex.name}
                      </h4>
                      <span className="font-mono text-[11px] font-black text-orange-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {ex.setsReps}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Ghi chú kỹ thuật: {ex.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột Phải: Nhật Ký Nhận Xét Từ Giáo Viên/HLV */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-[22px]">rate_review</span>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white">Nhận Xét Từ HLV Phụ Trách</h3>
                  <p className="text-[11px] text-slate-400">{workoutPlanData.coachName}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                <span className="text-[10px] font-black uppercase text-orange-400 block tracking-wider">
                  ĐÁNH GIÁ TUẦN {currentWeekData.weekNum}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{currentWeekData.coachWeeklyReview}"
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-xs text-amber-200">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  <span>Lời khuyên Phục hồi & Dinh dưỡng:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  Uống đủ 2.5L nước/ngày, bổ sung Whey Protein + BCAA ngay sau buổi tập để phục hồi sợi cơ cổ chân bị xé nhỏ.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL ĐỀ XUẤT ĐIỀU CHỈNH GIÁO ÁN */}
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-slate-200 animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">edit_note</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">Gửi Đề Xuất Cho HLV</h3>
                  <p className="text-xs text-slate-500">HLV Lê Anh Tuấn sẽ phản hồi trong 24h</p>
                </div>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nội dung đề xuất (Tăng/giảm tạ, bị mỏi cơ, muốn thêm bài tập...):
                  </label>
                  <textarea
                    rows={4}
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    placeholder="VD: Thưa thầy, cổ chân em tuần này đỡ mỏi nhiều, thầy có thể tăng bài tập bật nhảy ở Tuần 3 được không ạ?"
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium outline-none focus:border-orange-500 bg-slate-50"
                    required
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20"
                  >
                    Gửi Đề Xuất
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}