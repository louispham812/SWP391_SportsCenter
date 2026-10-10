import React, { useState } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { useApp } from '../../context/AppContext';

export default function CoachAttendancePage() {
  const { saveClassAttendance, addAuditLog, showToast } = useApp();

  const [classInfo] = useState({
    name: 'Yoga Phục Hồi Thể Lực & Trị Liệu Cột Sống',
    time: '18:00 - 19:30 (Hôm nay)',
    room: 'Studio Thiền Định 02',
    totalStudents: 8,
  });

  const [students, setStudents] = useState([
    { id: 1, name: 'Nguyễn Minh Anh', phone: '0987 654 321', status: 'present', calories: 420, rating: 'Xuất sắc', note: 'Thực hiện động tác gập lưng rất tốt' },
    { id: 2, name: 'Đặng Tuấn Tú', phone: '0912 345 678', status: 'present', calories: 380, rating: 'Tốt', note: 'Khớp gối còn hơi cứng, cần dùng gạch đệm' },
    { id: 3, name: 'Trần Bảo Lâm', phone: '0903 888 999', status: 'present', calories: 450, rating: 'Xuất sắc', note: 'Tập trung hơi thở sâu, hoàn thành bài tập' },
    { id: 4, name: 'Lê Thu Băng', phone: '0933 222 111', status: 'absent', calories: 0, rating: 'Chưa đạt', note: 'Bận đột xuất xin nghỉ' },
    { id: 5, name: 'Phạm Hải Đăng', phone: '0977 444 555', status: 'present', calories: 390, rating: 'Khá', note: 'Cần chú ý giữ thẳng lưng khi thở' },
    { id: 6, name: 'Vũ Ngọc Lan', phone: '0966 111 222', status: 'present', calories: 410, rating: 'Tốt', note: 'Đạt tiến độ giãn cơ tốt' },
  ]);

  const [coachOverallReview, setCoachOverallReview] = useState(
    'Buổi tập hôm nay lớp đạt tinh thần tập trung cao. 85% học viên hoàn thiện bài thở Ujjayi Pranayama và chuỗi bài vặn xoắn nhẹ nhàng.'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [homeworkForm, setHomeworkForm] = useState({
    title: 'Bài tập giãn cơ & thở tại nhà trước khi đi ngủ',
    target: 'all',
    content: 'Thực hiện 10 phút tư thế Em Bé (Child Pose) và 5 phút gác chân lên tường. Uống đủ 500ml nước ấm.',
  });

  const handleSendHomework = (e) => {
    e.preventDefault();
    addAuditLog('Gửi bài tập về nhà', `HLV đã gửi bài tập "${homeworkForm.title}" cho lớp ${classInfo.name}`);
    showToast('Gửi bài tập thành công', `Đã gửi bài tập "${homeworkForm.title}" cho học viên của lớp!`, 'success');
    setShowHomeworkModal(false);
  };

  const setStudentStatus = (id, newStatus) => {
    setStudents(
      students.map((st) => (st.id === id ? { ...st, status: newStatus } : st))
    );
  };

  const handleSaveAttendance = (e) => {
    e.preventDefault();
    saveClassAttendance('cls_01', students, coachOverallReview);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const presentCount = students.filter((s) => s.status === 'present').length;

  return (
    <CoachLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                FLOW 4: ATTENDANCE & EVALUATION
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-slate-900">
              Điểm Danh & Nhận Xét Lớp Học
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Ghi nhận học viên có mặt và lưu đánh giá tiến độ sau mỗi buổi tập.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHomeworkModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary-container text-primary font-bold text-xs uppercase tracking-wider hover:bg-secondary-fixed-dim transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              <span>Gửi Bài Tập Về Nhà</span>
            </button>

            <div className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs">
              <span className="text-slate-500 font-semibold">Tỷ lệ có mặt: </span>
              <strong className="text-emerald-700 font-bold text-sm">
                {presentCount} / {students.length}
              </strong>
            </div>
          </div>
        </div>

        {/* Thông tin lớp học */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Ca dạy đang diễn ra:</span>
            <h2 className="font-headline-sm text-lg font-bold text-primary mt-0.5">
              {classInfo.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                <strong>{classInfo.time}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-slate-400">stadium</span>
                <span>{classInfo.room}</span>
              </span>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase self-start sm:self-auto">
            Đang Diễn Ra
          </span>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span>Đã lưu kết quả điểm danh, calo tiêu hao và gửi nhận xét cho học viên!</span>
          </div>
        )}

        {/* Danh sách học viên điểm danh & kết quả tập luyện */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
              Danh Sách Học Viên & Kết Quả Buổi Tập
            </h3>
            <span className="text-[11px] text-slate-400">Điểm danh & ghi nhận calo/kỹ thuật</span>
          </div>

          <div className="space-y-3">
            {students.map((st) => (
              <div
                key={st.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                    {st.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{st.name}</h4>
                    <span className="text-[11px] text-slate-500">{st.phone}</span>
                  </div>
                </div>

                {/* Kết quả tập luyện: Calo & Đánh giá */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                    <span className="material-symbols-outlined text-amber-500 text-[16px]">local_fire_department</span>
                    <span className="text-slate-500 text-[11px]">Calo:</span>
                    <input
                      type="number"
                      value={st.calories}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setStudents(students.map((s) => (s.id === st.id ? { ...s, calories: val } : s)));
                      }}
                      className="w-14 font-mono font-bold text-slate-900 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">kcal</span>
                  </div>

                  <select
                    value={st.rating}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStudents(students.map((s) => (s.id === st.id ? { ...s, rating: val } : s)));
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="Xuất sắc">⭐ Xuất sắc</option>
                    <option value="Tốt">👍 Tốt</option>
                    <option value="Khá">👌 Khá</option>
                    <option value="Chưa đạt">⚠️ Cần cố gắng</option>
                  </select>
                </div>

                <div className="flex-1 max-w-sm">
                  <input
                    type="text"
                    value={st.note}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStudents(students.map((s) => (s.id === st.id ? { ...s, note: val } : s)));
                    }}
                    placeholder="Nhận xét kỹ thuật riêng..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-primary"
                  />
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1 self-end lg:self-auto">
                  <button
                    type="button"
                    onClick={() => setStudentStatus(st.id, 'present')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      st.status === 'present'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Có mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentStatus(st.id, 'absent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      st.status === 'absent'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Vắng
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form Nhận xét tổng quan */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="text-xs font-bold uppercase text-slate-700 block">
              Nhận xét chung của HLV cho cả lớp sau buổi:
            </label>
            <textarea
              rows={3}
              value={coachOverallReview}
              onChange={(e) => setCoachOverallReview(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveAttendance}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-secondary-container font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Lưu Bảng Điểm Danh & Gửi Đánh Giá</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Gửi Bài Tập Về Nhà / Thông Báo Cho Học Viên */}
      {showHomeworkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setShowHomeworkModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">assignment</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
                  Gửi Thông Báo & Bài Tập Về Nhà
                </h3>
                <p className="text-xs text-slate-500">
                  Lớp: {classInfo.name} ({classInfo.time})
                </p>
              </div>
            </div>

            <form onSubmit={handleSendHomework} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Người nhận
                </label>
                <select
                  value={homeworkForm.target}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, target: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                >
                  <option value="all">Tất cả học viên trong lớp ({students.length} học viên)</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>Chỉ học viên: {st.name} ({st.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Tiêu đề thông báo / bài tập
                </label>
                <input
                  type="text"
                  required
                  value={homeworkForm.title}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                  placeholder="Ví dụ: Bài tập duỗi khớp cổ chân tại nhà"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Nội dung bài tập & dặn dò
                </label>
                <textarea
                  rows="4"
                  required
                  value={homeworkForm.content}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, content: e.target.value })}
                  placeholder="Ghi chi tiết số hiệp, thời gian nghỉ và hướng dẫn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Gửi Ngay Cho Học Viên</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHomeworkModal(false)}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CoachLayout>
  );
}
