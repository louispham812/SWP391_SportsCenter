import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import ModalDialog from '../../components/common/ModalDialog';
import FormattedAiText from '../../components/common/FormattedAiText';
import Pagination from '../../components/common/Pagination';
import { apiRequest } from '../../services/apiClient';
import { sendMemberAssistantMessages } from '../../services/aiAssistantApi';
import { getMyWorkoutProgress, recordBodyProgress } from '../../services/workoutApi';

const SCHEDULE_PER_PAGE = 3;

const INITIAL_LOG_FORM = {
  weightKg: '',
  heightCm: '',
  smmKg: '',
  pbfPercent: '',
  maxLiftKg: '',
  note: '',
};

const CONTEXT_TABS = [
  { id: 'roadmap', label: 'Lộ trình', icon: 'route' },
  { id: 'suggestions', label: 'Gợi ý', icon: 'auto_awesome' },
  { id: 'schedule', label: 'Lịch tập', icon: 'calendar_month' },
];

const fetchMemberAssistantContext = () =>
  Promise.all([
    apiRequest('/members/me/health'),
    apiRequest('/booking-flow/schedule'),
    getMyWorkoutProgress().catch(() => null),
  ]);

const formatDateTime = (value) =>
  new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const parsePlanExercises = (exercisesJson) => {
  if (!exercisesJson) return [];
  try {
    const parsed = JSON.parse(exercisesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getBmiSummary = (bmiValue) => {
  const num = Number(bmiValue);
  if (!Number.isFinite(num) || num <= 0) return null;
  if (num < 18.5) return { label: 'Thiếu cân', tone: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (num <= 24.9) return { label: 'Cân đối', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (num <= 29.9) return { label: 'Thừa cân', tone: 'bg-orange-50 text-orange-700 border-orange-200' };
  return { label: 'Cần lưu ý', tone: 'bg-red-50 text-red-700 border-red-200' };
};

export default function MemberAIAssistantPage() {
  const [health, setHealth] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [latest1Rm, setLatest1Rm] = useState(null);

  const [activeTab, setActiveTab] = useState('roadmap');
  const [schedulePage, setSchedulePage] = useState(1);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState(INITIAL_LOG_FORM);
  const [savingLog, setSavingLog] = useState(false);
  const [logSuccess, setLogSuccess] = useState('');
  const [logError, setLogError] = useState('');

  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const chatStreamRef = useRef(null);
  const chatInputRef = useRef(null);
  const tabRefs = useRef([]);
  const closeTimerRef = useRef(null);
  const contextSeqRef = useRef(0);
  const chatSessionRef = useRef(0);
  const modalSessionRef = useRef(0);
  const mountedRef = useRef(true);

  const applyLoadedData = useCallback((healthData, scheduleData, workoutData) => {
    setError('');
    setHealth(healthData);
    const activeSchedule = Array.isArray(scheduleData)
      ? scheduleData.filter(
          (s) => s.status !== 'CANCELLED' && s.refundStatus !== 'REFUNDED' && s.refundStatus !== 'APPROVED'
        )
      : [];
    setSchedule(activeSchedule);
    setSchedulePage(1);

    setWorkoutPlans(Array.isArray(workoutData?.plans) ? workoutData.plans : []);
    if (workoutData?.bodyLogs?.length) {
      const withLift = workoutData.bodyLogs.filter((l) => l.maxLiftKg != null);
      setLatest1Rm(withLift.length ? withLift[withLift.length - 1].maxLiftKg : null);
    } else {
      setLatest1Rm(null);
    }
  }, []);

  const loadHealthData = useCallback(async () => {
    const seq = ++contextSeqRef.current;
    try {
      const [healthData, scheduleData, workoutData] = await fetchMemberAssistantContext();
      if (!mountedRef.current || contextSeqRef.current !== seq) return;
      applyLoadedData(healthData, scheduleData, workoutData);
    } catch (requestError) {
      if (mountedRef.current && contextSeqRef.current === seq) {
        setError(requestError.message || 'Không thể tải dữ liệu hồ sơ và lịch tập.');
      }
    } finally {
      if (mountedRef.current && contextSeqRef.current === seq) {
        setLoading(false);
      }
    }
  }, [applyLoadedData]);

  useEffect(() => {
    mountedRef.current = true;
    const seq = ++contextSeqRef.current;
    fetchMemberAssistantContext()
      .then(([healthData, scheduleData, workoutData]) => {
        if (mountedRef.current && contextSeqRef.current === seq) {
          applyLoadedData(healthData, scheduleData, workoutData);
        }
      })
      .catch((requestError) => {
        if (mountedRef.current && contextSeqRef.current === seq) {
          setError(requestError.message || 'Không thể tải dữ liệu hồ sơ và lịch tập.');
        }
      })
      .finally(() => {
        if (mountedRef.current && contextSeqRef.current === seq) {
          setLoading(false);
        }
      });

    return () => {
      mountedRef.current = false;
      contextSeqRef.current += 1;
      chatSessionRef.current += 1;
      modalSessionRef.current += 1;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [applyLoadedData]);

  useEffect(() => {
    if (chatStreamRef.current && (messages.length > 0 || sending)) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const openLogModal = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    modalSessionRef.current += 1;
    setLogError('');
    setLogSuccess('');
    setIsLogModalOpen(true);
  };

  const closeLogModal = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    modalSessionRef.current += 1;
    setIsLogModalOpen(false);
    setLogError('');
    setLogSuccess('');
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    const saveSessionId = modalSessionRef.current;
    setSavingLog(true);
    setLogSuccess('');
    setLogError('');
    try {
      await recordBodyProgress({
        weightKg: logForm.weightKg ? Number(logForm.weightKg) : null,
        heightCm: logForm.heightCm ? Number(logForm.heightCm) : null,
        smmKg: logForm.smmKg ? Number(logForm.smmKg) : null,
        pbfPercent: logForm.pbfPercent ? Number(logForm.pbfPercent) : null,
        maxLiftKg: logForm.maxLiftKg ? Number(logForm.maxLiftKg) : null,
        note: logForm.note.trim() || 'Hội viên tự ghi nhận qua AI Assistant',
      });
      await loadHealthData();
      if (modalSessionRef.current !== saveSessionId) return;
      setLogSuccess('Ghi nhận chỉ số thể trạng và 1RM thành công!');
      closeTimerRef.current = setTimeout(() => {
        if (modalSessionRef.current !== saveSessionId) return;
        setIsLogModalOpen(false);
        setLogSuccess('');
        setLogForm(INITIAL_LOG_FORM);
      }, 900);
    } catch (err) {
      if (modalSessionRef.current === saveSessionId && mountedRef.current) {
        setLogError(err.message || 'Không thể lưu chỉ số.');
      }
    } finally {
      if (mountedRef.current) {
        setSavingLog(false);
      }
    }
  };

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

  const bmiValue = computedBmi ?? health?.bmi;
  const bmiSummary = useMemo(() => getBmiSummary(bmiValue), [bmiValue]);

  const measurements = [
    {
      label: 'Cân nặng',
      value: health?.weightKg,
      unit: 'kg',
      icon: 'monitor_weight',
      accent: 'text-slate-700 bg-slate-100',
    },
    {
      label: 'Cơ nạc (SMM)',
      value: health?.smmKg,
      unit: 'kg',
      icon: 'fitness_center',
      accent: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Tỷ lệ mỡ (PBF)',
      value: health?.pbfPercent,
      unit: '%',
      icon: 'water_drop',
      accent: 'text-orange-700 bg-orange-50',
    },
    {
      label: 'BMI',
      value: bmiValue,
      unit: '',
      icon: 'analytics',
      accent: 'text-indigo-700 bg-indigo-50',
      badge: bmiSummary,
    },
    {
      label: 'Kỷ lục 1RM',
      value: latest1Rm,
      unit: 'kg',
      icon: 'military_tech',
      accent: 'text-blue-700 bg-blue-50',
      spanClass: 'col-span-2 sm:col-span-1',
    },
  ];

  const promptSuggestions = useMemo(() => {
    const primarySport = schedule[0]?.sportName;
    const goalText = health?.fitnessGoals?.trim();
    const injuryText = health?.injuryHistory?.trim();

    return [
      {
        tag: 'InBody & Dinh dưỡng',
        title: 'Đánh giá chỉ số & mức calo',
        prompt: 'Phân tích các chỉ số InBody hiện tại của tôi (cân nặng, SMM, PBF, BMI) và gợi ý mức calo cùng tỷ lệ đạm phù hợp.',
      },
      {
        tag: 'Lộ trình tuần',
        title: goalText ? 'Lịch tập bám sát mục tiêu' : 'Chia lịch 3 buổi/tuần',
        prompt: goalText
          ? `Lập lịch tập 3-4 buổi trong tuần dựa trên lịch lớp hiện có để đạt mục tiêu: ${goalText}.`
          : 'Gợi ý lịch tập 3 buổi/tuần cân bằng giữa tăng cơ, sức bền và thời gian phục hồi.',
      },
      {
        tag: 'An toàn & Phục hồi',
        title: injuryText ? 'Lưu ý bài tập tránh chấn thương' : 'Giãn cơ & phục hồi nhanh',
        prompt: injuryText
          ? `Với tiền sử chấn thương "${injuryText}", tôi nên tránh động tác nào và cần bài khởi động cổ khớp ra sao?`
          : 'Gợi ý bài tập giãn cơ 15 phút và cách phục hồi cơ bắp sau buổi tập cường độ cao.',
      },
      {
        tag: 'Bổ trợ chuyên môn',
        title: primarySport ? `Tăng thể lực cho ${primarySport}` : 'Tăng sức mạnh 1RM an toàn',
        prompt: primarySport
          ? `Gợi ý 4 bài tập bổ trợ tăng tốc độ phản xạ và sức bền cho môn ${primarySport}${latest1Rm ? `, kết hợp duy trì mức 1RM ${latest1Rm}kg` : ''}.`
          : 'Lộ trình tăng mức tạ 1RM trong 4 tuần tới mà vẫn đảm bảo kỹ thuật an toàn.',
      },
    ];
  }, [health?.fitnessGoals, health?.injuryHistory, latest1Rm, schedule]);

  const applyPromptSuggestion = (promptText) => {
    setMessageDraft(promptText);
    const inputEl = chatInputRef.current;
    if (inputEl) {
      inputEl.focus();
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleTabKeyDown = (event, currentIndex) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % CONTEXT_TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + CONTEXT_TABS.length) % CONTEXT_TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = CONTEXT_TABS.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveTab(CONTEXT_TABS[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const handleResetChat = () => {
    chatSessionRef.current += 1;
    setMessages([]);
    setAssistantError('');
    setSending(false);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const content = messageDraft.trim();
    if (!content || sending) return;

    const sessionId = chatSessionRef.current;
    const nextMessages = [...messages, { role: 'user', content }].slice(-19);
    setMessages(nextMessages);
    setMessageDraft('');
    setAssistantError('');
    setSending(true);
    try {
      const response = await sendMemberAssistantMessages(nextMessages);
      if (chatSessionRef.current !== sessionId) return;
      setMessages([...nextMessages, { role: 'assistant', content: response.answer }]);
    } catch (requestError) {
      if (chatSessionRef.current === sessionId) {
        setAssistantError(requestError.message || 'Không thể nhận phản hồi từ trợ lý AI.');
      }
    } finally {
      if (chatSessionRef.current === sessionId) {
        setSending(false);
      }
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-orange-600">
              Hồ sơ và lịch tập đã đồng bộ
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              Tiến Độ Rèn Luyện &amp; AI Coach
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Chỉ số thể trạng InBody, lộ trình tập luyện và thời khóa biểu của bạn được đồng bộ trực tiếp cho trợ lý AI.
            </p>
          </div>
          <button
            type="button"
            onClick={openLogModal}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-orange-600 cursor-pointer sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add_chart</span>
            <span>Ghi nhận chỉ số &amp; 1RM</span>
          </button>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}

        {/* Tóm tắt chỉ số thể trạng InBody & 1RM trên một hàng cân đối */}
        {loading ? (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-semibold text-slate-600 shadow-2xs"
          >
            <span className="material-symbols-outlined animate-spin text-[18px] text-orange-500">progress_activity</span>
            <span>Đang tải hồ sơ và chỉ số thể trạng...</span>
          </div>
        ) : (
          <section aria-label="Tóm tắt chỉ số thể trạng" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {measurements.map(({ label, value, unit, icon, accent, badge, spanClass = '' }) => (
              <article
                key={label}
                className={`min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-2xs transition-colors hover:border-orange-300 sm:px-4 sm:py-3.5 ${spanClass}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <p className="text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-500">{label}</p>
                  <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg sm:h-7 sm:w-7 ${accent}`}>
                    <span className="material-symbols-outlined text-[15px] sm:text-[16px]">{icon}</span>
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1.5">
                  <p className="text-xl font-black tabular-nums text-slate-900 sm:text-2xl">
                    {value ?? 'Chưa có'}
                    {value != null && unit ? (
                      <span className="ml-1 text-xs font-bold text-slate-400">{unit}</span>
                    ) : null}
                  </p>
                  {badge && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.tone}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Không gian làm việc chính: Khung chat AI rộng + Lộ trình / Gợi ý / Lịch tập tách tab */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <section className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7 xl:col-span-8">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-orange-400 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black uppercase tracking-tight text-slate-900 sm:text-lg">
                    Trợ lý AI luyện tập (F Sport Coach)
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Tham khảo hồ sơ sức khỏe, lộ trình và lịch tập đã lưu để gợi ý bài tập &amp; dinh dưỡng sát thực tế.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Đã đồng bộ hồ sơ
                </span>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetChat}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">refresh</span>
                    <span>Mới</span>
                  </button>
                )}
              </div>
            </div>

            <div
              ref={chatStreamRef}
              aria-live="polite"
              className="h-[360px] space-y-3 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 [scrollbar-gutter:stable] sm:h-[430px] sm:p-5"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-2 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <span className="material-symbols-outlined text-[24px]">psychology</span>
                  </div>
                  <p className="max-w-lg text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
                    Hãy hỏi về mục tiêu rèn luyện thể lực, tư vấn bài tập bổ trợ cho Pickleball / Tennis hoặc cách phục hồi cơ bắp an toàn.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {promptSuggestions.slice(0, 3).map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => applyPromptSuggestion(item.prompt)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-orange-300 hover:text-orange-600 cursor-pointer"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      message.role === 'user'
                        ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-orange-500 px-4 py-3 text-xs font-medium leading-relaxed text-white shadow-sm whitespace-pre-wrap sm:text-sm'
                        : 'flex max-w-[92%] items-start gap-2.5'
                    }
                  >
                    {message.role === 'user' ? (
                      message.content
                    ) : (
                      <>
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-orange-400">
                          <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                        </div>
                        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-800 shadow-2xs sm:text-sm">
                          <FormattedAiText content={message.content} />
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}

              {sending && (
                <p role="status" className="flex items-center gap-2 text-xs font-bold text-orange-600 animate-pulse">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  <span>Trợ lý F Sport đang suy nghĩ và trả lời...</span>
                </p>
              )}
            </div>

            {assistantError && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
                {assistantError}
              </p>
            )}

            <form onSubmit={handleSendMessage} className="flex flex-col gap-2.5 pt-1 sm:flex-row">
              <label className="sr-only" htmlFor="member-ai-message">
                Tin nhắn cho trợ lý AI
              </label>
              <input
                ref={chatInputRef}
                id="member-ai-message"
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                maxLength={4000}
                placeholder="Nhập câu hỏi của bạn cho AI Coach..."
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-medium outline-none focus:border-orange-500 sm:text-sm"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !messageDraft.trim()}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>{sending ? 'Đang gửi...' : 'Gửi câu hỏi'}</span>
              </button>
            </form>

            <p className="text-[11px] leading-relaxed text-slate-500">
              Khi gửi câu hỏi, hệ thống chuyển mục tiêu, chỉ số sức khỏe và lịch lớp liên quan (nếu có) tới Gemini để tạo trả lời.
              Không gửi tên hoặc số điện thoại. Gợi ý không thay thế tư vấn y tế.
            </p>
          </section>

          {/* Cột phải: Tách Lộ trình / Gợi ý / Lịch tập theo Tab (active bg-slate-900) */}
          <aside className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-5 xl:col-span-4">
            <div
              role="tablist"
              aria-label="Ngữ cảnh và gợi ý AI Coach"
              className="flex flex-nowrap items-center gap-1 overflow-x-auto border-b border-slate-100 pb-3"
            >
              {CONTEXT_TABS.map((tab, index) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    id={`ai-context-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setActiveTab(tab.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                    className={`relative inline-flex flex-1 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-xl border px-1.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm after:absolute after:inset-x-3 after:bottom-0 after:border-b-2 after:border-orange-400'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.id === 'schedule' && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {schedule.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeTab === 'roadmap' && (
              <div
                role="tabpanel"
                id="ai-context-panel-roadmap"
                aria-labelledby="ai-context-tab-roadmap"
                className="space-y-4"
              >
                <article className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Thông tin mục tiêu
                    </h2>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                      {health?.fitnessLevel || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-2.5 text-xs">
                    <div>
                      <dt className="font-semibold text-slate-500">Mục tiêu tập luyện</dt>
                      <dd className="mt-0.5 whitespace-pre-line font-medium text-slate-800">
                        {health?.fitnessGoals || 'Chưa được cập nhật.'}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Lịch sử chấn thương</dt>
                      <dd className="mt-0.5 whitespace-pre-line font-medium text-slate-800">
                        {health?.injuryHistory || 'Chưa được cập nhật.'}
                      </dd>
                    </div>
                  </dl>
                </article>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Lộ trình luyện tập ({workoutPlans.length})
                    </h3>
                    <Link
                      to="/member/workout-plans"
                      className="text-xs font-bold text-orange-600 hover:text-orange-700"
                    >
                      Mở kế hoạch
                    </Link>
                  </div>

                  {workoutPlans.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-xs text-slate-500">
                      <p>Chưa có giáo án hoặc lộ trình nào được lưu.</p>
                      <Link
                        to="/member/workout-plans"
                        className="mt-2 inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700"
                      >
                        <span>Xem trang kế hoạch tập</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {workoutPlans.slice(0, 3).map((plan) => {
                        const exercises = parsePlanExercises(plan.exercisesJson);
                        const doneCount = exercises.filter((ex) => ex?.completed).length;
                        const pct = exercises.length > 0 ? Math.round((doneCount / exercises.length) * 100) : 0;
                        return (
                          <li
                            key={plan.planId}
                            className="rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-orange-300"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  plan.source === 'AI'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {plan.source === 'AI' ? 'Gợi ý AI' : `HLV ${plan.coachName || 'SportHub'}`}
                              </span>
                              {exercises.length > 0 && (
                                <span className="text-[11px] font-bold text-slate-500">
                                  {doneCount}/{exercises.length} bài
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-xs font-bold text-slate-900">{plan.title}</p>
                            {plan.goal && <p className="mt-0.5 text-[11px] text-slate-500">{plan.goal}</p>}
                            {exercises.length > 0 && (
                              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                applyPromptSuggestion(
                                  `Xem xét lộ trình "${plan.title}" (${doneCount}/${exercises.length} bài hoàn thành) và gợi ý cách điều chỉnh buổi tập tiếp theo.`
                                )
                              }
                              className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
                              <span>Hỏi AI về lộ trình này</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'suggestions' && (
              <div
                role="tabpanel"
                id="ai-context-panel-suggestions"
                aria-labelledby="ai-context-tab-suggestions"
                className="space-y-3"
              >
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Gợi ý câu hỏi nhanh
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Chọn một chủ đề bên dưới để điền sẵn câu hỏi vào khung chat.
                  </p>
                </div>
                <div className="space-y-2.5">
                  {promptSuggestions.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => applyPromptSuggestion(item.prompt)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition hover:border-orange-300 hover:bg-orange-50/40 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600 border border-orange-100">
                          {item.tag}
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-slate-400">north_west</span>
                      </div>
                      <p className="mt-1.5 text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{item.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div
                role="tabpanel"
                id="ai-context-panel-schedule"
                aria-labelledby="ai-context-tab-schedule"
                className="space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Lịch tập đã đăng ký
                    </h2>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
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
                  <div className="py-6 text-center text-xs text-slate-400">
                    <span className="material-symbols-outlined mb-1 text-3xl text-slate-300">event_busy</span>
                    <p>Bạn chưa có lịch tập nào được lưu.</p>
                    <Link
                      to="/member/classes"
                      className="mt-2 inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700"
                    >
                      <span>Đăng ký lớp học</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {currentSchedule.map((entry) => (
                      <li
                        key={`${entry.bookingType}-${entry.bookingId}`}
                        className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition hover:bg-slate-100/70"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 truncate text-xs font-bold text-slate-900">{entry.title}</p>
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              entry.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-slate-600">
                          {entry.sportName} · {entry.location}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                          {formatDateTime(entry.startTime)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                {totalSchedulePages > 1 && (
                  <div className="border-t border-slate-100 pt-3">
                    <Pagination
                      currentPage={schedulePage}
                      totalPages={totalSchedulePages}
                      onPageChange={setSchedulePage}
                    />
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Modal ghi nhận chỉ số cơ thể & 1RM */}
      <ModalDialog
        open={isLogModalOpen}
        onClose={closeLogModal}
        titleId="ai-log-modal-title"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 id="ai-log-modal-title" className="text-base font-bold text-slate-900">
                Ghi Nhận Chỉ Số Thể Trạng &amp; 1RM
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi tiến độ cơ thể (Body Progress) &amp; Kỷ lục tạ (1RM Max Lift)
              </p>
            </div>
            <button
              type="button"
              onClick={closeLogModal}
              aria-label="Đóng hộp thoại ghi nhận chỉ số"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {logSuccess && (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              {logSuccess}
            </div>
          )}

          {logError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
              {logError}
            </div>
          )}

          <form onSubmit={handleSaveProgress} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ai-log-weight" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cân nặng (kg) *
                </label>
                <input
                  id="ai-log-weight"
                  type="number"
                  step="0.1"
                  required
                  value={logForm.weightKg}
                  onChange={(e) => setLogForm({ ...logForm, weightKg: e.target.value })}
                  placeholder="VD: 68.5"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label htmlFor="ai-log-height" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Chiều cao (cm) *
                </label>
                <input
                  id="ai-log-height"
                  type="number"
                  step="0.5"
                  required
                  value={logForm.heightCm}
                  onChange={(e) => setLogForm({ ...logForm, heightCm: e.target.value })}
                  placeholder="VD: 172"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ai-log-smm" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cơ nạc SMM (kg)
                </label>
                <input
                  id="ai-log-smm"
                  type="number"
                  step="0.1"
                  value={logForm.smmKg}
                  onChange={(e) => setLogForm({ ...logForm, smmKg: e.target.value })}
                  placeholder="VD: 32.5"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label htmlFor="ai-log-pbf" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mỡ PBF (%)
                </label>
                <input
                  id="ai-log-pbf"
                  type="number"
                  step="0.1"
                  value={logForm.pbfPercent}
                  onChange={(e) => setLogForm({ ...logForm, pbfPercent: e.target.value })}
                  placeholder="VD: 18.0"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ai-log-1rm" className="mb-1 block text-xs font-bold uppercase tracking-wider text-blue-700">
                Kỷ lục mức tạ 1RM tối đa (kg)
              </label>
              <input
                id="ai-log-1rm"
                type="number"
                step="0.5"
                value={logForm.maxLiftKg}
                onChange={(e) => setLogForm({ ...logForm, maxLiftKg: e.target.value })}
                placeholder="VD: 100"
                className="w-full rounded-xl border border-blue-300 px-3 py-2 text-xs font-black text-blue-700 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="ai-log-note" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Ghi chú
              </label>
              <input
                id="ai-log-note"
                type="text"
                value={logForm.note}
                onChange={(e) => setLogForm({ ...logForm, note: e.target.value })}
                placeholder="VD: Đạt PR Deadlift mới"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
              <button
                type="submit"
                disabled={savingLog}
                className="flex-1 rounded-xl bg-orange-500 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
              >
                {savingLog ? 'Đang lưu...' : 'Lưu chỉ số & 1RM'}
              </button>
              <button
                type="button"
                onClick={closeLogModal}
                className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </ModalDialog>
    </MemberLayout>
  );
}
