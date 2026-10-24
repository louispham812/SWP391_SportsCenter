import React, { useEffect, useState } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { getMyCoachFeedbacks } from '../../services/engagementApi';

const Stars = ({ value }) => (
  <span className="text-amber-500 tracking-tight">
    {'★'.repeat(value || 0)}
    <span className="text-slate-300">{'★'.repeat(5 - (value || 0))}</span>
  </span>
);

// COA-15: Xem đánh giá từ học viên (dữ liệu thật từ DB)
export default function CoachReviewsPage() {
  const [data, setData] = useState({ average: 0, count: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyCoachFeedbacks()
      .then(setData)
      .catch((err) => setError(err.message || 'Không tải được đánh giá.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CoachLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-primary uppercase">Đánh giá từ học viên</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-6">
          <div className="text-4xl font-bold text-primary">{data.average.toFixed(2)}</div>
          <div>
            <Stars value={Math.round(data.average)} />
            <p className="text-sm text-slate-500">{data.count} đánh giá</p>
          </div>
        </div>
        {loading && <p className="text-sm text-slate-500">Đang tải...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && data.items.length === 0 && (
          <p className="text-sm text-slate-500">Chưa có đánh giá nào.</p>
        )}
        <ul className="space-y-3">
          {data.items.map((item) => (
            <li key={item.feedbackId} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800">{item.memberName}</p>
                <Stars value={item.rating} />
              </div>
              <p className="text-xs text-slate-500">{item.className} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}</p>
              {item.comment && <p className="mt-2 text-sm text-slate-700">{item.comment}</p>}
            </li>
          ))}
        </ul>
      </div>
    </CoachLayout>
  );
}
