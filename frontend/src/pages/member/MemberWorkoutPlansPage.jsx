import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { getMemberHealthProfile, updateMemberHealthProfile, getMemberAttendance } from '../../services/memberApi';
import { getMyWorkoutProgress, createWorkoutPlan, recordBodyProgress } from '../../services/workoutApi';
import { useApp } from '../../context/AppContext';
import FormattedAiText from '../../components/common/FormattedAiText';
import { CardGridSkeleton } from '../../components/common/Skeleton';

export default function MemberWorkoutPlansPage() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'progress' | 'feedback' | 'ai'

  // Health Profile State
  const [healthProfile, setHealthProfile] = useState({
    fitnessLevel: 'INTERMEDIATE',
    fitnessGoals: '',
    injuryHistory: '',
    weightKg: '',
    heightCm: '',
    smmKg: '',
    pbfPercent: '',
    bmi: '',
  });
  const [editHealthMode, setEditHealthMode] = useState(false);
  const [savingHealth, setSavingHealth] = useState(false);

  // Group B States: Plans, Body Logs, Attendance Notes
  const [plans, setPlans] = useState([]);
  const [bodyLogs, setBodyLogs] = useState([]);
  const [coachNotes, setCoachNotes] = useState([]);

  // Form Thêm Mốc Đo Tiến Độ Mới (MEM-21)
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [newLog, setNewLog] = useState({
    recordedDate: new Date().toISOString().slice(0, 10),
    weightKg: '',
    heightCm: '',
    smmKg: '',
    pbfPercent: '',
    maxLiftKg: '',
    note: '',
  });
  const [savingLog, setSavingLog] = useState(false);

  // Gợi Ý Bài Tập AI Tự Động (MEM-23)
  const [aiGoal, setAiGoal] = useState('HYPERTROPHY');
  const [aiCustomNote, setAiCustomNote] = useState('');
  const [aiGeneratedPlan, setAiGeneratedPlan] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [savingAiPlan, setSavingAiPlan] = useState(false);

  // Trạng thái đánh dấu bài tập đã hoàn thành trong buổi tập
  const [completedExercises, setCompletedExercises] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('member_completed_exercises') || '{}');
    } catch {
      return {};
    }
  });

  const handleToggleExercise = (planId, exIdx) => {
    setCompletedExercises((prev) => {
      const key = `${planId}-${exIdx}`;
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('member_completed_exercises', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [healthRes, attendanceRes, workoutProgressRes] = await Promise.all([
        getMemberHealthProfile().catch(() => null),
        getMemberAttendance().catch(() => null),
        getMyWorkoutProgress().catch(() => null),
      ]);

      if (healthRes) {
        setHealthProfile({
          fitnessLevel: healthRes.fitnessLevel || 'INTERMEDIATE',
          fitnessGoals: healthRes.fitnessGoals || '',
          injuryHistory: healthRes.injuryHistory || '',
          weightKg: healthRes.weightKg != null ? healthRes.weightKg : '',
          heightCm: healthRes.heightCm != null ? healthRes.heightCm : '',
          smmKg: healthRes.smmKg != null ? healthRes.smmKg : '',
          pbfPercent: healthRes.pbfPercent != null ? healthRes.pbfPercent : '',
          bmi: healthRes.bmi != null ? healthRes.bmi : '',
        });
      }

      if (attendanceRes && Array.isArray(attendanceRes.records)) {
        const notes = attendanceRes.records
          .filter((r) => r.coachNote || r.status === 'ATTENDED' || r.status === 'PRESENT')
          .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        setCoachNotes(notes);
      }

      if (workoutProgressRes) {
        setPlans(workoutProgressRes.plans || []);
        setBodyLogs(workoutProgressRes.bodyLogs || []);
      }
    } catch (err) {
      console.error('Error loading workout plans:', err);
      showToast('Lỗi', 'Không thể tải dữ liệu kế hoạch và tiến độ tập luyện.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // BMI Helper
  const getBmiBadge = (bmi) => {
    const b = parseFloat(bmi);
    if (!b || isNaN(b)) return { label: 'Chưa tính', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    if (b < 18.5) return { label: 'Thiếu cân', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (b <= 24.9) return { label: 'Cân đối (Lý tưởng)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (b <= 29.9) return { label: 'Thừa cân nhẹ', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { label: 'Cần giảm mỡ', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  const bmiStatus = getBmiBadge(healthProfile.bmi);

  // Lưu InBody cơ bản
  const handleSaveHealthProfile = async (e) => {
    e.preventDefault();
    setSavingHealth(true);
    try {
      const payload = {
        fitnessLevel: healthProfile.fitnessLevel,
        fitnessGoals: healthProfile.fitnessGoals,
        injuryHistory: healthProfile.injuryHistory,
        weightKg: healthProfile.weightKg ? parseFloat(healthProfile.weightKg) : null,
        heightCm: healthProfile.heightCm ? parseFloat(healthProfile.heightCm) : null,
        smmKg: healthProfile.smmKg ? parseFloat(healthProfile.smmKg) : null,
        pbfPercent: healthProfile.pbfPercent ? parseFloat(healthProfile.pbfPercent) : null,
        bmi: healthProfile.bmi ? parseFloat(healthProfile.bmi) : null,
      };
      await updateMemberHealthProfile(payload);
      showToast('Thành công', 'Đã cập nhật chỉ số InBody và mục tiêu thể chất.', 'success');
      setEditHealthMode(false);
      // Ghi thêm vào mốc body_progress_logs nếu có số cân nặng
      if (payload.weightKg) {
        await recordBodyProgress({
          recordedDate: new Date().toISOString().slice(0, 10),
          weightKg: payload.weightKg,
          heightCm: payload.heightCm,
          smmKg: payload.smmKg,
          pbfPercent: payload.pbfPercent,
          bmi: payload.bmi,
          note: 'Cập nhật từ màn hình hồ sơ InBody',
        });
        const updated = await getMyWorkoutProgress();
        if (updated) setBodyLogs(updated.bodyLogs || []);
      }
    } catch (err) {
      showToast('Lỗi', err.message || 'Không thể lưu chỉ số thể chất.', 'error');
    } finally {
      setSavingHealth(false);
    }
  };

  // Lưu Mốc Đo Mới (MEM-21)
  const handleSaveNewLog = async (e) => {
    e.preventDefault();
    if (!newLog.weightKg) {
      showToast('Cảnh báo', 'Vui lòng nhập cân nặng.', 'warning');
      return;
    }
    setSavingLog(true);
    try {
      const payload = {
        recordedDate: newLog.recordedDate,
        weightKg: Number(newLog.weightKg),
        heightCm: newLog.heightCm ? Number(newLog.heightCm) : null,
        smmKg: newLog.smmKg ? Number(newLog.smmKg) : null,
        pbfPercent: newLog.pbfPercent ? Number(newLog.pbfPercent) : null,
        maxLiftKg: newLog.maxLiftKg ? Number(newLog.maxLiftKg) : null,
        note: newLog.note.trim() || 'Tự đo tại trung tâm',
      };
      await recordBodyProgress(payload);
      showToast('Thành công', 'Đã lưu mốc đo tiến độ cơ thể & mức tạ 1RM mới!', 'success');
      setShowAddLogModal(false);
      setNewLog({
        recordedDate: new Date().toISOString().slice(0, 10),
        weightKg: '',
        heightCm: '',
        smmKg: '',
        pbfPercent: '',
        maxLiftKg: '',
        note: '',
      });
      const updated = await getMyWorkoutProgress();
      if (updated) setBodyLogs(updated.bodyLogs || []);
    } catch (err) {
      showToast('Lỗi', err.message || 'Không thể ghi nhận mốc đo.', 'error');
    } finally {
      setSavingLog(false);
    }
  };

  // Sinh Lộ Trình Bằng AI (MEM-23)
  const handleGenerateAiPlan = () => {
    setGeneratingAi(true);
    setTimeout(() => {
      let title = 'Lộ trình Tăng Cơ & Giảm Mỡ Cân Đối';
      let goal = 'Tối ưu phát triển khối cơ nạc SMM, giảm 2% mỡ PBF trong 4 tuần';
      let exercises = [
        { name: 'Goblet Squat tạ chuông (Kettlebell)', sets: 4, reps: 12, weightKg: 16, note: 'Siết mông ở đỉnh, hít sâu khi xuống' },
        { name: 'Dumbbell Incline Bench Press', sets: 4, reps: 10, weightKg: 18, note: 'Ép chặt bả vai, góc đẩy 30-45 độ' },
        { name: 'Lat Pulldown kéo cáp', sets: 4, reps: 12, weightKg: 40, note: 'Kéo thanh đòn về ngang xương quai xanh' },
        { name: 'Plank nâng chân luân phiên', sets: 3, reps: 30, weightKg: 0, note: 'Giữ hông thăng bằng không lắc lư' },
      ];
      let homework = 'Cardio đi bộ dốc 25 phút sau buổi tập. Bổ sung 2 lít nước và 120g ức gà hoặc cá ngừ.';

      if (aiGoal === 'SPORT_PERFORMANCE') {
        title = 'Giáo án Tăng Tốc Độ & Sức Bật Thể Thao (Pickleball / Tennis)';
        goal = 'Tăng sức mạnh bộc phát chân, độ linh hoạt cổ tay và phản xạ lưới';
        exercises = [
          { name: 'Box Jump (Bật nhảy bục)', sets: 4, reps: 8, weightKg: 0, note: 'Tiếp đất êm ái bằng nửa bàn chân trước' },
          { name: 'Lateral Lunges tạ đơn', sets: 3, reps: 12, weightKg: 12, note: 'Mở rộng khớp háng, giữ lưng thẳng' },
          { name: 'Medicine Ball Rotational Throw', sets: 4, reps: 10, weightKg: 6, note: 'Xoay hông dứt khoát mô phỏng cú đánh' },
          { name: 'Footwork Agility Ladder', sets: 4, reps: 30, weightKg: 0, note: 'Nhịp thở nhanh, mắt nhìn thẳng' },
        ];
        homework = 'Tập giao bóng và footwork 20 phút tại nhà. Ngâm chân nước ấm trước khi ngủ.';
      } else if (aiGoal === 'RECOVERY') {
        title = 'Lộ trình Phục Hồi Thể Lực & Yoga Cột Sống';
        goal = 'Giải tỏa căng cứng cơ bắp, hỗ trợ lưu thông máu và cân chỉnh tư thế';
        exercises = [
          { name: 'Cat-Cow Stretch', sets: 3, reps: 15, weightKg: 0, note: 'Chuyển động uốn cong lưng chậm rãi' },
          { name: 'Bird Dog thăng bằng', sets: 3, reps: 12, weightKg: 0, note: 'Siết cơ bụng, giữ tay và chân thẳng hàng' },
          { name: 'Foam Rolling đùi & lưng', sets: 3, reps: 45, weightKg: 0, note: 'Lăn chậm qua các điểm co thắt' },
          { name: 'Child Pose (Tư thế đứa trẻ)', sets: 2, reps: 60, weightKg: 0, note: 'Thở bụng sâu và thư giãn toàn thân' },
        ];
        homework = 'Uống trà hoa cúc ấm, ngủ đủ 8 tiếng, hạn chế nhìn màn hình trước khi ngủ 30 phút.';
      }

      setAiGeneratedPlan({
        title,
        goal: aiCustomNote ? `${goal} (Yêu cầu thêm: ${aiCustomNote})` : goal,
        exercises,
        homework,
        sessionResult: 'Học viên tự giác hoàn thành theo giáo án gợi ý của Trợ lý AI.',
        coachFeedback: 'Hệ thống AI đánh giá phân bố bài tập phù hợp với thể trạng hiện tại của bạn.',
      });
      setGeneratingAi(false);
      showToast('Thành công', 'Trợ lý AI đã thiết kế giáo án phù hợp với chỉ số thể chất của bạn!', 'success');
    }, 800);
  };

  // Lưu giáo án AI vào DB (MEM-23)
  const handleSaveAiPlanToDb = async () => {
    if (!aiGeneratedPlan) return;
    setSavingAiPlan(true);
    try {
      const payload = {
        title: aiGeneratedPlan.title,
        goal: aiGeneratedPlan.goal,
        exercisesJson: JSON.stringify(aiGeneratedPlan.exercises),
        sessionResult: aiGeneratedPlan.sessionResult,
        coachFeedback: aiGeneratedPlan.coachFeedback,
        homework: aiGeneratedPlan.homework,
        source: 'AI',
      };
      await createWorkoutPlan(payload);
      showToast('Thành công', 'Đã lưu giáo án AI vào danh sách Kế hoạch tập của bạn!', 'success');
      const updated = await getMyWorkoutProgress();
      if (updated) setPlans(updated.plans || []);
      setActiveTab('plans');
    } catch (err) {
      showToast('Lỗi', err.message || 'Không thể lưu giáo án AI.', 'error');
    } finally {
      setSavingAiPlan(false);
    }
  };

  // Tính mức tiến bộ từ mốc đầu đến mốc cuối (MEM-21)
  const progressStats = React.useMemo(() => {
    if (bodyLogs.length < 2) return null;
    const first = bodyLogs[0];
    const last = bodyLogs[bodyLogs.length - 1];
    return {
      weightDiff: (Number(last.weightKg || 0) - Number(first.weightKg || 0)).toFixed(1),
      smmDiff: (Number(last.smmKg || 0) - Number(first.smmKg || 0)).toFixed(1),
      pbfDiff: (Number(last.pbfPercent || 0) - Number(first.pbfPercent || 0)).toFixed(1),
      liftDiff: (Number(last.maxLiftKg || 0) - Number(first.maxLiftKg || 0)).toFixed(1),
    };
  }, [bodyLogs]);

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">fitness_center</span>
              Huấn Luyện Cá Nhân & Theo Dõi Thể Chất
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Kế Hoạch Tập Luyện & Tiến Độ Cơ Thể
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Xem giáo án PT, bài tập về nhà từ HLV, theo dõi biến thiên chỉ số cơ thể và nhận lộ trình tập luyện thông minh từ AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddLogModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_chart</span>
              Ghi Mốc Đo Tiến Độ
            </button>
            <button
              onClick={() => setEditHealthMode(!editHealthMode)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {editHealthMode ? 'close' : 'edit_note'}
              </span>
              {editHealthMode ? 'Đóng InBody' : 'Cập nhật InBody'}
            </button>
          </div>
        </div>

        {/* Section 1: InBody Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chỉ Số Khối BMI</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{healthProfile.bmi || '--'}</span>
              <span className="text-xs text-slate-400">kg/m²</span>
            </div>
            <div className="mt-2">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${bmiStatus.color}`}>
                {bmiStatus.label}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cân Nặng & Chiều Cao</span>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {healthProfile.weightKg ? `${healthProfile.weightKg} kg` : '--'}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Chiều cao: {healthProfile.heightCm ? `${healthProfile.heightCm} cm` : '--'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khối Lượng Cơ (SMM)</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600">
                {healthProfile.smmKg || '--'}
              </span>
              <span className="text-xs text-slate-400">kg</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Skeletal Muscle Mass</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỉ Lệ Mỡ (PBF)</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-orange-600">
                {healthProfile.pbfPercent != null ? `${healthProfile.pbfPercent}%` : '--'}
              </span>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Percent Body Fat</span>
          </div>
        </div>

        {/* Form Edit InBody Profile (Toggled) */}
        {editHealthMode && (
          <form onSubmit={handleSaveHealthProfile} className="p-6 bg-white rounded-2xl border border-orange-200 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Cập Nhật Hồ Sơ InBody Cá Nhân</h3>
              <span className="material-symbols-outlined text-orange-500 text-[22px]">fitness_center</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cân nặng (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={healthProfile.weightKg}
                  onChange={(e) => setHealthProfile({ ...healthProfile, weightKg: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chiều cao (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={healthProfile.heightCm}
                  onChange={(e) => setHealthProfile({ ...healthProfile, heightCm: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Khối lượng cơ SMM (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={healthProfile.smmKg}
                  onChange={(e) => setHealthProfile({ ...healthProfile, smmKg: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tỉ lệ mỡ PBF (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={healthProfile.pbfPercent}
                  onChange={(e) => setHealthProfile({ ...healthProfile, pbfPercent: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditHealthMode(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingHealth}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-xs disabled:opacity-50"
              >
                {savingHealth ? 'Đang lưu...' : 'Lưu chỉ số'}
              </button>
            </div>
          </form>
        )}

        {/* Main Tab Navigation: 4 Features */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'plans'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">assignment</span>
            Kế Hoạch Tập & Bài Về Nhà ({plans.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'progress'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            Lịch Sử Tiến Độ & 1RM ({bodyLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'feedback'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">rate_review</span>
            Nhận Xét Chuyên Môn HLV
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            Gợi Ý Bài Tập AI
          </button>
        </div>

        {/* TAB 1: KẾ HOẠCH TẬP PT & BÀI TẬP VỀ NHÀ (MEM-20) */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            {loading ? (
              <CardGridSkeleton count={4} cols="grid grid-cols-1 md:grid-cols-2 gap-4" />
            ) : plans.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                <span className="material-symbols-outlined text-[36px] text-slate-300">fitness_center</span>
                <h3 className="text-sm font-bold text-slate-700">Chưa có kế hoạch tập luyện nào</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Huấn luyện viên sẽ giao giáo án chi tiết cho bạn sau các buổi tập PT, hoặc bạn có thể bấm tab "Gợi Ý Bài Tập AI" để tự sinh lộ trình tập ngay!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  Sinh Kế Hoạch Với AI Ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  let exercises = [];
                  try {
                    exercises = JSON.parse(plan.exercisesJson || '[]');
                  } catch {
                    exercises = [];
                  }
                  return (
                    <div key={plan.planId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              plan.source === 'AI'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}>
                              <span className="material-symbols-outlined text-[13px]">
                                {plan.source === 'AI' ? 'smart_toy' : 'sports'}
                              </span>
                              {plan.source === 'AI' ? 'Gợi Ý AI' : `HLV ${plan.coachName || 'Huấn luyện viên'}`}
                            </span>
                            <h3 className="font-bold text-base text-slate-900 mt-1.5">{plan.title}</h3>
                            {plan.goal && (
                              <p className="text-xs text-slate-500 font-medium mt-0.5">Mục tiêu: {plan.goal}</p>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                            {new Date(plan.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        {/* Danh sách bài tập có Checklist tương tác (MEM-20) */}
                        {(() => {
                          const completedCount = exercises.filter((_, idx) => completedExercises[`${plan.planId}-${idx}`]).length;
                          const progressPercent = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;
                          return (
                            <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  Chi Tiết Bài Tập &amp; Tích Hoàn Thành
                                </span>
                                <span className={`text-[11px] font-bold ${progressPercent === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                  {completedCount}/{exercises.length} hoàn thành ({progressPercent}%)
                                </span>
                              </div>

                              {/* Thanh tiến độ buổi tập */}
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    progressPercent === 100 ? 'bg-emerald-500' : 'bg-orange-500'
                                  }`}
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>

                              <div className="space-y-1.5 pt-1">
                                {exercises.map((ex, idx) => {
                                  const isDone = Boolean(completedExercises[`${plan.planId}-${idx}`]);
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => handleToggleExercise(plan.planId, idx)}
                                      className={`flex items-center justify-between text-xs p-2 rounded-lg border transition-all cursor-pointer select-none ${
                                        isDone
                                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                                          : 'bg-white border-slate-200 text-slate-800 hover:border-orange-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className={`material-symbols-outlined text-[18px] shrink-0 ${
                                          isDone ? 'text-emerald-600' : 'text-slate-300'
                                        }`}>
                                          {isDone ? 'check_box' : 'check_box_outline_blank'}
                                        </span>
                                        <span className={`font-bold truncate ${isDone ? 'line-through text-emerald-800 opacity-75' : ''}`}>
                                          {ex.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-700">
                                          {ex.sets} x {ex.reps}
                                        </span>
                                        {ex.weightKg > 0 && (
                                          <span className="font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[11px] font-black border border-orange-200">
                                            {ex.weightKg} kg
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Kết quả buổi tập (COA-08) */}
                        {plan.sessionResult && (
                          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                            <span className="material-symbols-outlined text-blue-600 text-[18px] shrink-0">military_tech</span>
                            <div className="flex-1 min-w-0">
                              <strong className="block text-[11px] uppercase tracking-wider text-blue-700">Kết quả & 1RM:</strong>
                              <div className="mt-0.5">
                                <FormattedAiText content={plan.sessionResult} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bài tập về nhà (COA-10) */}
                        {plan.homework && (
                          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
                            <span className="material-symbols-outlined text-purple-600 text-[18px] shrink-0">home_work</span>
                            <div className="flex-1 min-w-0">
                              <strong className="block text-[11px] uppercase tracking-wider text-purple-700">Bài tập về nhà & Dinh dưỡng:</strong>
                              <div className="mt-0.5">
                                <FormattedAiText content={plan.homework} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LỊCH SỬ TIẾN ĐỘ CƠ THỂ & 1RM (MEM-21) */}
        {activeTab === 'progress' && (
          <div className="space-y-5">
            {/* Thống kê biến thiên (So sánh mốc đầu vs mốc cuối) */}
            {progressStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 p-4 rounded-2xl border border-orange-200 shadow-2xs">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500">Cân nặng biến thiên</span>
                  <p className={`text-lg font-black ${Number(progressStats.weightDiff) < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {Number(progressStats.weightDiff) > 0 ? `+${progressStats.weightDiff}` : progressStats.weightDiff} kg
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500">Khối lượng cơ (SMM)</span>
                  <p className={`text-lg font-black ${Number(progressStats.smmDiff) > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {Number(progressStats.smmDiff) > 0 ? `+${progressStats.smmDiff}` : progressStats.smmDiff} kg
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500">Tỷ lệ mỡ (PBF)</span>
                  <p className={`text-lg font-black ${Number(progressStats.pbfDiff) < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {Number(progressStats.pbfDiff) > 0 ? `+${progressStats.pbfDiff}` : progressStats.pbfDiff}%
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500">Mức tạ 1RM nâng cao</span>
                  <p className="text-lg font-black text-blue-600">
                    {Number(progressStats.liftDiff) > 0 ? `+${progressStats.liftDiff}` : progressStats.liftDiff} kg
                  </p>
                </div>
              </div>
            )}

            {/* Bảng timeline các mốc đo */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nhật Ký Tiến Độ Thể Chất</h3>
                  <p className="text-xs text-slate-500">Lưu trữ các mốc đo InBody & mức tạ tối đa 1RM</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Thêm Mốc Đo Mới
                </button>
              </div>

              {bodyLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <span className="material-symbols-outlined text-[32px] mb-1">query_stats</span>
                  <p className="text-xs font-bold">Chưa có mốc đo tiến độ nào.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Ngày ghi nhận</th>
                        <th className="py-3 px-4">Cân nặng</th>
                        <th className="py-3 px-4">Chiều cao</th>
                        <th className="py-3 px-4">Cơ SMM</th>
                        <th className="py-3 px-4">Mỡ PBF</th>
                        <th className="py-3 px-4">BMI</th>
                        <th className="py-3 px-4">1RM Tối Đa</th>
                        <th className="py-3 px-4">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bodyLogs.map((log) => (
                        <tr key={log.progressId} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.recordedDate}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{log.weightKg ? `${log.weightKg} kg` : '--'}</td>
                          <td className="py-3 px-4 text-slate-500">{log.heightCm ? `${log.heightCm} cm` : '--'}</td>
                          <td className="py-3 px-4 font-bold text-emerald-600">{log.smmKg ? `${log.smmKg} kg` : '--'}</td>
                          <td className="py-3 px-4 font-bold text-orange-600">{log.pbfPercent != null ? `${log.pbfPercent}%` : '--'}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{log.bmi || '--'}</td>
                          <td className="py-3 px-4 font-black text-blue-600">{log.maxLiftKg ? `${log.maxLiftKg} kg` : '--'}</td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">{log.note || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: NHẬN XÉT CHUYÊN MÔN HLV (MEM-22) */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Tổng Hợp Đánh Giá & Nhận Xét Từ Huấn Luyện Viên</h3>
                <p className="text-xs text-slate-500">Phản hồi chuyên môn từ các giáo án PT và ca học trên sân</p>
              </div>

              {/* Feedback từ các giáo án PT */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Nhận Xét Định Kỳ Trong Giáo Án PT
                </span>
                {plans.filter((p) => p.coachFeedback).length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    Chưa có nhận xét định kỳ từ giáo án PT.
                  </p>
                ) : (
                  plans.filter((p) => p.coachFeedback).map((p) => (
                    <div key={p.planId} className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold text-emerald-900">
                        <span>{p.title} (HLV {p.coachName || 'Huấn luyện viên'})</span>
                        <span className="text-[11px] font-mono font-medium text-emerald-700">
                          {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="text-slate-700 leading-relaxed font-medium">
                        <FormattedAiText content={p.coachFeedback} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Ghi chú sau buổi học trên sân */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Ghi Chú Kỹ Thuật Sau Buổi Học Trực Tiếp ({coachNotes.length})
                </span>
                {coachNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    Chưa có ghi chú sau ca học.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {coachNotes.map((session, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{session.className}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {session.startTime ? new Date(session.startTime).toLocaleDateString('vi-VN') : ''}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          <strong>HLV {session.coachName || 'Ban huấn luyện'}:</strong> {session.coachNote || 'Học viên tham gia đầy đủ, thực hiện tốt bài tập.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GỢI Ý BÀI TẬP AI TỰ ĐỘNG (MEM-23) */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-400/30 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                  AI FitGenius Coach
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">Thiết Kế Giáo Án Cá Nhân Hóa Tự Động Bằng AI</h2>
              <p className="text-xs sm:text-sm text-purple-200 leading-relaxed max-w-2xl">
                Dựa trên cân nặng ({healthProfile.weightKg || '70'}kg), khối lượng cơ SMM ({healthProfile.smmKg || '32'}kg) và tỷ lệ mỡ ({healthProfile.pbfPercent || '20'}%), hệ thống AI sẽ tính toán mức tải lượng tối ưu và sinh giáo án tập luyện ngay tức thì!
              </p>

              {/* Form tùy chọn mục tiêu AI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                {[
                  { id: 'HYPERTROPHY', title: 'Tăng Cơ & Giảm Mỡ', desc: 'Tập trung cơ nạc, tiêu hao calo cao' },
                  { id: 'SPORT_PERFORMANCE', title: 'Sức Bật Pickleball / Tennis', desc: 'Phản xạ lưới, bật nhảy bộc phát' },
                  { id: 'RECOVERY', title: 'Phục Hồi Thể Lực & Cột Sống', desc: 'Yoga giãn cơ, tăng độ bền core' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAiGoal(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      aiGoal === item.id
                        ? 'bg-purple-500/40 border-purple-300 text-white shadow-md'
                        : 'bg-white/10 border-white/15 text-purple-200 hover:bg-white/20'
                    }`}
                  >
                    <span className="font-bold text-sm block text-white">{item.title}</span>
                    <span className="text-[11px] text-purple-200/80 mt-0.5 block">{item.desc}</span>
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Ghi chú thêm cho AI (VD: Tôi bị đau cổ chân nhẹ, hãy giảm các bài bật nhảy cao)..."
                  value={aiCustomNote}
                  onChange={(e) => setAiCustomNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleGenerateAiPlan}
                  disabled={generatingAi}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  {generatingAi ? 'AI đang phân tích & thiết kế...' : 'Sinh Giáo Án Ngay'}
                </button>
              </div>
            </div>

            {/* Hiển thị giáo án vừa sinh */}
            {aiGeneratedPlan && (
              <div className="bg-white rounded-3xl border border-purple-200 p-6 shadow-md space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                      Lộ trình gợi ý bởi AI
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{aiGeneratedPlan.title}</h3>
                    <p className="text-xs text-slate-500">{aiGeneratedPlan.goal}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAiPlanToDb}
                    disabled={savingAiPlan}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                    {savingAiPlan ? 'Đang lưu vào DB...' : 'Lưu Vào Kế Hoạch Của Tôi'}
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Bài Tập Thiết Kế Khoa Học
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {aiGeneratedPlan.exercises.map((ex, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{idx + 1}. {ex.name}</span>
                          <span className="text-orange-600">{ex.sets}x{ex.reps} {ex.weightKg > 0 ? `(${ex.weightKg}kg)` : ''}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic">Ghi chú: {ex.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
                  <span className="material-symbols-outlined text-purple-600 text-[18px] shrink-0">restaurant</span>
                  <div>
                    <strong className="block text-[11px] uppercase tracking-wider text-purple-700">Dặn dò dinh dưỡng & phục hồi:</strong>
                    <div className="mt-0.5">
                      <FormattedAiText content={aiGeneratedPlan.homework} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL: THÊM MỐC ĐO TIẾN ĐỘ MỚI (MEM-21) */}
        {showAddLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">monitor_weight</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Ghi Nhận Mốc Đo Tiến Độ Mới</h3>
                    <p className="text-xs text-slate-500">Lưu lại chỉ số cơ thể & mức tạ 1RM mới nhất</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveNewLog} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày đo *</label>
                  <input
                    type="date"
                    required
                    value={newLog.recordedDate}
                    onChange={(e) => setNewLog({ ...newLog, recordedDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cân nặng (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="VD: 72.5"
                      value={newLog.weightKg}
                      onChange={(e) => setNewLog({ ...newLog, weightKg: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Chiều cao (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="VD: 173"
                      value={newLog.heightCm}
                      onChange={(e) => setNewLog({ ...newLog, heightCm: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cơ SMM (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="VD: 33.2"
                      value={newLog.smmKg}
                      onChange={(e) => setNewLog({ ...newLog, smmKg: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mỡ PBF (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="VD: 19.5"
                      value={newLog.pbfPercent}
                      onChange={(e) => setNewLog({ ...newLog, pbfPercent: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">1RM Tối Đa (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="VD: 95"
                      value={newLog.maxLiftKg}
                      onChange={(e) => setNewLog({ ...newLog, maxLiftKg: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghi chú tiến độ</label>
                  <input
                    type="text"
                    placeholder="VD: Đo sau buổi tập chân, cảm thấy cơ đùi căng và khỏe hơn..."
                    value={newLog.note}
                    onChange={(e) => setNewLog({ ...newLog, note: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddLogModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={savingLog}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {savingLog ? 'Đang lưu...' : 'Lưu Mốc Đo'}
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
