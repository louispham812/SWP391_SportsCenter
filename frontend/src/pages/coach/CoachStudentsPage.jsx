import React, { useEffect, useState, useMemo } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { getCoachStudents } from '../../services/bookingApi';
import { generateCoachPlan } from '../../services/aiAssistantApi';
import { createWorkoutPlan, getMemberWorkoutProgress } from '../../services/workoutApi';
import { useApp } from '../../context/AppContext';

export default function CoachStudentsPage() {
  const [students, setStudents] = useState([]);
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [generatingBookingId, setGeneratingBookingId] = useState(null);
  const [plans, setPlans] = useState({});
  const [planErrors, setPlanErrors] = useState({});

  // PT Workout Plan & Evaluation Modal State (COA-07..10)
  const [selectedStudentForPlan, setSelectedStudentForPlan] = useState(null);
  const [modalTab, setModalTab] = useState('create'); // 'create' | 'history'
  const [savingPlan, setSavingPlan] = useState(false);
  const [studentProgress, setStudentProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const initialPlanForm = {
    title: 'Giáo án Rèn luyện Thể lực & Kỹ thuật PT',
    goal: 'Tăng cường sức bền, cải thiện kỹ thuật di chuyển và độ chính xác',
    sessionResult: 'Học viên hoàn thành giáo án đúng tiến độ, mức tạ nâng tốt.',
    coachFeedback: 'Tinh thần tập luyện hăng say, chú ý giữ nhịp thở đều ở các hiệp cuối.',
    homework: 'Tự tập giãn cơ 15 phút tại nhà mỗi tối, bổ sung đủ nước và điện giải.',
    exercises: [
      { name: 'Khởi động xoay khớp & Ép dẻo', sets: 2, reps: 15, weightKg: 0, note: 'Làm nóng toàn thân' },
      { name: 'Squat với tạ đòn', sets: 4, reps: 10, weightKg: 50, note: 'Lưng thẳng, hạ đùi song song sàn' },
      { name: 'Kéo xô cáp Seated Cable Row', sets: 3, reps: 12, weightKg: 35, note: 'Siết cơ lưng xô 1 giây' },
      { name: 'Plank giữ tĩnh', sets: 3, reps: 45, weightKg: 0, note: 'Gồng chặt cơ bụng' },
    ],
  };

  const [planForm, setPlanForm] = useState(initialPlanForm);

  const openPlanModal = async (student) => {
    setSelectedStudentForPlan(student);
    setModalTab('create');
    setPlanForm({
      ...initialPlanForm,
      title: `Giáo án PT - ${student.name}`,
    });
    setLoadingProgress(true);
    try {
      const data = await getMemberWorkoutProgress(student.id);
      setStudentProgress(data);
    } catch {
      setStudentProgress(null);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleAddExercise = () => {
    setPlanForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: 3, reps: 10, weightKg: 0, note: '' }],
    }));
  };

  const handleRemoveExercise = (index) => {
    setPlanForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, idx) => idx !== index),
    }));
  };

  const handleExerciseChange = (index, field, value) => {
    setPlanForm((prev) => {
      const updated = [...prev.exercises];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, exercises: updated };
    });
  };

  const handleFillAiTemplate = () => {
    setPlanForm((prev) => ({
      ...prev,
      title: `Lộ trình Huấn luyện Thể lực Nâng cao - ${selectedStudentForPlan?.name || 'Học viên'}`,
      goal: 'Tối ưu hóa sức mạnh bộc phát, nâng cao 1RM tạ và tốc độ phản xạ thể thao',
      exercises: [
        { name: 'Barbell Back Squat', sets: 4, reps: 8, weightKg: 70, note: 'Kiểm soát giai đoạn hạ tạ (eccentric 3s)' },
        { name: 'Romanian Deadlift (RDL)', sets: 4, reps: 10, weightKg: 60, note: 'Kéo căng cơ đùi sau và cơ mông' },
        { name: 'Dumbbell Incline Bench Press', sets: 3, reps: 12, weightKg: 22, note: 'Mở rộng lồng ngực, ép ngực trên' },
        { name: 'Agility Ladder Drills (Bộ chân)', sets: 4, reps: 20, weightKg: 0, note: 'Tăng tốc độ guồng chân và thăng bằng' },
      ],
      sessionResult: 'Học viên vượt mốc tạ mục tiêu, nhịp tim phục hồi nhanh sau mỗi set.',
      coachFeedback: 'Kỹ thuật cải thiện đáng kể, biên độ chuyển động đạt chuẩn thi đấu.',
      homework: 'Chạy bộ biến tốc HIIT 15 phút, nạp 1.8g protein/kg và ngủ đủ 8 tiếng.',
    }));
    showToast('Đã áp dụng', 'Đã điền giáo án thể lực nâng cao chuẩn khoa học.', 'info');
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.title.trim()) {
      showToast('Cảnh báo', 'Vui lòng nhập tiêu đề giáo án.', 'warning');
      return;
    }
    if (planForm.exercises.length === 0) {
      showToast('Cảnh báo', 'Vui lòng thêm ít nhất một bài tập.', 'warning');
      return;
    }
    setSavingPlan(true);
    try {
      const payload = {
        memberId: selectedStudentForPlan.id,
        title: planForm.title.trim(),
        goal: planForm.goal.trim(),
        exercisesJson: JSON.stringify(planForm.exercises),
        sessionResult: planForm.sessionResult.trim(),
        coachFeedback: planForm.coachFeedback.trim(),
        homework: planForm.homework.trim(),
        source: 'COACH',
      };
      await createWorkoutPlan(payload);
      showToast('Thành công', `Đã lưu giáo án & gửi thông báo cho ${selectedStudentForPlan.name}!`, 'success');
      // Reload history
      const updated = await getMemberWorkoutProgress(selectedStudentForPlan.id);
      setStudentProgress(updated);
      setModalTab('history');
    } catch (err) {
      showToast('Lỗi', err.message || 'Không thể lưu giáo án tập luyện.', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  useEffect(() => {
    let current = true;
    const loadStudents = async () => {
      try {
        const bookings = await getCoachStudents();
        const byMember = new Map();

        bookings.forEach((booking) => {
          const existing = byMember.get(booking.memberId) || {
            id: booking.memberId,
            name: booking.memberName,
            phone: booking.memberPhone,
            email: booking.memberEmail || '',
            avatar: booking.memberAvatar || '',
            sessions: [],
          };

          // Deduplicate sessions for the same member & session
          const alreadyAdded = existing.sessions.some(
            (s) => s.sessionId === booking.sessionId || s.bookingId === booking.bookingId
          );

          if (!alreadyAdded) {
            existing.sessions.push({
              bookingId: booking.bookingId,
              sessionId: booking.sessionId,
              className: booking.className,
              startTime: booking.startTime,
              status: booking.attendanceStatus || booking.bookingStatus,
            });
          }

          byMember.set(booking.memberId, existing);
        });

        if (current) setStudents([...byMember.values()]);
      } catch (requestError) {
        if (current) setError(requestError.message || 'Không thể tải danh sách học viên từ cơ sở dữ liệu.');
      } finally {
        if (current) setLoading(false);
      }
    };
    loadStudents();
    return () => {
      current = false;
    };
  }, []);

  // Distinct class names for filter dropdown
  const classOptions = useMemo(() => {
    const set = new Set();
    students.forEach((student) => {
      student.sessions.forEach((s) => {
        if (s.className) set.add(s.className);
      });
    });
    return Array.from(set);
  }, [students]);

  // Filter students by search and class
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      const matchName = (student.name || '').toLowerCase().includes(query);
      const matchPhone = (student.phone || '').includes(query);
      const matchEmail = (student.email || '').toLowerCase().includes(query);
      const matchesSearch = !query || matchName || matchPhone || matchEmail;

      const matchesClass =
        selectedClassFilter === 'ALL' ||
        student.sessions.some((s) => s.className === selectedClassFilter);

      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, selectedClassFilter]);

  const totalEnrollments = useMemo(() => {
    return students.reduce((sum, s) => sum + s.sessions.length, 0);
  }, [students]);

  const handleGeneratePlan = async (student, session) => {
    setGeneratingBookingId(session.bookingId);
    setPlanErrors((current) => ({ ...current, [session.bookingId]: '' }));
    try {
      const result = await generateCoachPlan(session.bookingId);
      setPlans((current) => ({ ...current, [session.bookingId]: result.answer }));
    } catch (requestError) {
      setPlanErrors((current) => ({
        ...current,
        [session.bookingId]: requestError.message || 'Không thể tạo giáo án cho học viên này.',
      }));
    } finally {
      setGeneratingBookingId(null);
    }
  };

  return (
    <CoachLayout>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT COACH · QUẢN LÝ HỌC VIÊN
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Học Viên Của Tôi</h1>
            <p className="mt-1 text-sm text-slate-500">
              Danh sách học viên đăng ký theo từng lớp huấn luyện viên được phân công, không bị trùng lặp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
              Tổng số: <strong className="text-orange-600 font-black">{students.length}</strong> học viên
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
              Lượt đăng ký: <strong className="text-slate-900 font-black">{totalEnrollments}</strong>
            </span>
          </div>
        </header>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="sm:col-span-2 relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm học viên theo họ tên, số điện thoại hoặc email..."
              className="w-full bg-slate-50 text-slate-800 placeholder:text-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả lớp học ({students.length} học viên)</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-3xl text-orange-500 animate-spin">progress_activity</span>
            <span>Đang tải danh sách học viên...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl text-slate-300">groups</span>
            <span>Không tìm thấy học viên nào phù hợp với bộ lọc hiện tại.</span>
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredStudents.map((student) => {
              // Check if student has overlapping sessions with this coach
              const hasStudentTimeConflict = student.sessions.some((s1, idx) =>
                student.sessions.some(
                  (s2, idx2) =>
                    idx !== idx2 &&
                    new Date(s1.startTime).getTime() === new Date(s2.startTime).getTime()
                )
              );

              return (
                <article
                  key={student.id}
                  className={`rounded-2xl border p-5 shadow-sm transition-all ${
                    hasStudentTimeConflict
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200 bg-white hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {student.avatar && student.avatar.startsWith('data:image') ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 font-black text-white text-sm shadow-sm shadow-orange-500/20 shrink-0">
                          {student.name ? student.name.slice(0, 2).toUpperCase() : 'HV'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="truncate font-bold text-slate-900 text-sm">{student.name}</h2>
                        <p className="text-xs text-slate-500 font-medium">{student.phone || 'Chưa có số ĐT'}</p>
                        {student.email && (
                          <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                        )}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase">
                      ID: #{student.id}
                    </span>
                  </div>

                  {hasStudentTimeConflict && (
                    <div className="mt-3 p-2 rounded-lg bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">warning</span>
                      <span>Học viên có ca học bị trùng khung giờ!</span>
                    </div>
                  )}

                  <div className="mt-4 border-t border-slate-100 pt-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Lớp đăng ký ({student.sessions.length} ca)
                      </p>
                      <span className="text-[10px] font-bold text-orange-600">
                        {student.sessions[0]?.className}
                      </span>
                    </div>

                    <ul className="space-y-2.5">
                      {student.sessions.map((session) => (
                        <li
                          key={`${student.id}-${session.bookingId}`}
                          className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                        >
                          <div className="flex justify-between items-start gap-2 text-xs">
                            <div>
                              <span className="font-bold text-slate-800 block">
                                {session.className}
                              </span>
                              <span className="text-[11px] text-slate-500 mt-0.5 block">
                                {new Date(session.startTime).toLocaleString('vi-VN', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <span
                              className={`shrink-0 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                session.status === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : session.status === 'ABSENT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {session.status === 'PRESENT'
                                ? 'Có mặt'
                                : session.status === 'ABSENT'
                                ? 'Vắng'
                                : session.status === 'BOOKED'
                                ? 'Đã đặt'
                                : session.status}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleGeneratePlan(student, session)}
                            disabled={generatingBookingId !== null}
                            className="mt-2.5 flex items-center justify-center gap-1.5 w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs shadow-orange-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                            {generatingBookingId === session.bookingId
                              ? 'Đang tạo giáo án AI...'
                              : 'Tạo giáo án cá nhân hóa bằng AI'}
                          </button>

                          {planErrors[session.bookingId] && (
                            <p
                              role="alert"
                              className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"
                            >
                              {planErrors[session.bookingId]}
                            </p>
                          )}

                          {plans[session.bookingId] && (
                            <div className="mt-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-slate-800 space-y-1.5 animate-in fade-in">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                Giáo án cá nhân hóa từ AI
                              </div>
                              <div className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium text-[11px]">
                                {plans[session.bookingId]}
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Nút Soạn Giáo Án & Đánh Giá PT (COA-07..10) */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openPlanModal(student)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-orange-50 hover:bg-orange-100/90 border border-orange-200 text-orange-700 py-2 text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">assignment_add</span>
                        Soạn Giáo Án & Đánh Giá PT
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">info</span>
          <div>
            <strong>Lưu ý quản lý học viên:</strong> Danh sách học viên được lọc tự động theo các lớp huấn luyện viên được phân công. Học viên đã hủy đặt chỗ sẽ tự động bị loại khỏi danh sách ca học.
          </div>
        </div>

        {/* MODAL: SOẠN GIÁO ÁN & ĐÁNH GIÁ PT (COA-07, COA-08, COA-09, COA-10) */}
        {selectedStudentForPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black">
                    <span className="material-symbols-outlined text-[22px]">fitness_center</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Soạn Kế Hoạch & Đánh Giá PT · {selectedStudentForPlan.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      ID Học viên: #{selectedStudentForPlan.id} · ĐT: {selectedStudentForPlan.phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForPlan(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalTab('create')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'create'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">edit_document</span>
                  Soạn Giáo Án Mới
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('history')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'history'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  Lịch Sử Giáo Án & Tiến Độ Cơ Thể
                </button>
              </div>

              {/* TAB 1: FORM SOẠN GIÁO ÁN */}
              {modalTab === 'create' && (
                <form onSubmit={handleSavePlan} className="space-y-4">
                  <div className="flex items-center justify-between bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                    <span className="text-xs text-amber-900 font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-amber-600">auto_awesome</span>
                      Tận dụng mẫu giáo án chuẩn khoa học
                    </span>
                    <button
                      type="button"
                      onClick={handleFillAiTemplate}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      Điền nhanh gợi ý AI
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề kế hoạch tập *</label>
                      <input
                        type="text"
                        required
                        value={planForm.title}
                        onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                        placeholder="VD: Giáo án Sức mạnh & Tăng cơ thân trên"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mục tiêu buổi tập</label>
                      <input
                        type="text"
                        value={planForm.goal}
                        onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                        placeholder="VD: Tăng 1RM Squat lên 90kg, duy trì nhịp tim < 160bpm"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Danh sách bài tập (COA-07) */}
                  <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-orange-500">list_alt</span>
                        Danh Sách Bài Tập Chi Tiết (Sets / Reps / Mức Tạ)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddExercise}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        Thêm bài tập
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {planForm.exercises.map((ex, idx) => (
                        <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                          <input
                            type="text"
                            placeholder="Tên bài tập..."
                            value={ex.name}
                            onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                            className="flex-2 px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-800"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              placeholder="Sets"
                              value={ex.sets}
                              onChange={(e) => handleExerciseChange(idx, 'sets', Number(e.target.value))}
                              className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 text-center font-bold"
                            />
                            <span className="text-slate-400 font-bold">x</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="Reps"
                              value={ex.reps}
                              onChange={(e) => handleExerciseChange(idx, 'reps', Number(e.target.value))}
                              className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 text-center font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="Kg"
                              value={ex.weightKg}
                              onChange={(e) => handleExerciseChange(idx, 'weightKg', Number(e.target.value))}
                              className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-center font-bold text-orange-600"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">kg</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Lưu ý kỹ thuật..."
                            value={ex.note}
                            onChange={(e) => handleExerciseChange(idx, 'note', e.target.value)}
                            className="flex-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(idx)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kết quả buổi tập & 1RM (COA-08) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">monitoring</span>
                      Kết quả buổi tập & Mức tạ 1RM đạt được (COA-08)
                    </label>
                    <textarea
                      rows="2"
                      value={planForm.sessionResult}
                      onChange={(e) => setPlanForm({ ...planForm, sessionResult: e.target.value })}
                      placeholder="VD: Squat 75kg 4x10 mượt mà. 1RM Squat ước tính đạt 95kg. Thời gian hoàn thành 45 phút."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* Nhận xét tiến độ định kỳ (COA-09) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-emerald-500">rate_review</span>
                      Nhận xét & Đánh giá chuyên môn của HLV (COA-09 / MEM-22)
                    </label>
                    <textarea
                      rows="2"
                      value={planForm.coachFeedback}
                      onChange={(e) => setPlanForm({ ...planForm, coachFeedback: e.target.value })}
                      placeholder="VD: Cảm giác bóng và bộ chân di chuyển tiến bộ rõ rệt. Cần chú ý giữ nhịp thở đều ở set thứ 4."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* Bài tập về nhà & Dinh dưỡng (COA-10) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-purple-500">home_work</span>
                      Bài tập về nhà & Lời khuyên dinh dưỡng (COA-10 / MEM-20)
                    </label>
                    <textarea
                      rows="2"
                      value={planForm.homework}
                      onChange={(e) => setPlanForm({ ...planForm, homework: e.target.value })}
                      placeholder="VD: Chạy bộ nhẹ 20 phút các ngày nghỉ. Bổ sung đủ 1.8g protein/kg và ngủ đủ 7-8 tiếng."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForPlan(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={savingPlan}
                      className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      {savingPlan ? 'Đang lưu...' : 'Lưu Giáo Án & Gửi Học Viên'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: LỊCH SỬ GIÁO ÁN & TIẾN ĐỘ CƠ THỂ */}
              {modalTab === 'history' && (
                <div className="space-y-4">
                  {loadingProgress ? (
                    <div className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span className="text-xs font-bold">Đang tải lịch sử huấn luyện...</span>
                    </div>
                  ) : !studentProgress ? (
                    <p className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu tiến độ cho học viên này.</p>
                  ) : (
                    <>
                      {/* Bảng mốc đo cơ thể (MEM-21) */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                          Chỉ số Thể trạng & 1RM Gần Đây
                        </span>
                        {studentProgress.bodyLogs?.length === 0 ? (
                          <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            Chưa có bản ghi đo InBody / 1RM nào.
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                                <tr>
                                  <th className="py-2.5 px-3">Ngày đo</th>
                                  <th className="py-2.5 px-3">Cân nặng</th>
                                  <th className="py-2.5 px-3">Cơ SMM</th>
                                  <th className="py-2.5 px-3">Mỡ PBF</th>
                                  <th className="py-2.5 px-3">BMI</th>
                                  <th className="py-2.5 px-3">1RM Tối Đa</th>
                                  <th className="py-2.5 px-3">Ghi chú</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {studentProgress.bodyLogs.map((log) => (
                                  <tr key={log.progressId} className="hover:bg-slate-50/80">
                                    <td className="py-2 px-3 font-semibold text-slate-800">{log.recordedDate}</td>
                                    <td className="py-2 px-3 font-bold text-slate-900">{log.weightKg ? `${log.weightKg} kg` : '--'}</td>
                                    <td className="py-2 px-3 text-emerald-600 font-bold">{log.smmKg ? `${log.smmKg} kg` : '--'}</td>
                                    <td className="py-2 px-3 text-orange-600 font-bold">{log.pbfPercent != null ? `${log.pbfPercent}%` : '--'}</td>
                                    <td className="py-2 px-3 text-slate-700">{log.bmi || '--'}</td>
                                    <td className="py-2 px-3 font-black text-blue-600">{log.maxLiftKg ? `${log.maxLiftKg} kg` : '--'}</td>
                                    <td className="py-2 px-3 text-slate-500 text-[11px]">{log.note || '--'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Danh sách giáo án đã giao (COA-07..10) */}
                      <div className="space-y-3 pt-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                          Các Kế Hoạch Tập Luyện Đã Giao ({studentProgress.plans?.length || 0})
                        </span>
                        {studentProgress.plans?.length === 0 ? (
                          <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            Chưa có giáo án nào được tạo cho học viên này.
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            {studentProgress.plans.map((p) => {
                              let parsedExercises = [];
                              try {
                                parsedExercises = JSON.parse(p.exercisesJson || '[]');
                              } catch {
                                parsedExercises = [];
                              }
                              return (
                                <div key={p.planId} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-bold text-sm text-slate-900">{p.title}</h4>
                                      <p className="text-[11px] text-slate-500">Mục tiêu: {p.goal || 'Không có'}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      p.source === 'AI' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      {p.source === 'AI' ? 'Gợi ý AI' : `HLV ${p.coachName || ''}`}
                                    </span>
                                  </div>

                                  {/* Exercises list */}
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {parsedExercises.map((e, i) => (
                                      <span key={i} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-700">
                                        <strong>{e.name}</strong>: {e.sets}x{e.reps} {e.weightKg > 0 ? `(${e.weightKg}kg)` : ''}
                                      </span>
                                    ))}
                                  </div>

                                  {p.sessionResult && (
                                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-[11px] text-blue-900">
                                      <strong>Kết quả:</strong> {p.sessionResult}
                                    </div>
                                  )}

                                  {p.coachFeedback && (
                                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-[11px] text-emerald-900">
                                      <strong>Nhận xét HLV:</strong> {p.coachFeedback}
                                    </div>
                                  )}

                                  {p.homework && (
                                    <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-[11px] text-purple-900">
                                      <strong>Bài tập về nhà:</strong> {p.homework}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CoachLayout>
  );
}
