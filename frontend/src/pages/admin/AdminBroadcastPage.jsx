import React, { useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { sendBroadcast } from '../../services/engagementApi';

const AUDIENCES = [
  { value: 'ALL', label: 'Tất cả (Hội viên, HLV, Lễ tân)' },
  { value: 'MEMBER', label: 'Chỉ hội viên' },
  { value: 'COACH', label: 'Chỉ huấn luyện viên' },
  { value: 'RECEPTIONIST', label: 'Chỉ lễ tân' },
];

// MGR-20: Gửi thông báo hàng loạt
export default function AdminBroadcastPage() {
  const [audience, setAudience] = useState('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setStatus({ type: '', text: '' });
    try {
      const result = await sendBroadcast({ audience, title, message });
      setStatus({ type: 'ok', text: `Đã gửi thông báo tới ${result.recipients} người dùng.` });
      setTitle('');
      setMessage('');
    } catch (err) {
      setStatus({ type: 'err', text: err.message || 'Gửi thông báo thất bại.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <h1 className="text-xl font-bold text-primary uppercase">Gửi thông báo hàng loạt</h1>
        <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm">
          {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" required className="w-full rounded-lg border border-slate-200 p-2 text-sm" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Nội dung thông báo" required className="w-full rounded-lg border border-slate-200 p-2 text-sm" />
        {status.text && (
          <p className={`p-3 rounded-lg text-sm ${status.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.text}</p>
        )}
        <button type="submit" disabled={sending} className="py-2 px-6 rounded-xl bg-primary text-white text-xs font-bold uppercase disabled:opacity-50 cursor-pointer">
          {sending ? 'Đang gửi...' : 'Gửi thông báo'}
        </button>
      </form>
    </AdminLayout>
  );
}
