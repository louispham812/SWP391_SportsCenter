import React, { useEffect, useState, useMemo } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { getCoachStudents } from '../../services/bookingApi';
import { generateCoachPlan } from '../../services/aiAssistantApi';
import { createWorkoutPlan, createClassWorkoutPlan, getMemberWorkoutProgress } from '../../services/workoutApi';
import { sendCoachNotice } from '../../services/coachApi';
import { CardGridSkeleton } from '../../components/common/Skeleton';
import { useApp } from '../../context/AppContext';

export default function CoachStudentsPage() {
  const [students, setStudents] = useState([]);
  const [rawBookings, setRawBookings] = useState([]);
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('ALL');
  const [generatingBookingId, setGeneratingBookingId] = useState(null);
  const [plans, setPlans] = useState({});
  const [planErrors, setPlanErrors] = useState({});

  // PT Workout Plan & Evaluation Modal State (COA-07..10 & Class-wide plans)
  const [selectedStudentForPlan, setSelectedStudentForPlan] = useState(null);
  const [planScope, setPlanScope] = useState('individual'); // 'individual' | 'class'
  const [selectedSessionIdForClassPlan, setSelectedSessionIdForClassPlan] = useState('');
  const [modalTab, setModalTab] = useState('create'); // 'create' | 'history'
  const [savingPlan, setSavingPlan] = useState(false);
  const [studentProgress, setStudentProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Notice Modal State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [noticeScope, setNoticeScope] = useState('individual'); // 'individual' | 'class'
  const [noticeTargetMemberId, setNoticeTargetMemberId] = useState('');
  const [noticeTargetSessionId, setNoticeTargetSessionId] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [sendingNotice, setSendingNotice] = useState(false);

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

  // Load student list
  const loadStudents = async () => {
    try {
      setLoading(true);
      const bookings = await getCoachStudents();
      setRawBookings(bookings || []);
      const byMember = new Map();

      (bookings || []).forEach((booking) => {
        const existing = byMember.get(booking.memberId) || {
          id: booking.memberId,
          name: booking.memberName,
          phone: booking.memberPhone,
          email: booking.memberEmail || '',
          avatar: booking.memberAvatar || '',
          fitnessLevel: booking.fitnessLevel || 'BEGINNER',
          fitnessGoals: booking.fitnessGoals || '',
          injuryHistory: booking.injuryHistory || '',
          weightKg: booking.weightKg,
          heightCm: booking.heightCm,
          bmi: booking.bmi,
          sessions: [],
        };

        // If later records have richer health info, fill in
        if (!existing.fitnessGoals && booking.fitnessGoals) existing.fitnessGoals = booking.fitnessGoals;
        if (!existing.injuryHistory && booking.injuryHistory) existing.injuryHistory = booking.injuryHistory;
        if (!existing.weightKg && booking.weightKg) {
          existing.weightKg = booking.weightKg;
          existing.heightCm = booking.heightCm;
          existing.bmi = booking.bmi;
        }

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

      setStudents([...byMember.values()]);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách học viên từ cơ sở dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Distinct sessions list for class-wide actions
  const uniqueSessions = useMemo(() => {
    const map = new Map();
    rawBookings.forEach((b) => {
      if (b.sessionId && !map.has(b.sessionId)) {
        map.set(b.sessionId, {
          sessionId: b.sessionId,
          className: b.className,
          startTime: b.startTime,
        });
      }
    });
    return Array.from(map.values());
  }, [rawBookings]);

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

  // Filter students by search, class and fitness level
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      const matchName = (student.name || '').toLowerCase().includes(query);
      const matchPhone = (student.phone || '').includes(query);
      const matchEmail = (student.email || '').toLowerCase().includes(query);
      const matchGoal = (student.fitnessGoals || '').toLowerCase().includes(query);
      const matchesSearch = !query || matchName || matchPhone || matchEmail || matchGoal;

      const matchesClass =
        selectedClassFilter === 'ALL' ||
        student.sessions.some((s) => s.className === selectedClassFilter);

      const matchesLevel =
        selectedLevelFilter === 'ALL' ||
        (student.fitnessLevel || 'BEGINNER').toUpperCase() === selectedLevelFilter.toUpperCase();

      return matchesSearch && matchesClass && matchesLevel;
    });
  }, [students, searchQuery, selectedClassFilter, selectedLevelFilter]);

  const totalEnrollments = useMemo(() => {
    return students.reduce((sum, s) => sum + s.sessions.length, 0);
  }, [students]);

  // Open plan modal for individual student
  const openPlanModal = async (student) => {
    setSelectedStudentForPlan(student);
    setPlanScope('individual');
    if (student?.sessions?.[0]?.sessionId) {
      setSelectedSessionIdForClassPlan(String(student.sessions[0].sessionId));
    }
    setModalTab('create');
    setPlanForm({
      ...initialPlanForm,
      title: `Giáo án Huấn luyện - ${student ? student.name : 'Lớp học'}`,
    });
    if (student) {
      setLoadingProgress(true);
      try {
        const data = await getMemberWorkoutProgress(student.id);
        setStudentProgress(data);
      } catch {
        setStudentProgress(null);
      } finally {
        setLoadingProgress(false);
      }
    }
  };

  // Open class plan modal directly
  const openClassPlanModal = () => {
    setSelectedStudentForPlan(null);
    setPlanScope('class');
    if (uniqueSessions.length > 0) {
      setSelectedSessionIdForClassPlan(String(uniqueSessions[0].sessionId));
    }
    setModalTab('create');
    setPlanForm({
      ...initialPlanForm,
      title: 'Giáo án Thể lực & Kỹ thuật Lớp học',
      goal: 'Nâng cao thể lực chung, kỹ thuật chuẩn và phản xạ đồng đội',
    });
    setStudentProgress(null);
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
    const availableAiPlan = selectedStudentForPlan?.sessions
      ?.map((s) => plans[s.bookingId])
      .find((p) => Boolean(p));

    setPlanForm((prev) => ({
      ...prev,
      title: planScope === 'class'
        ? 'Lộ trình Rèn luyện Đồng bộ - Cả Lớp'
        : `Lộ trình Thể lực Nâng cao - ${selectedStudentForPlan?.name || 'Học viên'}`,
      goal: availableAiPlan ? 'Tối ưu theo giáo án phân tích từ AI SportHub' : 'Tối ưu hóa sức mạnh bộc phát, nâng cao 1RM tạ và tốc độ phản xạ thể thao',
      exercises: [
        { name: 'Barbell Back Squat', sets: 4, reps: 8, weightKg: 60, note: 'Kiểm soát nhịp hạ tạ 3 giây' },
        { name: 'Romanian Deadlift (RDL)', sets: 4, reps: 10, weightKg: 50, note: 'Kéo căng cơ đùi sau và siết mông' },
        { name: 'Dumbbell Incline Bench Press', sets: 3, reps: 12, weightKg: 20, note: 'Mở rộng ngực, thở đều' },
        { name: 'Agility Ladder Drills (Bộ chân)', sets: 4, reps: 20, weightKg: 0, note: 'Tăng tốc độ guồng chân và thăng bằng' },
      ],
      sessionResult: 'Học viên hoàn thành đầy đủ các hiệp, kỹ thuật chuẩn xác và biên độ tối ưu.',
      coachFeedback: availableAiPlan
        ? `[Gợi ý AI]: ${availableAiPlan.slice(0, 300)}...`
        : 'Kỹ thuật cải thiện đáng kể, biên độ chuyển động đạt chuẩn thi đấu.',
      homework: 'Chạy bộ biến tốc HIIT 15 phút, nạp 1.8g protein/kg và ngủ đủ 8 tiếng.',
    }));
    showToast({
      title: 'Đã áp dụng mẫu',
      message: availableAiPlan ? 'Đã tích hợp nội dung phân tích từ AI vào giáo án.' : 'Đã điền giáo án thể lực chuẩn khoa học.',
      type: 'info',
    });
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.title.trim()) {
      showToast({ title: 'Cảnh báo', message: 'Vui lòng nhập tiêu đề giáo án.', type: 'warning' });
      return;
    }
    if (planForm.exercises.length === 0) {
      showToast({ title: 'Cảnh báo', message: 'Vui lòng thêm ít nhất một bài tập.', type: 'warning' });
      return;
    }

    setSavingPlan(true);
    try {
      if (planScope === 'class') {
        if (!selectedSessionIdForClassPlan) {
          showToast({ title: 'Cảnh báo', message: 'Vui lòng chọn ca lớp học cần áp dụng giáo án.', type: 'warning' });
          setSavingPlan(false);
          return;
        }
        const payload = {
          sessionId: Number(selectedSessionIdForClassPlan),
          title: planForm.title.trim(),
          goal: planForm.goal.trim(),
          exercisesJson: JSON.stringify(planForm.exercises),
          sessionResult: planForm.sessionResult.trim(),
          coachFeedback: planForm.coachFeedback.trim(),
          homework: planForm.homework.trim(),
          source: 'COACH',
        };
        const res = await createClassWorkoutPlan(payload);
        showToast({
          title: 'Thành công',
          message: res.message || `Đã giao giáo án đồng loạt cho ${res.createdCount || res.memberCount || 0} học viên trong lớp ${res.className || ''}!`,
          type: 'success',
        });
        setSelectedStudentForPlan(null);
      } else {
        if (!selectedStudentForPlan) {
          showToast({ title: 'Lỗi', message: 'Chưa chọn học viên.', type: 'error' });
          setSavingPlan(false);
          return;
        }
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
        showToast({
          title: 'Thành công',
          message: `Đã lưu giáo án & gửi thông báo cho ${selectedStudentForPlan.name}!`,
          type: 'success',
        });
        // Reload history
        const updated = await getMemberWorkoutProgress(selectedStudentForPlan.id);
        setStudentProgress(updated);
        setModalTab('history');
      }
    } catch (err) {
      showToast({ title: 'Lỗi', message: err.message || 'Không thể lưu giáo án tập luyện.', type: 'error' });
    } finally {
      setSavingPlan(false);
    }
  };

  const handleGeneratePlan = async (student, session) => {
    if (!session || !session.bookingId) {
      showToast({ title: 'Cảnh báo', message: 'Học viên chưa có mã đặt lịch (bookingId) hợp lệ để tạo giáo án AI.', type: 'warning' });
      return;
    }
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

  // Open Notice Modal
  const openNoticeModal = (target) => {
    if (target?.memberId) {
      setNoticeScope('individual');
      setNoticeTargetMemberId(String(target.memberId));
      if (target.sessions?.[0]?.sessionId) {
        setNoticeTargetSessionId(String(target.sessions[0].sessionId));
      }
      setNoticeTitle(`Nhắc nhở học viên ${target.name}`);
    } else if (target?.sessionId) {
      setNoticeScope('class');
      setNoticeTargetSessionId(String(target.sessionId));
      setNoticeTitle(`Thông báo lớp ${target.className || ''}`);
    } else {
      setNoticeScope('class');
      if (uniqueSessions.length > 0) {
        setNoticeTargetSessionId(String(uniqueSessions[0].sessionId));
      }
      setNoticeTitle('Thông báo chung từ Huấn luyện viên');
    }
    setNoticeMessage('');
    setNoticeModalOpen(true);
  };

  const handleApplyNoticeTemplate = (template) => {
    setNoticeTitle(template.title);
    setNoticeMessage(template.message);
  };

  const handleSendNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      showToast({ title: 'Cảnh báo', message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.', type: 'warning' });
      return;
    }

    if (noticeScope === 'individual' && !noticeTargetMemberId) {
      showToast({ title: 'Cảnh báo', message: 'Vui lòng chọn học viên nhận thông báo.', type: 'warning' });
      return;
    }

    if (noticeScope === 'class' && !noticeTargetSessionId) {
      showToast({ title: 'Cảnh báo', message: 'Vui lòng chọn ca lớp học nhận thông báo.', type: 'warning' });
      return;
    }

    setSendingNotice(true);
    try {
      const payload = {
        memberId: noticeScope === 'individual' ? Number(noticeTargetMemberId) : null,
        sessionId: noticeScope === 'class' ? Number(noticeTargetSessionId) : null,
        title: noticeTitle.trim(),
        message: noticeMessage.trim(),
      };
      const res = await sendCoachNotice(payload);
      const successMsg = res.target === 'CLASS'
        ? `Đã gửi thông báo đến ${res.sentCount} học viên trong lớp ${res.className || ''}!`
        : `Đã gửi thông báo đến học viên ${res.studentName || ''}!`;
      showToast({
        title: 'Thành công',
        message: res.message || successMsg,
        type: 'success',
      });
      setNoticeModalOpen(false);
    } catch (err) {
      showToast({ title: 'Lỗi', message: err.message || 'Không thể gửi thông báo.', type: 'error' });
    } finally {
      setSendingNotice(false);
    }
  };

  const getFitnessLevelBadge = (level) => {
    switch ((level || '').toUpperCase()) {
      case 'ADVANCED':
        return <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black uppercase">Nâng cao</span>;
      case 'INTERMEDIATE':
        return <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-black uppercase">Trung cấp</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">Mới bắt đầu</span>;
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
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Học Viên & Giáo Án</h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý hồ sơ thể lực PAR-Q, giao giáo án bài tập cá nhân / cả lớp và gửi thông báo trực tiếp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openNoticeModal()}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">campaign</span>
              Gửi Thông Báo / Nhắc Nhở
            </button>

            <button
              type="button"
              onClick={openClassPlanModal}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">assignment_add</span>
              Giao Giáo Án Cả Lớp
            </button>

            <span className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
              Tổng số: <strong className="text-orange-600 font-black">{students.length}</strong> học viên
            </span>
          </div>
        </header>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="sm:col-span-2 relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo họ tên, SĐT, email hoặc mục tiêu tập luyện..."
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

          <div>
            <select
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="ALL">Mọi trình độ thể lực</option>
              <option value="BEGINNER">Mới bắt đầu (Beginner)</option>
              <option value="INTERMEDIATE">Trung cấp (Intermediate)</option>
              <option value="ADVANCED">Nâng cao (Advanced)</option>
            </select>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}

        {loading ? (
          <CardGridSkeleton count={6} cols="grid gap-4 md:grid-cols-2 xl:grid-cols-3" />
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl text-slate-300">groups</span>
            <span>Không tìm thấy học viên nào phù hợp với bộ lọc hiện tại.</span>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                  className={`rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                    hasStudentTimeConflict
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200 bg-white hover:border-orange-300'
                  }`}
                >
                  <div>
                    {/* Top row: Avatar & Basic Info */}
                    <div className="flex items-start justify-between gap-2">
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

                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase">
                          ID: #{student.id}
                        </span>
                        {getFitnessLevelBadge(student.fitnessLevel)}
                      </div>
                    </div>

                    {/* ITEM 2: HỒ SƠ THỂ LỰC & CHỈ SỐ INBODY */}
                    <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                      {/* Body metrics */}
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">straighten</span>
                          {student.heightCm ? `${student.heightCm} cm` : 'Cao: --'}
                        </span>
                        <span className="font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">scale</span>
                          {student.weightKg ? `${student.weightKg} kg` : 'Nặng: --'}
                        </span>
                        <span className="font-bold text-orange-600">
                          BMI: {student.bmi ? Number(student.bmi).toFixed(1) : '--'}
                        </span>
                      </div>

                      {/* Fitness Goals */}
                      {student.fitnessGoals && (
                        <div className="text-[11px] text-slate-700 flex items-start gap-1">
                          <span className="material-symbols-outlined text-[13px] text-blue-500 shrink-0 mt-0.5">flag</span>
                          <span className="line-clamp-2"><strong>Mục tiêu:</strong> {student.fitnessGoals}</span>
                        </div>
                      )}

                      {/* PAR-Q / Injury History Alert */}
                      {student.injuryHistory && student.injuryHistory.trim() !== '' && (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-amber-600 shrink-0 mt-0.5">warning</span>
                          <span><strong>PAR-Q / Chấn thương:</strong> {student.injuryHistory}</span>
                        </div>
                      )}
                    </div>

                    {hasStudentTimeConflict && (
                      <div className="mt-3 p-2 rounded-lg bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">warning</span>
                        <span>Học viên có ca học bị trùng khung giờ!</span>
                      </div>
                    )}

                    {/* Danh sách ca học */}
                    <div className="mt-3.5 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Lớp đăng ký ({student.sessions.length} ca)
                        </p>
                        <span className="text-[10px] font-bold text-orange-600">
                          {student.sessions[0]?.className}
                        </span>
                      </div>

                      <ul className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                        {student.sessions.map((session) => (
                          <li
                            key={`${student.id}-${session.bookingId}`}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-bold text-slate-800 block text-[11px]">
                                  {session.className}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5 block">
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
                              disabled={generatingBookingId !== null || !session.bookingId}
                              title={!session.bookingId ? 'Chưa có thông tin booking hợp lệ' : 'Tạo giáo án cá nhân hóa bằng AI'}
                              className="mt-2 flex items-center justify-center gap-1.5 w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[13px]">smart_toy</span>
                              {generatingBookingId === session.bookingId
                                ? 'Đang tạo giáo án AI...'
                                : 'Gợi ý giáo án AI'}
                            </button>

                            {planErrors[session.bookingId] && (
                              <p
                                role="alert"
                                className="mt-1.5 rounded-lg border border-red-200 bg-red-50 p-1.5 text-[10px] text-red-800"
                              >
                                {planErrors[session.bookingId]}
                              </p>
                            )}

                            {plans[session.bookingId] && (
                              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs text-slate-800 space-y-1 animate-in fade-in">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                  <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                                  Giáo án gợi ý AI
                                </div>
                                <div className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium text-[11px] max-h-32 overflow-y-auto">
                                  {plans[session.bookingId]}
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons: Giao Giáo Án & Gửi Thông Báo */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openPlanModal(student)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 py-2 text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">assignment_add</span>
                      Soạn Giáo Án
                    </button>
                    <button
                      type="button"
                      onClick={() => openNoticeModal({ memberId: student.id, name: student.name, sessions: student.sessions })}
                      className="flex items-center justify-center gap-1 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 py-2 text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">send</span>
                      Gửi Nhắc Nhở
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">info</span>
          <div>
            <strong>Lưu ý quản lý học viên & an toàn tập luyện:</strong> Huấn luyện viên luôn kiểm tra thông tin tiền sử chấn thương (PAR-Q) trước khi nâng mức tạ 1RM hoặc giao bài tập cường độ cao. Mọi giáo án giao sẽ được tự động gửi thông báo đến ứng dụng của học viên.
          </div>
        </div>

        {/* MODAL: SOẠN GIÁO ÁN & ĐÁNH GIÁ (CÁ NHÂN HOẶC CẢ LỚP) */}
        {(selectedStudentForPlan || planScope === 'class') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black">
                    <span className="material-symbols-outlined text-[22px]">fitness_center</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {planScope === 'class'
                        ? 'Giao Giáo Án Đồng Bộ Cho Cả Lớp'
                        : `Soạn Kế Hoạch & Đánh Giá PT · ${selectedStudentForPlan?.name}`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {planScope === 'class'
                        ? 'Tạo và phân bổ giáo án tập luyện đồng bộ đến toàn bộ học viên đã đăng ký ca này'
                        : `ID Học viên: #${selectedStudentForPlan?.id} · ĐT: ${selectedStudentForPlan?.phone || 'N/A'}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentForPlan(null);
                    setPlanScope('individual');
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* ITEM 3: PHẠM VI ÁP DỤNG GIÁO ÁN (CÁ NHÂN VS CẢ LỚP) */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                  <span>Phạm vi giáo án:</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="planScopeRadio"
                      value="individual"
                      checked={planScope === 'individual'}
                      disabled={!selectedStudentForPlan}
                      onChange={() => setPlanScope('individual')}
                      className="accent-orange-500"
                    />
                    <span>Cá nhân {selectedStudentForPlan ? `(${selectedStudentForPlan.name})` : ''}</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="planScopeRadio"
                      value="class"
                      checked={planScope === 'class'}
                      onChange={() => setPlanScope('class')}
                      className="accent-orange-500"
                    />
                    <span>Toàn bộ lớp học</span>
                  </label>
                </div>

                {planScope === 'class' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 shrink-0">Chọn ca lớp:</label>
                    <select
                      value={selectedSessionIdForClassPlan}
                      onChange={(e) => setSelectedSessionIdForClassPlan(e.target.value)}
                      className="bg-white border border-slate-300 text-xs font-bold py-1.5 px-2.5 rounded-xl outline-none focus:border-orange-500"
                    >
                      {uniqueSessions.map((s) => (
                        <option key={s.sessionId} value={s.sessionId}>
                          {s.className} ({new Date(s.startTime).toLocaleDateString('vi-VN')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* ITEM 2: HỒ SƠ SỨC KHỎE HỌC VIÊN HIỂN THỊ TRONG MODAL */}
              {planScope === 'individual' && selectedStudentForPlan && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-orange-50/50 border border-orange-200/80 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Thể trạng & BMI</span>
                    <span className="font-bold text-slate-800">
                      {selectedStudentForPlan.heightCm ? `${selectedStudentForPlan.heightCm}cm` : '--'} · {selectedStudentForPlan.weightKg ? `${selectedStudentForPlan.weightKg}kg` : '--'}
                      {selectedStudentForPlan.bmi && ` (BMI: ${Number(selectedStudentForPlan.bmi).toFixed(1)})`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Mục tiêu huấn luyện</span>
                    <span className="font-bold text-slate-800 line-clamp-1">{selectedStudentForPlan.fitnessGoals || 'Chưa cập nhật'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Cảnh báo PAR-Q / Chấn thương</span>
                    <span className="font-bold text-amber-700 line-clamp-1">{selectedStudentForPlan.injuryHistory || 'Không ghi nhận chấn thương'}</span>
                  </div>
                </div>
              )}

              {/* Modal Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalTab('create')}
                  className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'create'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">edit_document</span>
                  Soạn Giáo Án
                </button>
                {planScope === 'individual' && (
                  <button
                    type="button"
                    onClick={() => setModalTab('history')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                      modalTab === 'history'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    Lịch Sử Giáo Án & Thể Trạng
                  </button>
                )}
              </div>

              {/* TAB 1: FORM SOẠN GIÁO ÁN */}
              {modalTab === 'create' && (
                <form onSubmit={handleSavePlan} className="space-y-4">
                  <div className="flex items-center justify-between bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                    <span className="text-xs text-amber-900 font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-amber-600">auto_awesome</span>
                      Tự động điền bài tập chuẩn khoa học
                    </span>
                    <button
                      type="button"
                      onClick={handleFillAiTemplate}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      Điền mẫu gợi ý AI
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

                  {/* Danh sách bài tập */}
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

                  {/* Kết quả buổi tập & 1RM */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">monitoring</span>
                      Kết quả buổi tập & Mức tạ 1RM đạt được
                    </label>
                    <textarea
                      rows="2"
                      value={planForm.sessionResult}
                      onChange={(e) => setPlanForm({ ...planForm, sessionResult: e.target.value })}
                      placeholder="VD: Squat 75kg 4x10 mượt mà. 1RM Squat ước tính đạt 95kg. Thời gian hoàn thành 45 phút."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* Nhận xét chuyên môn */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-emerald-500">rate_review</span>
                      Nhận xét & Đánh giá chuyên môn của HLV
                    </label>
                    <textarea
                      rows="2"
                      value={planForm.coachFeedback}
                      onChange={(e) => setPlanForm({ ...planForm, coachFeedback: e.target.value })}
                      placeholder="VD: Cảm giác bóng và bộ chân di chuyển tiến bộ rõ rệt. Cần chú ý giữ nhịp thở đều ở set thứ 4."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* Bài tập về nhà */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-purple-500">home_work</span>
                      Bài tập về nhà & Lời khuyên dinh dưỡng
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
                      onClick={() => {
                        setSelectedStudentForPlan(null);
                        setPlanScope('individual');
                      }}
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
                      {savingPlan
                        ? 'Đang lưu...'
                        : planScope === 'class'
                        ? 'Giao Giáo Án Toàn Bộ Lớp'
                        : 'Lưu Giáo Án & Gửi Học Viên'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: LỊCH SỬ GIÁO ÁN & TIẾN ĐỘ CƠ THỂ */}
              {modalTab === 'history' && planScope === 'individual' && (
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
                      {/* Bảng mốc đo cơ thể */}
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

                      {/* Danh sách giáo án đã giao */}
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

        {/* ITEM 7: MODAL GỬI THÔNG BÁO / NHẮC NHỞ CHO HỌC VIÊN HOẶC CẢ LỚP */}
        {noticeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black">
                    <span className="material-symbols-outlined text-[20px]">campaign</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Gửi Thông Báo / Nhắc Nhở</h3>
                    <p className="text-xs text-slate-500">Gửi thông điệp trực tiếp đến học viên qua hệ thống thông báo F Sport</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNoticeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Phạm vi thông báo */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                  <span>Đối tượng nhận:</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="noticeScopeRadio"
                      value="individual"
                      checked={noticeScope === 'individual'}
                      onChange={() => setNoticeScope('individual')}
                      className="accent-blue-500"
                    />
                    <span>Học viên riêng</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="noticeScopeRadio"
                      value="class"
                      checked={noticeScope === 'class'}
                      onChange={() => setNoticeScope('class')}
                      className="accent-blue-500"
                    />
                    <span>Toàn bộ ca / lớp</span>
                  </label>
                </div>

                {noticeScope === 'individual' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Chọn học viên nhận tin:</label>
                    <select
                      value={noticeTargetMemberId}
                      onChange={(e) => setNoticeTargetMemberId(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs font-semibold py-2 px-3 rounded-xl outline-none focus:border-blue-500"
                    >
                      <option value="">-- Chọn học viên --</option>
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} - #{st.id} ({st.phone || 'Không có SĐT'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Chọn ca lớp học nhận tin:</label>
                    <select
                      value={noticeTargetSessionId}
                      onChange={(e) => setNoticeTargetSessionId(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs font-semibold py-2 px-3 rounded-xl outline-none focus:border-blue-500"
                    >
                      <option value="">-- Chọn ca lớp học --</option>
                      {uniqueSessions.map((s) => (
                        <option key={s.sessionId} value={s.sessionId}>
                          {s.className} - Ngày {new Date(s.startTime).toLocaleDateString('vi-VN')} ({new Date(s.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Mẫu thông báo nhanh */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1.5">Mẫu thông báo thường dùng:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: '🔔 Giờ tập & Trang phục',
                      title: 'Nhắc nhở chuẩn bị giờ tập luyện',
                      message: 'Chào bạn, đừng quên mang theo giày thể thao chuyên dụng, khăn tập và bình nước cá nhân để buổi tập đạt hiệu quả cao nhất nhé!',
                    },
                    {
                      label: '💧 Bù nước & Dinh dưỡng',
                      title: 'Lưu ý bổ sung năng lượng trước tập',
                      message: 'Hãy ăn nhẹ (chuối, yến mạch hoặc bánh mì nguyên cám) trước buổi tập khoảng 45 phút và uống đủ 500ml nước nhé!',
                    },
                    {
                      label: '⏰ Dời giờ / Cập nhật lịch',
                      title: 'Cập nhật lịch tập luyện',
                      message: 'Huấn luyện viên xin thông báo có sự điều chỉnh nhẹ về lịch tập của ca sắp tới. Bạn vui lòng kiểm tra lịch trên ứng dụng nhé!',
                    },
                    {
                      label: '👏 Khen ngợi nỗ lực',
                      title: 'Khen ngợi nỗ lực tập luyện',
                      message: 'Chúc mừng bạn đã hoàn thành xuất sắc giáo án tập luyện của buổi tập vừa rồi! Hãy giữ vững phong độ và tinh thần kỷ luật nhé!',
                    },
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyNoticeTemplate(tpl)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-[11px] font-semibold border border-blue-200 transition cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendNotice} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề thông báo *</label>
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="VD: Nhắc nhở lịch tập & trang phục..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung thông báo *</label>
                  <textarea
                    rows="3"
                    required
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    placeholder="Nhập nội dung cần nhắn nhủ đến học viên..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setNoticeModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={sendingNotice}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    {sendingNotice ? 'Đang gửi...' : 'Gửi Thông Báo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CoachLayout>
  );
}
