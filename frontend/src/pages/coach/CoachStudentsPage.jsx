import React, { useEffect, useState, useMemo } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { getCoachStudents } from '../../services/bookingApi';
import { generateCoachPlan } from '../../services/aiAssistantApi';

export default function CoachStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [generatingBookingId, setGeneratingBookingId] = useState(null);
  const [plans, setPlans] = useState({});
  const [planErrors, setPlanErrors] = useState({});

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
      </div>
    </CoachLayout>
  );
}
