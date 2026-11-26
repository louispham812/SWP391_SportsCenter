import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { getAuditLogs } from '../../services/engagementApi';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { matchesAnyVietnamese } from '../../utils/vietnameseSearch';

// MGR-14: Xem Audit Log (dữ liệu thật từ bảng audit_logs)
export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const LOGS_PER_PAGE = 10;

  useEffect(() => {
    getAuditLogs()
      .then(setLogs)
      .catch((err) => setError(err.message || 'Không tải được nhật ký.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return logs;
    return logs.filter((l) =>
      matchesAnyVietnamese(
        [l.action, l.logType, l.detail, l.actionDetail, l.actorName, l.userEmail, l.actorRole],
        q,
      ));
  }, [logs, query]);

  const totalPages = Math.ceil(filtered.length / LOGS_PER_PAGE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * LOGS_PER_PAGE;
    return filtered.slice(start, start + LOGS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-primary uppercase">Nhật ký hệ thống (Audit Log)</h1>
        <div className="relative w-full max-w-md">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Lọc theo hành động, người thực hiện, nội dung..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-9 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCurrentPage(1);
              }}
              aria-label="Xóa từ khóa lọc nhật ký"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200" tabIndex={0}>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 whitespace-nowrap">
                <tr><th className="p-3">Thời gian</th><th className="p-3">Người thực hiện</th><th className="p-3">Hành động</th><th className="p-3">Chi tiết</th></tr>
              </thead>
              <tbody>
                {paginatedLogs.map((l) => (
                  <tr key={l.logId} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 whitespace-nowrap">{l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : ''}</td>
                    <td className="p-3 font-medium text-slate-800">
                      {l.actorName || l.userEmail || (l.actorId || l.userId ? `#${l.actorId || l.userId}` : 'Hệ thống')}
                      {l.actorRole && (
                        <span className="ml-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500 whitespace-nowrap">
                          {l.actorRole}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs font-semibold text-primary whitespace-nowrap">{l.action || l.logType || '-'}</td>
                    <td className="p-3 text-slate-600">{l.detail || l.actionDetail || l.errorMessage || '-'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-500">Chưa có bản ghi nào.</td></tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Hiển thị {(currentPage - 1) * LOGS_PER_PAGE + 1} - {Math.min(currentPage * LOGS_PER_PAGE, filtered.length)} trên {filtered.length} nhật ký
                </span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
