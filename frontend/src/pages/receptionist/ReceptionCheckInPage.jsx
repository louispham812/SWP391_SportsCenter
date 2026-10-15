import React, { useCallback, useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { apiRequest } from '../../services/apiClient';

const formatDateTime = (value) => new Date(value).toLocaleString('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export default function ReceptionCheckInPage() {
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const refreshHistory = useCallback(async () => {
    try {
      const rows = await apiRequest('/receptionist/check-ins');
      setHistory(rows);
    } catch (requestError) {
      setError(`Check-in đã được ghi nhận nhưng không thể tải lại lịch sử: ${requestError.message || 'Lỗi không xác định.'}`);
    }
  }, []);

  useEffect(() => {
    let current = true;
    const loadHistory = async () => {
      try {
        const rows = await apiRequest('/receptionist/check-ins');
        if (current) setHistory(rows);
      } catch (requestError) {
        if (current) setError(requestError.message || 'Không thể tải lịch sử check-in.');
      } finally {
        if (current) setLoadingHistory(false);
      }
    };
    void loadHistory();
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    let current = true;
    if (search.trim().length < 2) {
      setMembers([]);
      return () => {
        current = false;
      };
    }
    const timeoutId = window.setTimeout(() => {
      apiRequest(`/receptionist/members?query=${encodeURIComponent(search.trim())}&page=0&size=20`)
        .then((result) => {
          if (current) setMembers(result.content || []);
        })
        .catch((requestError) => {
          if (current) setError(requestError.message || 'Không thể tìm hội viên.');
        });
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const selectedMember = members.find((member) => member.userId === Number(memberId));

  const handleCheckIn = async (event) => {
    event.preventDefault();
    if (!memberId) {
      setError('Vui lòng tìm và chọn hội viên trước khi check-in.');
      return;
    }
    setSubmitting(true);
    setError('');
    setResultMessage('');
    try {
      const result = await apiRequest('/receptionist/check-ins', {
        method: 'POST',
        body: JSON.stringify({ memberId: Number(memberId) }),
      });
      setResultMessage(result.result === 'VALID'
        ? `Check-in hợp lệ đã được lưu cho ${result.memberName}.`
        : `Không đủ điều kiện vào tập. Lần thử check-in của ${result.memberName} đã được lưu để đối soát.`);
      setMemberId('');
      await refreshHistory();
    } catch (requestError) {
      setError(requestError.message || 'Không thể ghi nhận check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReceptionistLayout>
      <main className="space-y-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            F SPORT RECEPTION · TIẾP ĐÓN &amp; ĐIỂM DANH
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Tiếp Đón &amp; Điểm Danh Quầy</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tra cứu hội viên, kiểm tra hạn gói thẻ và ghi nhận lượt vào tập tại quầy F Sport.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {resultMessage && (
          <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{resultMessage}</span>
          </p>
        )}

        <form onSubmit={handleCheckIn} className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label htmlFor="member-search" className="block text-sm font-bold text-slate-800">
            Tìm hội viên theo tên, email hoặc số điện thoại
          </label>
          <input
            id="member-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setMemberId('');
            }}
            placeholder="Nhập tên, số điện thoại hoặc email (tối thiểu 2 ký tự)..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
          {search.trim().length >= 2 && (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-xs text-slate-500 p-2">Không tìm thấy hội viên phù hợp.</p>
              ) : members.map((member) => (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => setMemberId(String(member.userId))}
                  className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                    memberId === String(member.userId)
                      ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/15'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <strong className="block text-sm text-slate-900">{member.fullName}</strong>
                  <span className="text-xs text-slate-500">{member.phone || member.email}</span>
                </button>
              ))}
            </div>
          )}
          {selectedMember && (
            <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 p-3 text-sm text-orange-900">
              <span className="material-symbols-outlined text-orange-600 text-[18px]">account_circle</span>
              <span>Đã chọn: <strong>{selectedMember.fullName}</strong> ({selectedMember.phone || selectedMember.email})</span>
            </div>
          )}
          <button
            type="submit"
            disabled={!memberId || submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            {submitting ? 'Đang xác minh...' : 'Xác minh và ghi nhận check-in'}
          </button>
          <p className="text-xs text-slate-400">
            Hệ thống tự động kiểm tra tính hợp lệ của gói thẻ và ghi nhận lượt check-in vào cơ sở dữ liệu.
          </p>
        </form>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold uppercase text-slate-900">Lịch sử check-in gần đây</h2>
          </div>
          {loadingHistory ? (
            <p role="status" className="p-5 text-sm text-slate-500">Đang tải lịch sử...</p>
          ) : history.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Chưa có lịch sử check-in.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Hội viên</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((entry) => (
                    <tr key={entry.checkInId}>
                      <td className="px-4 py-3">
                        <strong className="text-slate-900">{entry.memberName}</strong>
                        <span className="block text-slate-500">{entry.phone}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(entry.checkedInAt)}</td>
                      <td className={`px-4 py-3 font-bold ${entry.result === 'VALID' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {entry.result === 'VALID' ? 'Hợp lệ' : 'Từ chối'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </ReceptionistLayout>
  );
}
