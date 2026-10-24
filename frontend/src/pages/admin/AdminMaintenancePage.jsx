import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  createMaintenance,
  deleteMaintenance,
  getMaintenanceList,
} from '../../services/engagementApi';
import { apiRequest } from '../../services/apiClient';

// MGR-19: Quản lý bảo trì sân bãi (lưu DB, chặn đặt sân trong khung bảo trì)
export default function AdminMaintenancePage() {
  const [courts, setCourts] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ courtId: '', startTime: '', endTime: '', reason: '' });
  const [status, setStatus] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    try {
      const [courtList, maintenance] = await Promise.all([
        apiRequest('/manager/courts'),
        getMaintenanceList(),
      ]);
      setCourts(courtList);
      setItems(maintenance);
    } catch (err) {
      setStatus({ type: 'err', text: err.message || 'Không tải được dữ liệu.' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const courtName = (id) => courts.find((c) => c.courtId === id)?.courtName || `Sân #${id}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', text: '' });
    try {
      await createMaintenance({ ...form, courtId: Number(form.courtId) });
      setStatus({ type: 'ok', text: 'Đã tạo lịch bảo trì. Sân sẽ không đặt được trong khung giờ này.' });
      setForm({ courtId: '', startTime: '', endTime: '', reason: '' });
      load();
    } catch (err) {
      setStatus({ type: 'err', text: err.message || 'Tạo lịch bảo trì thất bại.' });
    }
  };

  const handleDelete = async (id) => {
    await deleteMaintenance(id).catch((err) => setStatus({ type: 'err', text: err.message }));
    load();
  };

  const field = 'w-full rounded-lg border border-slate-200 p-2 text-sm';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-primary uppercase">Bảo trì sân bãi</h1>
        <form onSubmit={handleSubmit} className="max-w-2xl grid gap-3 md:grid-cols-2">
          <select required value={form.courtId} onChange={(e) => setForm({ ...form, courtId: e.target.value })} className={`${field} md:col-span-2`}>
            <option value="">-- Chọn sân --</option>
            {courts.map((c) => <option key={c.courtId} value={c.courtId}>{c.courtName}</option>)}
          </select>
          <input required type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={field} />
          <input required type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={field} />
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Lý do bảo trì" className={`${field} md:col-span-2`} />
          {status.text && (
            <p className={`md:col-span-2 p-3 rounded-lg text-sm ${status.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.text}</p>
          )}
          <button type="submit" className="md:col-span-2 py-2 px-6 rounded-xl bg-primary text-white text-xs font-bold uppercase cursor-pointer">Tạo lịch bảo trì</button>
        </form>
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.maintenanceId} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3 text-sm">
              <div>
                <p className="font-bold">{courtName(m.courtId)}</p>
                <p className="text-slate-600">{new Date(m.startTime).toLocaleString('vi-VN')} → {new Date(m.endTime).toLocaleString('vi-VN')}</p>
                {m.reason && <p className="text-slate-500">{m.reason}</p>}
              </div>
              <button type="button" onClick={() => handleDelete(m.maintenanceId)} className="text-xs font-bold text-red-600 hover:underline cursor-pointer">Xóa</button>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-slate-500">Chưa có lịch bảo trì.</li>}
        </ul>
      </div>
    </AdminLayout>
  );
}
