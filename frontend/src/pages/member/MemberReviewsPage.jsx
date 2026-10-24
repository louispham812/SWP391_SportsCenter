import React, { useEffect, useState } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { getEligibleFeedbackSessions, submitFeedback } from '../../services/engagementApi';

// MEM-27: Đánh giá HLV / lớp học (chỉ buổi đã được điểm danh có mặt)
export default function MemberReviewsPage() {
  const [sessions, setSessions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getEligibleFeedbackSessions()
      .then(setSessions)
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
    try {
      await submitFeedback({ sessionId: session.sessionId, rating: draft.rating, comment: draft.comment });
      setMessage(`Đã gửi đánh giá cho lớp "${session.className}". Cảm ơn bạn!`);
      load();
    } catch (err) {
      setError(err.message || 'Không gửi được đánh giá.');
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-primary uppercase">Đánh giá huấn luyện viên & lớp học</h1>
        {message && <p className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{message}</p>}
        {error && <p className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</p>}
        {loading && <p className="text-sm text-slate-500">Đang tải...</p>}
        {!loading && sessions.length === 0 && (
          <p className="text-sm text-slate-500">Bạn chưa có buổi học nào cần đánh giá.</p>
        )}
        {sessions.map((session) => {
          const draft = drafts[session.sessionId] || { rating: 0, comment: '' };
          return (
            <div key={session.sessionId} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div>
                <p className="font-bold text-slate-800">{session.className}</p>
                <p className="text-xs text-slate-500">
                  HLV {session.coachName} · {session.startTime ? new Date(session.startTime).toLocaleString('vi-VN') : ''}
                </p>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setDraft(session.sessionId, { rating: star })}
                    className={`text-2xl cursor-pointer ${star <= draft.rating ? 'text-amber-500' : 'text-slate-300'}`}
                    aria-label={`${star} sao`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={draft.comment}
                onChange={(e) => setDraft(session.sessionId, { comment: e.target.value })}
                rows={2}
                placeholder="Nhận xét của bạn (không bắt buộc)"
                className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => handleSubmit(session)}
                className="py-2 px-5 rounded-xl bg-primary text-white text-xs font-bold uppercase cursor-pointer"
              >
                Gửi đánh giá
              </button>
            </div>
          );
        })}
      </div>
    </MemberLayout>
  );
}
