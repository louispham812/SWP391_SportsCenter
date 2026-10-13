import React, { useEffect, useState } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { getCoachStudents } from '../../services/bookingApi';
import { generateCoachPlan } from '../../services/aiAssistantApi';

export default function CoachStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingFor, setGeneratingFor] = useState(null);
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

  const handleGeneratePlan = async (student) => {
    setGeneratingFor(student.id);
    setPlanErrors((current) => ({ ...current, [student.id]: '' }));
    try {
      const result = await generateCoachPlan(student.id);
      setPlans((current) => ({ ...current, [student.id]: result.answer }));
    } catch (requestError) {
      setPlanErrors((current) => ({
        ...current,
        [student.id]: requestError.message || 'Không thể tạo giáo án cho học viên này.',
      }));
    } finally {
      setGeneratingFor(null);
    }
  };

  return (
    <CoachLayout>
      <div className="space-y-6">
        <header>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-secondary">
            Học viên đã đăng ký các lớp bạn được phân công
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Danh Sách Học Viên Của Tôi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Danh sách chỉ gồm học viên có booking còn hiệu lực tại các lớp được phân công cho bạn.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {loading ? (
          <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Đang tải danh sách học viên từ cơ sở dữ liệu...
          </p>
        ) : students.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Chưa có học viên đăng ký các lớp được phân công cho bạn.
          </p>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => (
              <article key={student.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-bold text-secondary-container">
                    {student.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-slate-900">{student.name}</h2>
                    <p className="text-xs text-slate-500">{student.phone || 'Chưa có số điện thoại'}</p>
                  </div>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Lớp đã đăng ký
                  </p>
                  <ul className="space-y-2">
                    {student.sessions.map((session) => (
                      <li key={`${student.id}-${session.bookingId}`} className="flex justify-between gap-3 text-xs">
                        <span className="font-medium text-slate-800">
                          {session.className} · {new Date(session.startTime).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="shrink-0 text-slate-500">{session.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleGeneratePlan(student)}
                  disabled={generatingFor !== null}
                  className="mt-4 w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generatingFor === student.id ? 'Đang tạo giáo án...' : 'Tạo giáo án bằng AI'}
                </button>
                {planErrors[student.id] && (
                  <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                    {planErrors[student.id]}
                  </p>
                )}
                {plans[student.id] && (
                  <div className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    {plans[student.id]}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          Giáo án dùng mục tiêu/chỉ số sức khỏe và lớp đã đăng ký của học viên gửi tới OpenAI; không gửi tên hoặc số điện thoại.
          Đây là gợi ý tham khảo, HLV cần kiểm tra an toàn trước khi áp dụng.
        </p>
      </div>
    </CoachLayout>
  );
}
