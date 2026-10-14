import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { getMemberHealthProfile, updateMemberHealthProfile, getMemberAttendance } from '../../services/memberApi';

export default function MemberWorkoutPlansPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

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

  const [coachNotes, setCoachNotes] = useState([]);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, attendanceRes] = await Promise.all([
        getMemberHealthProfile().catch(() => null),
        getMemberAttendance().catch(() => null),
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
        // Filter sessions with coach feedback or past attended sessions
        const notes = attendanceRes.records
          .filter((r) => r.coachNote || r.status === 'ATTENDED' || r.status === 'PRESENT')
          .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        setCoachNotes(notes);
      }
    } catch (err) {
      console.error('Error loading workout plans:', err);
      setError('Không thể tải hồ sơ thể chất và đánh giá HLV.');
    } finally {
      setLoading(false);
    }
  };

  const calculateBmi = (weight, height) => {
    if (!weight || !height) return '';
    const hMeter = parseFloat(height) / 100;
    if (hMeter <= 0) return '';
    const bmiVal = parseFloat(weight) / (hMeter * hMeter);
    return bmiVal.toFixed(1);
  };

  const handleHealthChange = (field, value) => {
    const updated = { ...healthProfile, [field]: value };
    if (field === 'weightKg' || field === 'heightCm') {
      const w = field === 'weightKg' ? value : healthProfile.weightKg;
      const h = field === 'heightCm' ? value : healthProfile.heightCm;
      const autoBmi = calculateBmi(w, h);
      if (autoBmi) updated.bmi = autoBmi;
    }
    setHealthProfile(updated);
  };

  const handleSaveHealthProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
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
      setSaveSuccess(true);
      setEditMode(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.message || 'Không thể cập nhật chỉ số thể chất.');
    } finally {
      setSaving(false);
    }
  };

  const getBmiBadge = (bmi) => {
    const b = parseFloat(bmi);
    if (!b || isNaN(b)) return { label: 'Chưa tính', color: 'bg-slate-100 text-slate-600' };
    if (b < 18.5) return { label: 'Thiếu cân', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (b <= 24.9) return { label: 'Cân đối (Lý tưởng)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (b <= 29.9) return { label: 'Thừa cân nhẹ', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { label: 'Cần giảm mỡ', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  const bmiStatus = getBmiBadge(healthProfile.bmi);

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">monitor_weight</span>
              InBody & Huấn Luyện Cá Nhân
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Kế Hoạch Tập Luyện & Nhận Xét Huấn Luyện Viên
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Phân tích chỉ số cơ thể, mục tiêu thể chất và lắng nghe phản hồi định kỳ từ huấn luyện viên trực tiếp.
            </p>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              {editMode ? 'close' : 'edit_note'}
            </span>
            {editMode ? 'Đóng chỉnh sửa' : 'Cập nhật chỉ số InBody'}
          </button>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Cập nhật chỉ số sức khỏe và mục tiêu thể chất thành công!
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* Section 1: InBody Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
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

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cân Nặng & Chiều Cao</span>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {healthProfile.weightKg ? `${healthProfile.weightKg} kg` : '--'}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Chiều cao: {healthProfile.heightCm ? `${healthProfile.heightCm} cm` : '--'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khối Lượng Cơ (SMM)</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600">
                {healthProfile.smmKg || '--'}
              </span>
              <span className="text-xs text-slate-400">kg</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Skeletal Muscle Mass</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỉ Lệ Mỡ (PBF)</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-orange-600">
                {healthProfile.pbfPercent != null ? `${healthProfile.pbfPercent}%` : '--'}
              </span>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Percent Body Fat</span>
          </div>
        </div>

        {/* Section 2: Edit InBody Form (Toggled) */}
        {editMode && (
          <form onSubmit={handleSaveHealthProfile} className="p-6 bg-white rounded-2xl border border-orange-200 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cập Nhật Hồ Sơ Thể Chất Cá Nhân</h3>
                <p className="text-xs text-slate-500">Dữ liệu được bảo mật và dùng cho huấn luyện viên điều chỉnh giáo án</p>
              </div>
              <span className="material-symbols-outlined text-orange-500 text-[24px]">fitness_center</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cân nặng (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={healthProfile.weightKg}
                  onChange={(e) => handleHealthChange('weightKg', e.target.value)}
                  placeholder="VD: 65.5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chiều cao (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="100"
                  max="230"
                  value={healthProfile.heightCm}
                  onChange={(e) => handleHealthChange('heightCm', e.target.value)}
                  placeholder="VD: 172"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Khối lượng cơ SMM (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="120"
                  value={healthProfile.smmKg}
                  onChange={(e) => handleHealthChange('smmKg', e.target.value)}
                  placeholder="VD: 32.5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tỉ lệ mỡ PBF (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="3"
                  max="60"
                  value={healthProfile.pbfPercent}
                  onChange={(e) => handleHealthChange('pbfPercent', e.target.value)}
                  placeholder="VD: 18.2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trình độ thể lực</label>
                <select
                  value={healthProfile.fitnessLevel}
                  onChange={(e) => handleHealthChange('fitnessLevel', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:bg-white"
                >
                  <option value="BEGINNER">Mới bắt đầu (Beginner)</option>
                  <option value="INTERMEDIATE">Trung bình (Intermediate)</option>
                  <option value="ADVANCED">Nâng cao (Advanced)</option>
                  <option value="ATHLETE">Vận động viên thi đấu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mục tiêu thể chất</label>
                <input
                  type="text"
                  value={healthProfile.fitnessGoals}
                  onChange={(e) => handleHealthChange('fitnessGoals', e.target.value)}
                  placeholder="VD: Giảm mỡ bụng, tăng sức bền tennis, tăng cơ ngực"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiền sử chấn thương (nếu có)</label>
                <input
                  type="text"
                  value={healthProfile.injuryHistory}
                  onChange={(e) => handleHealthChange('injuryHistory', e.target.value)}
                  placeholder="VD: Thoát vị đĩa đệm L4-L5, bong gân cổ chân cũ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang lưu...
                  </>
                ) : (
                  'Lưu chỉ số'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Section 3: Two-Column Layout (Workout Roadmap & Coach Reviews) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Coach Reviews Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">rate_review</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Nhật Ký & Nhận Xét Từ Huấn Luyện Viên</h3>
                    <p className="text-xs text-slate-500">Phản hồi chuyên môn sau các buổi tập trực tiếp</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {coachNotes.length} buổi tập
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Đang tải nhận xét...</span>
                </div>
              ) : coachNotes.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-[28px]">reviews</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Chưa có nhận xét nào từ Huấn luyện viên</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Sau mỗi buổi học trên sân hoặc tại phòng gym, huấn luyện viên sẽ cập nhật ghi chú chuyên môn cho bạn tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {coachNotes.map((session, idx) => {
                    const sessionDate = session.startTime
                      ? new Date(session.startTime).toLocaleDateString('vi-VN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '';

                    return (
                      <div
                        key={session.bookingId || idx}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{session.className}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                              {session.sportName || 'Thể thao'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">{sessionDate}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-700">
                          <span className="material-symbols-outlined text-[16px] text-orange-500">sports</span>
                          <span className="font-semibold">HLV: {session.coachName || 'Ban Huấn Luyện'}</span>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-slate-200/60 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">
                            thumb_up
                          </span>
                          <div>
                            <span className="font-bold text-slate-800">Đánh giá kỹ thuật: </span>
                            {session.coachNote || 'Học viên tham gia đầy đủ, thực hiện tốt các bài khởi động và bài tập cơ bản.'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 Col): Goals & Weekly Roadmap */}
          <div className="space-y-6">
            {/* Goal card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Mục Tiêu Thể Chất Đã Đặt</h4>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Mục tiêu chính
                </span>
                <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {healthProfile.fitnessGoals || 'Chưa thiết lập mục tiêu thể chất cụ thể.'}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Lưu ý an toàn / Tiền sử
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {healthProfile.injuryHistory || 'Không có ghi nhận chấn thương trước đây.'}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Cấp độ vận động
                </span>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs border border-orange-200">
                  <span className="material-symbols-outlined text-[16px]">speed</span>
                  {healthProfile.fitnessLevel || 'INTERMEDIATE'}
                </div>
              </div>
            </div>

            {/* AI Assistant Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                  AI Coaching Assistant
                </div>
                <h4 className="text-sm font-black text-white">Cần Thực Đơn Hoặc Lộ Trình Chi Tiết?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Trợ lý AI thể thao F Sport có thể phân tích chỉ số InBody của bạn và tự động thiết kế lộ trình tập luyện từng ngày.
                </p>
                <a
                  href="/member/ai-assistant"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  <span>Hỏi Trợ Lý AI Ngay</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
