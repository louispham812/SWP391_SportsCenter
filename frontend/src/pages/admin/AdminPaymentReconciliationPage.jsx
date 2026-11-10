import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { apiRequest } from '../../services/apiClient';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

export default function AdminPaymentReconciliationPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(null);
  const load = useCallback(async () => {
    try { setRows(await apiRequest('/manager/payment-reconciliation')); }
    catch (err) { setError(err.message || 'Không tải được khoản thu cần đối soát.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const refund = async (row) => {
    setBusy(row.receiptId); setError(''); setMessage('');
    try {
      const result = await apiRequest(`/manager/payment-reconciliation/${row.receiptId}/refund`, { method: 'POST' });
      setMessage(result.status === 'REFUNDED'
        ? `Gateway đã xác nhận hoàn ${money(row.amount)} cho khoản thu #${row.receiptId}.`
        : 'Chưa có xác nhận hoàn tiền. Khoản thu được giữ để đối soát thủ công; không gửi hoàn lại.');
      await load();
    } catch (err) { setError(err.message || 'Không xử lý được khoản thu.'); }
    finally { setBusy(null); }
  };

  return (
    <AdminLayout>
      <main className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-900">Đối soát thanh toán dư</h1>
          <button type="button" onClick={load} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold">Tải lại</button>
        </div>
        <p className="text-sm text-slate-600">Các khoản nhận thêm cho đơn đã thanh toán hoặc hoàn tiền. Hoàn khoản dư không hủy đơn và không thay đổi quyền lợi đã cấp.</p>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-blue-50 p-3 text-blue-900">{message}</p>}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50"><tr><th className="p-3">Đơn / Khoản thu</th><th className="p-3">Mã VNPay</th><th className="p-3">Số tiền</th><th className="p-3">Tình trạng</th><th className="p-3">Xử lý</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.receiptId} className="border-t border-slate-200">
              <td className="p-3">Đơn #{row.paymentId} / Thu #{row.receiptId}</td>
              <td className="p-3">{row.gatewayTransactionNo}<div className="text-xs text-slate-500">{row.gatewayReference}</div></td>
              <td className="p-3 font-semibold">{money(row.amount)}</td>
              <td className="p-3">{row.status === 'EXCESS' ? 'Khoản dư chờ xử lý' : 'Cần đối soát thủ công'}<p className="max-w-sm text-xs text-slate-500">{row.reconciliationNote}</p></td>
              <td className="p-3">{row.status === 'EXCESS' && !row.transactionDate && <span className="text-xs text-amber-800">Thiếu thời điểm khởi tạo giao dịch gốc; cần đối soát chứng từ.</span>}{row.status === 'EXCESS' && row.transactionDate && <button type="button" disabled={busy !== null} onClick={() => refund(row)} className="rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white disabled:opacity-50">{busy === row.receiptId ? 'Đang xử lý...' : `Hoàn khoản dư ${money(row.amount)}`}</button>}</td>
            </tr>)}</tbody>
          </table>
          {rows.length === 0 && <p className="p-5 text-sm text-slate-500">Không có khoản thu cần đối soát.</p>}
        </div>
      </main>
    </AdminLayout>
  );
}
