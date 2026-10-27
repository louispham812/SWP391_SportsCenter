import React, { useEffect, useState, useMemo } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { apiRequest } from '../../services/apiClient';
import { sendMemberAssistantMessages } from '../../services/aiAssistantApi';
import FormattedAiText from '../../components/common/FormattedAiText';
import Pagination from '../../components/common/Pagination';

const formatDateTime = (value) => new Date(value).toLocaleString('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function MemberAIAssistantPage() {
  const [health, setHealth] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    Promise.all([
      apiRequest('/members/me/health'),
      apiRequest('/booking-flow/schedule'),
    ])
      .then(([healthData, scheduleData]) => {
        if (!current) return;
        setHealth(healthData);
        setSchedule(scheduleData);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải dữ liệu hồ sơ và lịch tập.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const SCHEDULE_PER_PAGE = 3;
  const [schedulePage, setSchedulePage] = useState(1);

  const totalSchedulePages = Math.ceil(schedule.length / SCHEDULE_PER_PAGE) || 1;
  const currentSchedule = useMemo(() => {
    const start = (schedulePage - 1) * SCHEDULE_PER_PAGE;
    return schedule.slice(start, start + SCHEDULE_PER_PAGE);
  }, [schedule, schedulePage]);

  const computedBmi = useMemo(() => {
    if (health?.bmi && Number(health.bmi) > 0) return Number(health.bmi).toFixed(1);
    const w = Number(health?.weightKg);
    const h = Number(health?.heightCm);
    if (w > 0 && h > 0) return (w / Math.pow(h / 100, 2)).toFixed(1);
    return null;
  }, [health]);

  const measurements = [
    { label: 'Cân nặng', value: health?.weightKg, unit: 'kg' },
    { label: 'Cơ nạc (SMM)', value: health?.smmKg, unit: 'kg' },
    { label: 'Tỷ lệ mỡ (PBF)', value: health?.pbfPercent, unit: '%' },
    { label: 'BMI', value: computedBmi ?? health?.bmi, unit: '' },
  ];

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const content = messageDraft.trim();
    if (!content || sending) return;

    const nextMessages = [...messages, { role: 'user', content }].slice(-19);
    setMessages(nextMessages);
    setMessageDraft('');
    setAssistantError('');
    setSending(true);
    try {
      const response = await sendMemberAssistantMessages(nextMessages);
      setMessages([...nextMessages, { role: 'assistant', content: response.answer }]);
    } catch (requestError) {
      setAssistantError(requestError.message || 'Không thể nhận phản hồi từ trợ lý AI.');
    } finally {
      setSending(false);
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        <header>
          <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-orange-600">
            Hồ sơ và lịch tập đã đồng bộ
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">Tiến Độ Rèn Luyện &amp; AI Coach</h1>
          <p className="mt-1 text-sm text-slate-500">
            Chỉ số thể trạng InBody và thời khóa biểu của bạn được đồng bộ trực tiếp từ hệ thống.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {loading ? (
          <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Đang tải hồ sơ...
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            <section className="space-y-5 lg:col-span-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {measurements.map(({ label, value, unit }) => (
                  <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-orange-300 transition-all">
                    <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                      {value ?? 'Chưa có'}{value != null && unit ? ` ${unit}` : ''}
                    </p>
                  </article>
                ))}
              </div>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-bold uppercase text-slate-900">Thông tin mục tiêu</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Mục tiêu tập luyện</dt>
                    <dd className="mt-1 whitespace-pre-line text-slate-800">{health?.fitnessGoals || 'Chưa được cập nhật.'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Lịch sử chấn thương</dt>
                    <dd className="mt-1 whitespace-pre-line text-slate-800">{health?.injuryHistory || 'Chưa được cập nhật.'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Cấp độ</dt>
                    <dd className="mt-1 text-slate-800">{health?.fitnessLevel || 'Chưa được cập nhật.'}</dd>
                  </div>
                </dl>
              </article>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold uppercase text-slate-900 text-sm">Lịch tập đã đăng ký</h2>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
                      {schedule.length}
                    </span>
                  </div>
                  {totalSchedulePages > 1 && (
                    <span className="text-[11px] font-medium text-slate-400">
                      Trang {schedulePage} / {totalSchedulePages}
                    </span>
                  )}
                </div>

                {schedule.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">event_busy</span>
                    <p>Bạn chưa có lịch tập nào được lưu.</p>
                  </div>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {currentSchedule.map((entry) => (
                      <li
                        key={`${entry.bookingType}-${entry.bookingId}`}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 hover:bg-slate-100/70 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-900 text-xs truncate">{entry.title}</p>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 uppercase tracking-wider ${
                              entry.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 truncate">{entry.sportName} · {entry.location}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500 font-medium">{formatDateTime(entry.startTime)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {totalSchedulePages > 1 && (
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <Pagination
                    currentPage={schedulePage}
                    totalPages={totalSchedulePages}
                    onPageChange={setSchedulePage}
                  />
                </div>
              )}
            </section>
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-4">
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900">Trợ lý AI luyện tập (F Sport Coach)</h2>
            <p className="mt-1 text-sm text-slate-500">
              Trợ lý tham khảo hồ sơ sức khỏe và lịch tập đã lưu để gợi ý bài tập và giải đáp phù hợp.
            </p>
          </div>
          <div
            aria-live="polite"
            className="max-h-96 min-h-36 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4 border border-slate-200/80"
          >
            {messages.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Hãy hỏi về mục tiêu rèn luyện thể lực, tư vấn bài tập bổ trợ cho Pickleball / Tennis hoặc cách phục hồi cơ bắp an toàn.
              </p>
            ) : messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto bg-orange-500 text-white font-medium shadow-sm whitespace-pre-wrap'
                    : 'bg-white text-slate-800 shadow-2xs border border-slate-200'
                }`}
              >
                {message.role === 'user' ? (
                  message.content
                ) : (
                  <FormattedAiText content={message.content} />
                )}
              </div>
            ))}
            {sending && <p role="status" className="text-xs text-orange-600 font-bold animate-pulse">Trợ lý F Sport đang suy nghĩ và trả lời...</p>}
          </div>
          {assistantError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
              {assistantError}
            </p>
          )}
          <form onSubmit={handleSendMessage} className="flex flex-col gap-2 sm:flex-row pt-2">
            <label className="sr-only" htmlFor="member-ai-message">Tin nhắn cho trợ lý AI</label>
            <input
              id="member-ai-message"
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              maxLength={4000}
              placeholder="Nhập câu hỏi của bạn cho AI Coach..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-xs font-medium outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !messageDraft.trim()}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer"
            >
              {sending ? 'Đang gửi...' : 'Gửi câu hỏi'}
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-500">
            Khi gửi câu hỏi, hệ thống chuyển mục tiêu, chỉ số sức khỏe và lịch lớp liên quan (nếu có) tới OpenAI để tạo trả lời.
            Không gửi tên hoặc số điện thoại. Gợi ý không thay thế tư vấn y tế.
          </p>
        </section>
      </div>
    </MemberLayout>
  );
}
