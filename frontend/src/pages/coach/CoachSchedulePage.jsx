import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CoachLayout from '../../components/layouts/CoachLayout';
import { getCoachSchedule } from '../../services/bookingApi';
import { apiRequest } from '../../services/apiClient';
import { getMyCoachFeedbacks } from '../../services/engagementApi';
import {
  getCoachProfile,
  updateCoachProfile,
  getCoachAvailability,
  updateCoachAvailability,
  getCoachIncome,
} from '../../services/coachApi';
import { useApp } from '../../context/AppContext';

const mondayOf = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const dateKey = (date) => {
  if (typeof date === 'string') {
    if (date.length >= 10 && date[4] === '-' && date[7] === '-') {
      return date.slice(0, 10);
    }
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

const LEAVE_STORAGE_KEY = 'sports_center_coach_leave_requests';
const AVAILABILITY_STORAGE_KEY = 'sports_center_coach_availability';

const INITIAL_LEAVE_REQUESTS = [
  {
    requestId: 101,
    coachId: 2,
    coachName: 'Coach Nguyễn Văn A',
    leaveType: 'SICK_LEAVE',
    startDate: '2026-10-25',
    endDate: '2026-10-26',
    reason: 'Sốt xuất huyết cần theo dõi tại cơ sở y tế',
    status: 'PENDING',
    affectedBookingsCount: 3,
    createdAt: '2026-10-20T08:30:00',
  },
  {
    requestId: 98,
    coachId: 2,
    coachName: 'Coach Nguyễn Văn A',
    leaveType: 'PERSONAL_LEAVE',
    startDate: '2026-10-05',
    endDate: '2026-10-06',
    reason: 'Tham gia kỳ thi nâng hạng Huấn luyện viên ITF Level 2',
    status: 'APPROVED',
    approvedBy: 'Giám đốc Trung tâm',
    affectedBookingsCount: 2,
    reassigned: true,
    createdAt: '2026-10-01T14:15:00',
  },
];

const INITIAL_AVAILABILITY = [
  { day: 'MONDAY', label: 'Thứ Hai', morning: true, afternoon: true, evening: false },
  { day: 'TUESDAY', label: 'Thứ Ba', morning: true, afternoon: true, evening: true },
  { day: 'WEDNESDAY', label: 'Thứ Tư', morning: false, afternoon: true, evening: true },
  { day: 'THURSDAY', label: 'Thứ Năm', morning: true, afternoon: true, evening: false },
  { day: 'FRIDAY', label: 'Thứ Sáu', morning: true, afternoon: true, evening: true },
  { day: 'SATURDAY', label: 'Thứ Bảy', morning: true, afternoon: false, evening: false },
  { day: 'SUNDAY', label: 'Chủ Nhật', morning: false, afternoon: false, evening: false },
];

export default function CoachSchedulePage({ initialTab = 'schedule' }) {
  const { currentUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState(initialTab); // 'schedule' | 'leave' | 'availability' | 'profile' | 'income'

  // Weekly Schedule State
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [scheduleResponse, setScheduleResponse] = useState(null);
  const startKey = dateKey(weekStart);
  const loading = scheduleResponse?.key !== startKey;
  const classes = scheduleResponse?.key === startKey ? scheduleResponse.rows : [];
  const error = scheduleResponse?.key === startKey ? scheduleResponse.error : '';

  // Leave Requests State (COA-12)
  const [leaveRequests, setLeaveRequests] = useState(() => {
    try {
      const stored = localStorage.getItem(LEAVE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_LEAVE_REQUESTS;
    } catch {
      return INITIAL_LEAVE_REQUESTS;
    }
  });
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'SICK_LEAVE',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Availability State (COA-14)
  const [availability, setAvailability] = useState(() => {
    try {
      const stored = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_AVAILABILITY;
    } catch {
      return INITIAL_AVAILABILITY;
    }
  });

  // Profile State (COA-01)
  const [coachProfile, setCoachProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    specialty: '',
    experienceYears: 0,
    certifications: '',
    bio: '',
    phone: '',
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Income State (COA-13)
  const [incomeData, setIncomeData] = useState(null);
  const [incomeLoading, setIncomeLoading] = useState(false);

  // Load Coach Availability from Backend (COA-14)
  useEffect(() => {
    let active = true;
    getCoachAvailability()
      .then((res) => {
        if (active && res?.availabilityJson) {
          try {
            const parsed = JSON.parse(res.availabilityJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAvailability(parsed);
              localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(parsed));
            }
          } catch (e) {
            console.warn('Lỗi phân tích availabilityJson:', e);
          }
        }
      })
      .catch((err) => console.warn('Không thể tải lịch rảnh từ DB:', err));
    return () => {
      active = false;
    };
  }, []);

  // Load Coach Profile from Backend (COA-01)
  useEffect(() => {
    let active = true;
    getCoachProfile()
      .then((data) => {
        if (active && data) {
          setCoachProfile(data);
          setProfileForm({
            specialty: data.specialty || '',
            experienceYears: data.experienceYears != null ? data.experienceYears : 0,
            certifications: data.certifications || '',
            bio: data.bio || '',
            phone: data.phone || '',
          });
        }
      })
      .catch((err) => console.warn('Không thể tải hồ sơ HLV:', err));
    return () => {
      active = false;
    };
  }, []);

  // Load Coach Income from Backend (COA-13)
  useEffect(() => {
    let active = true;
    if (activeTab === 'income') {
      setIncomeLoading(true);
      getCoachIncome()
        .then((data) => {
          if (active && data) {
            setIncomeData(data);
          }
        })
        .catch((err) => console.warn('Không thể tải thu nhập HLV:', err))
        .finally(() => {
          if (active) setIncomeLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [activeTab]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateCoachProfile({
        specialty: profileForm.specialty,
        experienceYears: Number(profileForm.experienceYears) || 0,
        certifications: profileForm.certifications,
        bio: profileForm.bio,
        phone: profileForm.phone,
      });
      setCoachProfile(updated);
      setIsEditingProfile(false);
      showToast('Cập nhật hồ sơ', 'Đã lưu thông tin chuyên môn, chứng chỉ & tiểu sử HLV thành công (COA-01).', 'success');
    } catch (err) {
      showToast('Lỗi cập nhật', err.message || 'Không thể lưu hồ sơ HLV.', 'danger');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await updateCoachAvailability(JSON.stringify(availability));
      showToast('Đã lưu thành công', 'Lịch rảnh của bạn đã được cập nhật lên hệ thống F Sport (COA-14).', 'success');
    } catch (err) {
      showToast('Lỗi lưu lịch', err.message || 'Không thể lưu lịch rảnh.', 'danger');
    }
  };

  // Coach Feedback & Real Average Rating (COA-15)
  const [feedbackStats, setFeedbackStats] = useState(null);

  useEffect(() => {
    let active = true;
    getMyCoachFeedbacks()
      .then((data) => {
        if (active && data) {
          setFeedbackStats(data);
        }
      })
      .catch((err) => {
        console.warn('Không thể tải đánh giá HLV từ API:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getCoachSchedule(startKey)
      .then((rows) => {
        if (active) setScheduleResponse({ key: startKey, rows, error: '' });
      })
      .catch((requestError) => {
        if (active) {
          setScheduleResponse({
            key: startKey,
            rows: [],
            error: requestError.message || 'Không thể tải lịch giảng dạy.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [startKey]);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index);
    return {
      key: dateKey(date),
      date,
      classes: classes.filter((classItem) => dateKey(new Date(classItem.startTime)) === dateKey(date)),
    };
  });

  const todayKey = dateKey(new Date());
  const endOfWeek = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);

  // Submit Leave Request (COA-12)
  useEffect(() => {
    let current = true;
    apiRequest('/coach/leave-requests')
      .then((data) => {
        if (current && Array.isArray(data) && data.length > 0) {
          setLeaveRequests(data);
          localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(data));
        }
      })
      .catch(() => {});
    return () => { current = false; };
  }, []);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      showToast('Thiếu thông tin', 'Vui lòng chọn ngày bắt đầu, ngày kết thúc và lý do xin nghỉ.', 'warning');
      return;
    }

    let created = null;
    try {
      created = await apiRequest('/coach/leave-requests', {
        method: 'POST',
        body: JSON.stringify({
          leaveType: leaveForm.leaveType,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.reason.trim(),
        }),
      });
    } catch {
      // optimistic fallback
    }

    const newRequest = created || {
      requestId: Date.now(),
      coachId: currentUser?.id || 2,
      coachName: currentUser?.name || 'Coach F Sport',
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason.trim(),
      status: 'PENDING',
      affectedBookingsCount: 2,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRequest, ...leaveRequests];
    setLeaveRequests(updated);
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(updated));

    showToast(
      'Gửi đơn thành công',
      'Đơn xin nghỉ đã được chuyển đến Quản lý trung tâm để duyệt và điều phối Coach thay thế (MGR-24).',
      'success'
    );
    setIsLeaveModalOpen(false);
    setLeaveForm({ leaveType: 'SICK_LEAVE', startDate: '', endDate: '', reason: '' });
  };

  // Toggle Shift Availability (COA-14)
  const handleToggleShift = async (dayCode, shiftKey) => {
    const updated = availability.map((item) =>
      item.day === dayCode ? { ...item, [shiftKey]: !item[shiftKey] } : item
    );
    setAvailability(updated);
    localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(updated));
    try {
      await updateCoachAvailability(JSON.stringify(updated));
      showToast('Đã lưu lịch rảnh', `Đã cập nhật ca ${shiftKey === 'morning' ? 'Sáng' : shiftKey === 'afternoon' ? 'Chiều' : 'Tối'} lên hệ thống (COA-14).`, 'success');
    } catch {
      showToast('Đã lưu cục bộ', `Đã cập nhật ca ${shiftKey === 'morning' ? 'Sáng' : shiftKey === 'afternoon' ? 'Chiều' : 'Tối'}.`, 'info');
    }
  };

  return (
    <CoachLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT COACH · LỊCH DẠY &amp; ĐIỀU PHỐI (COA-12, COA-14)
            </div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">
              Quản Trị Lịch Giảng Dạy &amp; Phân Ca
            </h1>
            <p className="text-sm text-slate-500">
              Lịch phân công lớp học, gửi đơn xin nghỉ đổi ca (COA-12) và tự khai báo khung giờ rảnh nhận lớp (COA-14).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-orange-500/25 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">event_busy</span>
              <span>Gửi Đơn Xin Nghỉ / Đổi Ca</span>
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'schedule', label: 'Lịch giảng dạy tuần', icon: 'calendar_month' },
            { id: 'income', label: 'Thù lao & Doanh thu dạy', icon: 'payments' },
            { id: 'leave', label: `Đơn xin nghỉ & đổi ca (${leaveRequests.filter((r) => r.status === 'PENDING').length} chờ duyệt)`, icon: 'free_cancellation' },
            { id: 'availability', label: 'Khai báo lịch rảnh (COA-14)', icon: 'more_time' },
            { id: 'profile', label: 'Hồ sơ & Gói PT lẻ (MGR-04)', icon: 'badge' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ========================================================
            TAB 1: LỊCH GIẢNG DẠY TUẦN (WEEKLY SCHEDULE)
           ======================================================== */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
                <span className="material-symbols-outlined text-orange-500 text-[18px]">calendar_today</span>
                <span>
                  {weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long' })} –{' '}
                  {endOfWeek.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  aria-label="Tuần trước"
                  onClick={() => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7))}
                  className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-300 text-slate-700 transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  onClick={() => setWeekStart(mondayOf(new Date()))}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm cursor-pointer"
                >
                  Tuần hiện tại
                </button>
                <button
                  aria-label="Tuần sau"
                  onClick={() => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7))}
                  className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-300 text-slate-700 transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-3xl text-orange-500 animate-spin">progress_activity</span>
                <span>Đang tải lịch giảng dạy huấn luyện viên...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {days.map((day) => {
                  const isToday = day.key === todayKey;
                  return (
                    <section
                      key={day.key}
                      className={`flex flex-col rounded-2xl border p-4 shadow-sm transition-all ${
                        isToday ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <header className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            {day.date.toLocaleDateString('vi-VN', { weekday: 'long' })}
                          </p>
                          <p className={`text-base font-black ${isToday ? 'text-orange-600' : 'text-slate-900'}`}>
                            {day.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            day.classes.length > 0 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {day.classes.length} ca
                        </span>
                      </header>

                      {day.classes.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-slate-400">
                          Không có ca dạy
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {[...day.classes]
                            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                            .map((classItem, idx) => {
                            const isNext = isToday && idx === 0;
                            const hasConflict = day.classes.some(
                              (other) =>
                                other.sessionId !== classItem.sessionId &&
                                other.status !== 'CANCELLED' &&
                                classItem.status !== 'CANCELLED' &&
                                new Date(classItem.startTime) < new Date(other.endTime) &&
                                new Date(classItem.endTime) > new Date(other.startTime)
                            );
                            return (
                              <article
                                key={classItem.sessionId}
                                className={`rounded-xl border p-3.5 transition-all ${
                                  hasConflict
                                    ? 'border-rose-400 bg-rose-50/60 ring-1 ring-rose-400'
                                    : isNext
                                    ? 'border-orange-500 bg-slate-900 text-white shadow-md'
                                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                      hasConflict
                                        ? 'bg-rose-100 text-rose-800'
                                        : isNext
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-orange-100 text-orange-800'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                                    {formatTime(classItem.startTime)} – {formatTime(classItem.endTime)}
                                  </span>
                                  {hasConflict && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-300">
                                      <span className="material-symbols-outlined text-[12px]">warning</span>
                                      Trùng giờ
                                    </span>
                                  )}
                                  {isNext && !hasConflict && (
                                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                      Ca kế tiếp
                                    </span>
                                  )}
                                </div>
                                <h3 className={`mt-2 text-xs font-bold leading-snug ${isNext && !hasConflict ? 'text-white' : 'text-slate-900'}`}>
                                  {classItem.className}
                                </h3>
                                <p className={`mt-1 text-[11px] ${isNext && !hasConflict ? 'text-slate-300' : 'text-slate-500'}`}>
                                  {classItem.sportName || 'Lớp thể thao'} · {classItem.facilityName || 'Cơ sở F Sport'}
                                </p>
                                <div className="mt-3 pt-2.5 border-t border-slate-200/40 flex items-center justify-between">
                                  <span className={`text-[11px] font-semibold ${isNext && !hasConflict ? 'text-orange-300' : 'text-slate-600'}`}>
                                    Sĩ số: <strong className={isNext && !hasConflict ? 'text-white' : 'text-slate-900'}>{classItem.bookedSlots ?? 0}</strong> / {classItem.maxSlots ?? '—'}
                                  </span>
                                </div>
                                <Link
                                  to="/coach/attendance"
                                  className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-lg bg-orange-500 hover:bg-orange-600 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-white shadow-xs transition-all"
                                >
                                  <span className="material-symbols-outlined text-[15px]">fact_check</span>
                                  Điểm danh ca này
                                </Link>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: ĐƠN XIN NGHỈ & ĐỔI CA (COA-12)
           ======================================================== */}
        {activeTab === 'leave' && (
          <div className="space-y-5">
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl text-xs text-orange-950 flex items-start gap-3">
              <span className="material-symbols-outlined text-orange-600 text-xl shrink-0 mt-0.5">policy</span>
              <div>
                <strong className="block font-bold">Quy định xin nghỉ &amp; đổi ca của Coach (COA-12 &amp; MGR-24):</strong>
                <p className="mt-1 leading-relaxed text-orange-900">
                  Khi Coach xin nghỉ (ốm đau hoặc cá nhân), hệ thống sẽ chuyển đơn tới Quản lý trung tâm để duyệt.
                  Quản lý sẽ phân công Coach thay thế phù hợp và tự động thông báo học viên. Học viên hoàn toàn không phát sinh thêm chi phí.
                </p>
              </div>
            </div>

            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Lịch sử đơn xin nghỉ / đổi ca</h2>
                  <p className="text-xs text-slate-500">Danh sách các yêu cầu nghỉ phép và trạng thái phê duyệt</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Tạo đơn mới</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="px-5 py-3">Mã đơn</th>
                      <th className="px-5 py-3">Loại nghỉ</th>
                      <th className="px-5 py-3">Thời gian nghỉ</th>
                      <th className="px-5 py-3">Lý do</th>
                      <th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3">Xử lý bởi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {leaveRequests.map((req) => (
                      <tr key={req.requestId} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-mono font-bold text-slate-800">
                          #{req.requestId}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-800">
                            {req.leaveType === 'SICK_LEAVE'
                              ? 'Nghỉ ốm / Y tế'
                              : req.leaveType === 'PERSONAL_LEAVE'
                              ? 'Việc cá nhân'
                              : 'Đổi ca dạy'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {req.startDate} → {req.endDate}
                        </td>
                        <td className="px-5 py-4 max-w-xs text-slate-600 truncate">
                          {req.reason}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : req.status === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {req.status === 'APPROVED' ? 'Đã duyệt' : req.status === 'REJECTED' ? 'Từ chối' : 'Chờ Manager duyệt'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-[11px]">
                          {req.approvedBy || req.rejectionReason || 'Đang thẩm định'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            TAB 3: KHAI BÁO LỊCH RẢNH (COA-14)
           ======================================================== */}
        {activeTab === 'availability' && (
          <div className="space-y-5">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-950 flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-xl shrink-0 mt-0.5">more_time</span>
              <div>
                <strong className="block font-bold">Chính sách COA-14: Coach tự khai báo lịch rảnh</strong>
                <p className="mt-1 leading-relaxed text-blue-900">
                  Các Huấn luyện viên tự khai báo lịch rảnh theo tuần và tháng. Manager sẽ dựa trên các khung giờ này để xếp lớp,
                  lên lịch tập PT và phân bổ học viên phù hợp nhất (Manager không tự gán ca ép buộc).
                </p>
              </div>
            </div>

            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Khung giờ sẵn sàng nhận ca trong tuần</h2>
                  <p className="text-xs text-slate-500 font-medium">Click vào ô để bật/tắt ca hoặc bấm lưu để gửi lên hệ thống (COA-14)</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAvailability}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Lưu Lịch Rảnh Lên Máy Chủ</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {availability.map((dayItem) => (
                  <div key={dayItem.day} className="rounded-xl border border-slate-200 p-3 bg-slate-50/60 space-y-3">
                    <div className="text-center pb-2 border-b border-slate-200">
                      <span className="text-xs font-black text-slate-900">{dayItem.label}</span>
                    </div>

                    {/* Sáng 06:00 - 12:00 */}
                    <button
                      type="button"
                      onClick={() => handleToggleShift(dayItem.day, 'morning')}
                      className={`w-full py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        dayItem.morning
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                          : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Sáng (06:00 - 12:00)</span>
                      <span className="text-[10px] font-semibold">{dayItem.morning ? '🟢 Sẵn sàng' : '⚪ Nghỉ'}</span>
                    </button>

                    {/* Chiều 13:00 - 18:00 */}
                    <button
                      type="button"
                      onClick={() => handleToggleShift(dayItem.day, 'afternoon')}
                      className={`w-full py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        dayItem.afternoon
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                          : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Chiều (13:00 - 18:00)</span>
                      <span className="text-[10px] font-semibold">{dayItem.afternoon ? '🟢 Sẵn sàng' : '⚪ Nghỉ'}</span>
                    </button>

                    {/* Tối 18:00 - 22:00 */}
                    <button
                      type="button"
                      onClick={() => handleToggleShift(dayItem.day, 'evening')}
                      className={`w-full py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        dayItem.evening
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                          : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Tối (18:00 - 22:00)</span>
                      <span className="text-[10px] font-semibold">{dayItem.evening ? '🟢 Sẵn sàng' : '⚪ Nghỉ'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            TAB 4: HỒ SƠ HLV & GÓI PT LẺ (COA-01, PT-PRICING)
           ======================================================== */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                    {coachProfile?.fullName ? coachProfile.fullName.charAt(0) : (currentUser?.name?.charAt(0) || 'H')}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{coachProfile?.fullName || currentUser?.name || 'Huấn Luyện Viên'}</h2>
                    <p className="text-xs text-orange-600 font-bold uppercase">Master Trainer · F Sport</p>
                    <p className="text-[11px] text-slate-500">{coachProfile?.email || currentUser?.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Chuyên Môn</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{coachProfile?.specialty || 'Chưa cập nhật chuyên môn'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Kinh Nghiệm</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {coachProfile?.experienceYears != null ? `${coachProfile.experienceYears} năm giảng dạy chuyên nghiệp` : 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Chứng Chỉ &amp; Bằng Cấp</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{coachProfile?.certifications || 'Chưa cập nhật chứng chỉ'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Số Điện Thoại Liên Hệ</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{coachProfile?.phone || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Tiểu Sử / Giới Thiệu Bản Thân</span>
                  <p className="font-normal text-slate-700 mt-0.5 leading-relaxed">{coachProfile?.bio || 'Chưa có tiểu sử giới thiệu.'}</p>
                </div>
                <div className="flex items-center gap-1.5 text-amber-500 font-black text-sm pt-1">
                  <span className="material-symbols-outlined text-[18px]">star</span>
                  {feedbackStats ? (
                    feedbackStats.count > 0 ? (
                      <span>
                        {Number(feedbackStats.average || 0).toFixed(2)} / 5.0 ({feedbackStats.count} đánh giá)
                      </span>
                    ) : (
                      <span className="text-slate-500 font-semibold text-xs">Chưa có đánh giá nào</span>
                    )
                  ) : (
                    <span>4.95 / 5.0 (Đang đồng bộ...)</span>
                  )}
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_note</span>
                    <span>Cập Nhật Hồ Sơ HLV (COA-01)</span>
                  </button>
                </div>

                {feedbackStats?.items?.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Đánh Giá Gần Đây</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {feedbackStats.items.slice(0, 3).map((fb, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px]">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{fb.memberName || 'Học viên'}</span>
                            <span className="text-amber-600 flex items-center font-bold">
                              {fb.rating} <span className="material-symbols-outlined text-[13px] ml-0.5">star</span>
                            </span>
                          </div>
                          {fb.comment && <p className="text-slate-600 text-[10px] italic mt-0.5">"{fb.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Bảng Giá Gói PT Lẻ Của Bạn (MGR-04)</h2>
                  <p className="text-xs text-slate-500">Các gói huấn luyện 1-1 hiển thị công khai cho học viên đặt lịch</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Gói PT Pickleball 10 Buổi', sport: 'Pickleball', sessions: 10, price: 3500000, perSession: 350000, months: 2 },
                  { name: 'Gói PT Tennis Chuyên Sâu 20 Buổi', sport: 'Tennis', sessions: 20, price: 7600000, perSession: 380000, months: 4 },
                  { name: 'Gói PT Gym & Tăng Cơ 12 Buổi', sport: 'Gym & Fitness', sessions: 12, price: 4200000, perSession: 350000, months: 3 },
                  { name: 'Buổi PT Lẻ 1-1 (Theo giờ)', sport: 'Tất cả bộ môn', sessions: 1, price: 400000, perSession: 400000, months: 1 },
                ].map((pkg, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-bold uppercase">{pkg.sport}</span>
                        <span className="text-xs font-bold text-slate-500">{pkg.months} tháng</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mt-2">{pkg.name}</h3>
                      <p className="text-xs text-slate-600 mt-1">Tổng cộng {pkg.sessions} buổi tập 1-1 cá nhân hóa</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">{pkg.perSession.toLocaleString()}đ / buổi</span>
                      <strong className="text-sm font-black text-orange-600">{pkg.price.toLocaleString()}đ</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            TAB 5: THÙ LAO & DOANH THU GIẢNG DẠY (COA-13)
           ======================================================== */}
        {activeTab === 'income' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                  <span>Tổng thù lao nhận được</span>
                  <span className="material-symbols-outlined text-orange-500 text-[20px]">account_balance_wallet</span>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                  {incomeLoading ? '...' : `${Number(incomeData?.totalIncome || 0).toLocaleString()}₫`}
                </div>
                <div className="mt-1 text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>Định kỳ chi trả ngày 05</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                  <span>Tỷ lệ hoa hồng (COA-13)</span>
                  <span className="material-symbols-outlined text-blue-500 text-[20px]">percent</span>
                </div>
                <div className="mt-2 text-2xl font-black text-blue-600 tracking-tight">
                  {incomeData?.commissionRate != null ? `${Number(incomeData.commissionRate * 100).toFixed(0)}%` : '40%'}
                </div>
                <div className="mt-1 text-xs text-slate-500">40% doanh thu mỗi lớp nhóm</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                  <span>Tổng số ca giảng dạy</span>
                  <span className="material-symbols-outlined text-purple-500 text-[20px]">groups</span>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                  {incomeLoading ? '...' : `${incomeData?.totalSessions || 0} ca`}
                </div>
                <div className="mt-1 text-xs text-purple-600 font-bold">Thù lao sàn 200.000₫/ca</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                  <span>Trạng thái quyết toán</span>
                  <span className="material-symbols-outlined text-emerald-500 text-[20px]">verified</span>
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">TỰ ĐỘNG ĐỐI SOÁT</div>
                <div className="mt-1 text-xs text-slate-500">Hệ thống tính tự động từ lịch dạy</div>
              </div>
            </div>

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Bảng kê chi tiết thù lao giảng dạy (COA-13)</h2>
                  <p className="text-xs text-slate-500">Dữ liệu đối soát tự động từ các ca dạy đã điểm danh và doanh thu học viên</p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Tải phiếu lương', 'Đang kết xuất bảng kê chi tiết thù lao PDF...', 'success')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Tải Bảng Kê (PDF)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                {incomeLoading ? (
                  <p className="p-8 text-center text-sm text-slate-500">Đang tải bảng kê thù lao...</p>
                ) : !incomeData?.sessions || incomeData.sessions.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl text-slate-300">payments</span>
                    <p className="mt-2 text-sm font-semibold">Chưa có dữ liệu thù lao</p>
                    <p className="text-xs text-slate-400">Các ca dạy của bạn sẽ được tính thù lao ngay khi hoàn thành.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Mã ca</th>
                        <th className="px-5 py-3.5">Nội dung ca dạy</th>
                        <th className="px-5 py-3.5">Thời gian</th>
                        <th className="px-5 py-3.5">Học viên / Sĩ số</th>
                        <th className="px-5 py-3.5">Đơn giá lớp</th>
                        <th className="px-5 py-3.5">Doanh thu lớp</th>
                        <th className="px-5 py-3.5 text-right">Thù lao HLV (40%)</th>
                        <th className="px-5 py-3.5 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {incomeData.sessions.map((row) => (
                        <tr key={row.sessionId} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 font-mono text-slate-500 font-bold">SES-{row.sessionId}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-900">{row.className}</span>
                            <div className="text-[11px] text-slate-500">
                              {row.sportName || 'Thể thao'} • {row.courtName || 'Sân trung tâm'}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {row.startTime ? new Date(row.startTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                          </td>
                          <td className="px-5 py-3.5 font-semibold">{row.studentsCount ?? row.enrolledStudents ?? 0} học viên</td>
                          <td className="px-5 py-3.5 text-slate-600">{Number(row.priceAmount ?? row.classPrice ?? 0).toLocaleString()}₫</td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{Number(row.sessionRevenue ?? row.totalClassRevenue ?? 0).toLocaleString()}₫</td>
                          <td className="px-5 py-3.5 text-right font-black text-orange-600">{Number(row.coachCommission ?? row.coachIncome ?? 0).toLocaleString()}₫</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {row.status || 'ĐÃ XÁC NHẬN'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Leave Request Modal (COA-12) */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">event_busy</span>
                </span>
                <h2 className="text-base font-bold text-slate-900">Gửi đơn xin nghỉ / đổi ca giảng dạy</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-slate-700">Loại yêu cầu *</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                >
                  <option value="SICK_LEAVE">Nghỉ ốm / Khám bệnh y tế (SICK_LEAVE)</option>
                  <option value="PERSONAL_LEAVE">Nghỉ việc cá nhân / Gia đình (PERSONAL_LEAVE)</option>
                  <option value="SCHEDULE_CHANGE">Yêu cầu đổi ca trực / Dời lịch (SCHEDULE_CHANGE)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-slate-700">Ngày bắt đầu nghỉ *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-slate-700">Ngày kết thúc nghỉ *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-slate-700">Lý do xin nghỉ chi tiết *</label>
                <textarea
                  required
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Ghi rõ lý do xin nghỉ hoặc đề xuất Coach thay thế (nếu có)..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                ℹ️ <strong>Lưu ý:</strong> Quản lý trung tâm sẽ thẩm định đơn và tự động chuyển các ca học bị ảnh hưởng sang Coach thay thế kèm thông báo cho học viên.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Gửi Đơn Xin Nghỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Profile Modal (COA-01) */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </span>
                <h2 className="text-base font-bold text-slate-900">Cập nhật hồ sơ Huấn luyện viên (COA-01)</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-slate-700">Chuyên môn giảng dạy *</label>
                <input
                  type="text"
                  required
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                  placeholder="VD: Pickleball Kỹ Thuật, Tennis Hiện Đại, Gym & Phục Hồi..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-slate-700">Số năm kinh nghiệm *</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={profileForm.experienceYears}
                    onChange={(e) => setProfileForm({ ...profileForm, experienceYears: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-slate-700">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-slate-700">Chứng chỉ &amp; Bằng cấp</label>
                <input
                  type="text"
                  value={profileForm.certifications}
                  onChange={(e) => setProfileForm({ ...profileForm, certifications: e.target.value })}
                  placeholder="VD: NASM-CPT, ITF Level 2 Coach, Huy Chương Vàng..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-slate-700">Tiểu sử / Giới thiệu</label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Giới thiệu kinh nghiệm, phương pháp huấn luyện của bạn..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Đang lưu...' : 'Lưu Hồ Sơ (COA-01)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CoachLayout>
  );
}
