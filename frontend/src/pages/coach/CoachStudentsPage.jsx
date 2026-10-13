import React, { useState } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { useApp } from '../../context/AppContext';

export default function CoachStudentsPage() {
  const { addAuditLog, showToast } = useApp();
  const [students] = useState([
    {
      id: 1,
      name: 'Nguyễn Minh Anh',
      phone: '0987 654 321',
      plan: 'Gói Pickleball Match Pass 10 Buổi',
      completedSessions: '7 / 10',
      goal: 'Tăng phản xạ nhanh & footwork linh hoạt',
      inbody: { weight: '64.2 kg', smm: '32.5 kg', pbf: '17.8%' },
    },
    {
      id: 2,
      name: 'Đặng Tuấn Tú',
      phone: '0912 345 678',
      plan: 'PT 1:1 Biomechanics Lab 20 Buổi',
      completedSessions: '14 / 20',
      goal: 'Phục hồi khớp gối sau chấn thương & tăng sức mạnh chân',
      inbody: { weight: '76.0 kg', smm: '38.2 kg', pbf: '19.4%' },
    },
    {
      id: 3,
      name: 'Trần Bảo Lâm',
      phone: '0903 888 999',
      plan: 'VIP Diamond All-Access',
      completedSessions: '28 / 50',
      goal: 'Tập luyện sức bền thi đấu giải Pickleball Hà Nội Open',
      inbody: { weight: '71.5 kg', smm: '36.8 kg', pbf: '14.2%' },
    },
  ]);

  const [aiModal, setAiModal] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPlanResult, setAiPlanResult] = useState(null);

  const handleOpenAIModal = (student) => {
    setAiModal(student);
    setAiPlanResult(null);
  };

  const handleGenerateAIWorkout = () => {
    setAiGenerating(true);
    setTimeout(() => {
      setAiPlanResult({
        recommendation: `Giáo án cá nhân hóa cho học viên: ${aiModal.name} (Mục tiêu: ${aiModal.goal})`,
        exercises: [
          { name: 'Warm-up: Dynamic Stretch & Khởi động khớp cổ chân', sets: '1 hiệp', duration: '8 phút' },
          { name: 'Bài 1: Agility Ladder Shuffle (Thang dây đổi hướng nhanh)', sets: '4 hiệp', reps: '30 giây/hiệp', rest: '45s' },
          { name: 'Bài 2: Dumbbell Lateral Lunges (Chùng chân ngang tạ 8kg)', sets: '3 hiệp', reps: '12 lần/chân', rest: '60s' },
          { name: 'Bài 3: Reactive Tennis Ball Catch (Bắt bóng phản xạ đa hướng)', sets: '3 hiệp', reps: '20 bóng', rest: '45s' },
          { name: 'Cool-down: Giãn cơ tĩnh toàn thân & Foam Roller đùi trước', sets: '1 hiệp', duration: '10 phút' },
        ],
      });
      setAiGenerating(false);
    }, 1200);
  };

  return (
    <CoachLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                FLOW 4 & FLOW 5: TRAINING & AI WORKOUT
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-slate-900">
              Danh Sách Học Viên Của Tôi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Theo dõi tiến độ, xem chỉ số InBody và sử dụng AI để tạo giáo án cá nhân hóa.
            </p>
          </div>
        </div>

        {/* Student Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary text-secondary-container flex items-center justify-center font-bold text-base shadow-sm">
                      {st.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-base font-bold text-slate-900">
                        {st.name}
                      </h3>
                      <div className="text-xs text-slate-500">{st.phone}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 mb-4 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gói tập:</span>
                    <strong className="text-slate-900 truncate max-w-[180px]">{st.plan}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tiến độ buổi:</span>
                    <strong className="text-secondary font-bold">{st.completedSessions} buổi</strong>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Mục tiêu chính:</span>
                    <span className="text-slate-800 font-medium italic">{st.goal}</span>
                  </div>
                </div>

                {/* InBody Mini Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs p-2.5 bg-slate-100 rounded-xl mb-5">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Cân nặng</div>
                    <div className="font-bold text-slate-800 mt-0.5">{st.inbody.weight}</div>
                  </div>
                  <div className="border-x border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Cơ nạc</div>
                    <div className="font-bold text-secondary mt-0.5">{st.inbody.smm}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Mỡ PBF</div>
                    <div className="font-bold text-slate-800 mt-0.5">{st.inbody.pbf}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenAIModal(st)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <span>AI Gợi Ý Bài Tập</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: AI Workout Recommendation for Coach (Flow 5) */}
      {aiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAiModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[24px]">smart_toy</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                  AI WORKOUT GENERATOR (FLOW 5)
                </span>
                <h3 className="font-headline-sm text-lg font-bold text-slate-900 mt-0.5">
                  Tạo Kế Hoạch Bài Tập Cho: {aiModal.name}
                </h3>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-200">
              <div>• Mục tiêu: <strong>{aiModal.goal}</strong></div>
              <div>• Thể trạng: Cân nặng <strong>{aiModal.inbody.weight}</strong> | Cơ <strong>{aiModal.inbody.smm}</strong> | Mỡ <strong>{aiModal.inbody.pbf}</strong></div>
            </div>

            {!aiPlanResult ? (
              <div className="text-center py-6 space-y-3">
                {aiGenerating ? (
                  <div className="space-y-2">
                    <span className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block"></span>
                    <div className="text-xs text-slate-600 font-bold">
                      Hệ thống AI đang phân tích dữ liệu thể trạng và sinh giáo án...
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-500 mb-4">
                      Thuật toán AI sẽ dựa vào mục tiêu, mức độ phục hồi và lịch sử của học viên để đưa ra danh sách các bài tập tối ưu nhất.
                    </p>
                    <button
                      onClick={handleGenerateAIWorkout}
                      className="px-6 py-3 rounded-xl bg-primary text-secondary-container text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2 mx-auto"
                    >
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      <span>Kích Hoạt Sinh Giáo Án Bằng AI</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-secondary-container/25 border border-secondary/30 rounded-xl text-xs text-slate-800 font-bold">
                  {aiPlanResult.recommendation}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase text-slate-500">
                    Danh Sách Bài Tập Đề Xuất:
                  </div>
                  {aiPlanResult.exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{ex.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {ex.sets} {ex.reps ? `• ${ex.reps}` : ''} {ex.duration ? `• ${ex.duration}` : ''}
                        </div>
                      </div>
                      {ex.rest && (
                        <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                          Nghỉ: {ex.rest}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      addAuditLog('Tạo giáo án AI', `HLV đã lưu & gửi giáo án AI cho học viên: ${aiModal.name}`);
                      showToast('Lưu giáo án AI thành công', `Giáo án cá nhân hóa đã được gửi vào ứng dụng của học viên ${aiModal.name}!`, 'success');
                      setAiModal(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#c1f100] hover:bg-[#abd600] text-slate-950 text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Lưu Giáo Án Này Vào Hồ Sơ Học Viên</span>
                  </button>
                  <button
                    onClick={handleGenerateAIWorkout}
                    className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase hover:bg-slate-50"
                  >
                    Tạo lại
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </CoachLayout>
  );
}
