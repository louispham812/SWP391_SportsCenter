import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';
import { getEligibleFeedbackSessions, submitFeedback } from '../../services/engagementApi';

const RATING_LABELS = {
  1: 'Rất chưa hài lòng',
  2: 'Cần cải thiện',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng',
};

// MEM-27: Đánh giá HLV / lớp học (chỉ buổi đã được điểm danh có mặt)
export default function MemberReviewsPage() {
  const { showToast } = useApp();
  const [sessions, setSessions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [hoveredStars, setHoveredStars] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getEligibleFeedbackSessions()
      .then((rows) => setSessions(Array.isArray(rows) ? rows : []))
      .catch((err) => setError(err.message || 'Không tải được danh sách buổi học.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setDraft = (id, patch) =>
    setDrafts((prev) => ({ ...prev, [id]: { rating: 0, comment: '', ...prev[id], ...patch } }));

  const handleSubmit = async (session) => {
    const draft = drafts[session.sessionId] || {};
    setMessage('');
    setError('');
    if (!draft.rating) {
      setError('Vui lòng chọn số sao trước khi gửi.');
      return;
    }
    setSubmittingId(session.sessionId);
    try {
      await submitFeedback({ sessionId: session.sessionId, rating: draft.rating, comment: draft.comment });
      const successText = `Đã gửi đánh giá cho lớp "${session.className}". Cảm ơn bạn!`;
      setMessage(successText);
      showToast('Cảm ơn đánh giá của bạn', successText, 'success');
      load();
    } catch (err) {
      setError(err.message || 'Không gửi được đánh giá.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Đánh giá huấn luyện viên &amp; lớp học</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Chia sẻ trải nghiệm buổi học đã điểm danh có mặt để giúp trung tâm nâng cao chất lượng giảng dạy.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">refresh</span>
            Làm mới
          </button>
        </header>

        {message && <p role="status" className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">{message}</p>}
        {error && <p role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">{error}</p>}

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 rounded-2xl skeleton-shimmer" />
            ))}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <span aria-hidden="true" className="material-symbols-outlined text-4xl text-slate-300">star_rate</span>
            <p className="text-sm font-bold text-slate-800">Bạn chưa có buổi học nào cần đánh giá</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Sau khi tham gia lớp học và được HLV điểm danh có mặt, bạn có thể gửi nhận xét tại đây.
            </p>
            <Link
              to="/member/schedule"
              className="inline-flex items-center gap-1.5 mt-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
            >
              Xem lịch tập của tôi
            </Link>
          </div>
        )}

        {sessions.map((session) => {
          const draft = drafts[session.sessionId] || { rating: 0, comment: '' };
          const previewRating = hoveredStars[session.sessionId] || draft.rating;
          const isSaving = submittingId === session.sessionId;
          return (
            <div key={session.sessionId} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
              <div>
                <p className="font-bold text-slate-900">{session.className}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  HLV {session.coachName} · {session.startTime ? new Date(session.startTime).toLocaleString('vi-VN') : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1" onMouseLeave={() => setHoveredStars((prev) => ({ ...prev, [session.sessionId]: 0 }))}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStars((prev) => ({ ...prev, [session.sessionId]: star }))}
                      onClick={() => setDraft(session.sessionId, { rating: star })}
                      className={`p-1 text-2xl leading-none cursor-pointer transition-transform hover:scale-110 ${
                        star <= previewRating ? 'text-amber-500' : 'text-slate-300'
                      }`}
                      aria-label={`${star} sao`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {previewRating > 0 && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {previewRating}/5 · {RATING_LABELS[previewRating]}
                  </span>
                )}
              </div>
              <textarea
                value={draft.comment}
                onChange={(e) => setDraft(session.sessionId, { comment: e.target.value })}
                rows={2}
                placeholder="Nhận xét của bạn (không bắt buộc)"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-orange-500 outline-none"
              />
              <button
                type="button"
                disabled={isSaving || submittingId !== null}
                onClick={() => handleSubmit(session)}
                className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold uppercase cursor-pointer transition"
              >
                {isSaving ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          );
        })}
      </div>
    </MemberLayout>
  );
}
