import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useApp } from '../../context/AppContext';
import {
  approveStaffRegistration,
  getPendingStaffRegistrations,
  rejectStaffRegistration,
} from '../../services/managerApi';

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function AdminStaffApprovalsPage() {
  const { showToast } = useApp();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPendingStaffRegistrations();
      setRegistrations(data);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách đăng ký.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
    const handleWindowFocus = () => loadRegistrations();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadRegistrations();
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadRegistrations]);

  const handleDecision = async (registration, decision) => {
    setProcessingId(registration.userId);
    setError('');
    try {
      if (decision === 'approve') {
        await approveStaffRegistration(registration.userId);
        showToast('Đã duyệt tài khoản', `${registration.fullName} đã có thể đăng nhập.`, 'success');
      } else {
        await rejectStaffRegistration(registration.userId);
        showToast('Đã từ chối đăng ký', `Đăng ký của ${registration.fullName} đã bị từ chối.`, 'success');
      }
      await loadRegistrations();
    } catch (requestError) {
      setError(requestError.message || 'Không thể xử lý đăng ký.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT ADMIN · DUYỆT NHÂN VIÊN
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Duyệt đăng ký Coach &amp; Lễ tân</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kiểm tra hồ sơ nhân sự mới và kích hoạt quyền truy cập vào hệ thống F Sport.
            </p>
          </div>
          <button
            type="button"
            onClick={loadRegistrations}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Làm mới
          </button>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Hồ sơ đang chờ duyệt</h2>
            {!loading && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                {registrations.length} đang chờ
              </span>
            )}
          </div>

          {error && (
            <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">Đang tải danh sách đăng ký...</p>
          ) : registrations.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="material-symbols-outlined text-4xl text-emerald-600">task_alt</span>
              <p className="mt-2 font-semibold text-slate-800">Không có đăng ký nào đang chờ duyệt</p>
              <p className="mt-1 text-sm text-slate-500">Các đăng ký Coach và Lễ tân mới sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Ứng viên</th>
                    <th className="px-5 py-3 font-semibold">Vai trò</th>
                    <th className="px-5 py-3 font-semibold">Ngày đăng ký</th>
                    <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.map((registration) => {
                    const isProcessing = processingId === registration.userId;
                    return (
                      <tr key={registration.userId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{registration.fullName}</p>
                          <p className="mt-0.5 text-slate-500">{registration.email}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{registration.phone || 'Chưa cung cấp số điện thoại'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                            registration.role === 'COACH'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              registration.role === 'COACH' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}></span>
                            {registration.role === 'COACH' ? 'Huấn luyện viên' : 'Lễ tân'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-medium">{formatDate(registration.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleDecision(registration, 'reject')}
                              disabled={isProcessing}
                              className="rounded-xl border border-red-200 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(registration, 'approve')}
                              disabled={isProcessing}
                              className="rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                              {isProcessing ? 'Đang xử lý...' : 'Duyệt tài khoản'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </AdminLayout>
  );
}
