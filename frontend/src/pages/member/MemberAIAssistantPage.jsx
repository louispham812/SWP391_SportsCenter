import React, { useEffect, useState } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { apiRequest } from '../../services/apiClient';
import { sendMemberAssistantMessages } from '../../services/aiAssistantApi';
import FormattedAiText from '../../components/common/FormattedAiText';

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

  const measurements = [
    { label: 'Cân nặng', value: health?.weightKg, unit: 'kg' },
    { label: 'Cơ nạc (SMM)', value: health?.smmKg, unit: 'kg' },
    { label: 'Tỷ lệ mỡ (PBF)', value: health?.pbfPercent, unit: '%' },
    { label: 'BMI', value: health?.bmi, unit: '' },
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

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5">
              <h2 className="font-bold uppercase text-slate-900">Lịch tập đã đăng ký</h2>
              {schedule.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Bạn chưa có booking nào được lưu.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {schedule.map((entry) => (
                    <li key={`${entry.bookingType}-${entry.bookingId}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="font-bold text-slate-900">{entry.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{entry.sportName} · {entry.location}</p>
                      <p className="mt-1 text-xs text-slate-600">{formatDateTime(entry.startTime)}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase text-orange-600">{entry.status}</p>
                    </li>
                  ))}
                </ul>
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
