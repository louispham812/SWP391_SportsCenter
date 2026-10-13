import React, { useEffect, useState } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { getCoachStudents } from '../../services/bookingApi';

export default function CoachStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                    Lớp đã đăng ký trong tuần
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
              </article>
            ))}
          </section>
        )}
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          Tạo giáo án AI chưa được bật vì ứng dụng hiện chưa cấu hình dịch vụ AI. Không có bài tập giả lập nào được hiển thị.
        </p>
      </div>
    </CoachLayout>
  );
}
