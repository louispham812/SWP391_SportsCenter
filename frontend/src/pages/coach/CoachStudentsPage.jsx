import React, { useEffect, useState } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { getCoachStudents } from '../../services/bookingApi';
import { generateCoachPlan } from '../../services/aiAssistantApi';

export default function CoachStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
            sessions: [],
          };
          existing.sessions.push({
            bookingId: booking.bookingId,
            className: booking.className,
            startTime: booking.startTime,
            status: booking.attendanceStatus || booking.bookingStatus,
          });
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
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            F SPORT COACH · HỌC VIÊN CỦA TÔI
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Danh Sách Học Viên Của Tôi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Học viên có đăng ký đang hiệu lực tại các lớp huấn luyện viên được phân công.
          </p>
        </header>

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
        ) : students.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl text-slate-300">groups</span>
            <span>Chưa có học viên nào đăng ký các lớp được phân công cho bạn.</span>
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => (
              <article key={student.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 font-black text-white text-sm shadow-sm shadow-orange-500/20 shrink-0">
                    {student.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-slate-900">{student.name}</h2>
                    <p className="text-xs text-slate-500">{student.phone || 'Chưa có số điện thoại'}</p>
                  </div>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Lớp đã tham gia
                  </p>
                  <ul className="space-y-2.5">
                    {student.sessions.map((session) => (
                      <li key={`${student.id}-${session.bookingId}`} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                        <div className="flex justify-between gap-3 text-xs">
                          <span className="font-bold text-slate-800">
                            {session.className} · {new Date(session.startTime).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="shrink-0 font-semibold px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
                            {session.status}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleGeneratePlan(student, session)}
                          disabled={generatingBookingId !== null}
                          className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                          {generatingBookingId === session.bookingId ? 'Đang tạo giáo án AI...' : 'Tạo giáo án cá nhân hóa bằng AI'}
                        </button>
                        {planErrors[session.bookingId] && (
                          <p role="alert" className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                            {planErrors[session.bookingId]}
                          </p>
                        )}
                        {plans[session.bookingId] && (
                          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs text-slate-800 space-y-2">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                              Giáo án gợi ý từ AI
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium">
                              {plans[session.bookingId]}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </section>
        )}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">info</span>
          <div>
            <strong>Lưu ý bảo mật & tính an toàn:</strong> Giáo án AI chỉ dựa trên mục tiêu thể chất và thông số bài tập, tuyệt đối không gửi số điện thoại hay thông tin nhạy cảm. Huấn luyện viên kiểm duyệt trước khi hướng dẫn thực tế.
          </div>
        </div>
      </div>
    </CoachLayout>
  );
}
