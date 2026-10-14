import React, { useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { searchReceptionistMembers } from '../../services/receptionistApi';

export default function ReceptionMembersPage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [page, setPage] = useState(0);
  const [response, setResponse] = useState(null);
  const requestKey = `${submittedQuery}\u0000${page}`;
  const loading = response?.key !== requestKey;
  const result = response?.key === requestKey ? response.data : null;
  const error = response?.key === requestKey ? response.error : '';

  useEffect(() => {
    let active = true;
    searchReceptionistMembers(submittedQuery, page)
      .then((data) => {
        if (active) setResponse({ key: requestKey, data, error: '' });
      })
      .catch((requestError) => {
        if (active) setResponse({
          key: requestKey,
          data: null,
          error: requestError.message || 'Không thể tải danh sách hội viên.',
        });
      });
    return () => {
      active = false;
    };
  }, [submittedQuery, page, requestKey]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(0);
    setSubmittedQuery(query.trim());
  };

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        <header>
          <div className="mb-1 inline-flex rounded bg-secondary-container/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
            FLOW 1 · MEMBER LOOKUP
          </div>
          <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">Tra cứu hội viên</h1>
          <p className="text-sm text-slate-500">Tìm theo tên, email, số điện thoại hoặc mã hội viên.</p>
        </header>

        <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <label className="sr-only" htmlFor="member-search">Từ khóa tìm kiếm</label>
          <input
            id="member-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhập tên, email, số điện thoại hoặc mã hội viên"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-secondary"
          />
          <button type="submit" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
            Tìm hội viên
          </button>
        </form>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">Đang tải dữ liệu hội viên...</p>
          ) : result?.content?.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Mã</th><th className="px-5 py-3">Hội viên</th>
                      <th className="px-5 py-3">Liên hệ</th><th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.content.map((member) => (
                      <tr key={member.userId} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-mono text-slate-500">#{member.userId}</td>
                        <td className="px-5 py-4 font-semibold text-slate-900">{member.fullName}</td>
                        <td className="px-5 py-4 text-slate-600">
                          <div>{member.phone || 'Chưa có số điện thoại'}</div>
                          <div className="text-xs text-slate-400">{member.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>{member.status || 'CHƯA CẬP NHẬT'}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {member.createdAt ? new Date(member.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm">
                <span className="text-slate-500">Tổng cộng {result.totalElements} hội viên</span>
                <div className="flex items-center gap-2">
                  <button disabled={page === 0} onClick={() => setPage((current) => current - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Trước</button>
                  <span className="text-xs text-slate-500">{page + 1} / {Math.max(result.totalPages, 1)}</span>
                  <button disabled={page + 1 >= result.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sau</button>
                </div>
              </div>
            </>
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">Không tìm thấy hội viên phù hợp.</p>
          )}
        </section>
      </div>
    </ReceptionistLayout>
  );
}
