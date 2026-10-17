import React, { useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import CreateUserModal from '../../components/common/CreateUserModal';
import { searchReceptionistMembers } from '../../services/receptionistApi';

export default function ReceptionMembersPage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [response, setResponse] = useState(null);
  const requestKey = `${submittedQuery}\u0000${page}\u0000${refreshKey}`;
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
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              F SPORT RECEPTION · TRA CỨU HỘI VIÊN
            </div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">Tra cứu hồ sơ hội viên</h1>
            <p className="text-sm text-slate-500">Tìm kiếm nhanh theo họ tên, email, số điện thoại hoặc mã hội viên F Sport.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Thêm người dùng mới
          </button>
        </header>

        <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <label className="sr-only" htmlFor="member-search">Từ khóa tìm kiếm</label>
          <input
            id="member-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhập tên, email, số điện thoại hoặc mã hội viên..."
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
          <button type="submit" className="rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all">
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
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </ReceptionistLayout>
  );
}
