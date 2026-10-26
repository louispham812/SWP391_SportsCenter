import React, { useState } from 'react';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/apiClient';

export default function ReceptionistLayout({ children }) {
  const { currentUser, showToast } = useApp();
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [rfidCode, setRfidCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const receptionistMenu = [
    { label: 'Check-in tại quầy', path: '/receptionist', icon: 'how_to_reg' },
    { label: 'Bán hàng & Thu ngân POS', path: '/receptionist/pos', icon: 'point_of_sale' },
    { label: 'Mượn & Thuê Dụng Cụ', path: '/receptionist/equipment', icon: 'sports_tennis' },
    { label: 'Tra cứu & Quản lý Hội viên', path: '/receptionist/members', icon: 'badge' },
    { label: 'Thời khóa biểu các lớp', path: '/receptionist/classes', icon: 'calendar_month' },
    { label: 'Báo cáo ca trực & Doanh thu', path: '/receptionist/shift', icon: 'monitoring' },
  ];

  const handleSimulateScan = async (memberId, memberName) => {
    setIsScanning(true);
    try {
      const res = await apiRequest('/receptionist/check-ins', {
        method: 'POST',
        body: JSON.stringify({ memberId }),
      });
      showToast(
        res.result === 'VALID' ? 'Check-in Thành Công' : 'Từ Chối Check-in',
        res.result === 'VALID'
          ? `Hội viên ${memberName || res.memberName} quẹt thẻ RFID hợp lệ. Cửa từ đã mở!`
          : `Thẻ RFID của ${memberName || res.memberName} không đủ điều kiện vào tập.`,
        res.result === 'VALID' ? 'success' : 'warning'
      );
      setShowRfidModal(false);
      setRfidCode('');
    } catch (err) {
      showToast('Lỗi quét thẻ', err.message || 'Không thể ghi nhận check-in RFID.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <>
      <PortalLayout
        role="receptionist"
        roleBadge="F SPORT RECEPTION"
        currentUser={currentUser}
        menuItems={receptionistMenu}
        quickAction={{
          label: 'Quét Thẻ RFID',
          icon: 'qr_code_scanner',
          onClick: () => setShowRfidModal(true),
        }}
      >
        {children}
      </PortalLayout>

      {/* RFID Scanner Simulation Modal */}
      {showRfidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Quét Thẻ RFID / Mã QR Cổng</h3>
                  <p className="text-[11px] text-slate-500">Giả lập đầu đọc thẻ RFID 13.56MHz tại quầy lễ tân</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRfidModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="rounded-2xl bg-slate-950 p-5 text-white text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-3xl text-emerald-400">sensors</span>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Đầu đọc thẻ đang chờ tín hiệu</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Đặt thẻ hội viên vào vùng cảm ứng hoặc chọn hội viên bên dưới</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-700">Quẹt nhanh thẻ mẫu (Demo RFID):</label>
              <div className="space-y-2">
                {[
                  { id: 9, name: 'Nguyễn Anh Khoa', code: 'RFID-KHOA-009', desc: 'Gói VIP Active · Hợp lệ' },
                  { id: 10, name: 'Hoàng Thị Ngọc', code: 'RFID-NGOC-010', desc: 'Thẻ Hội Viên Mẫu · Hợp lệ' },
                  { id: 11, name: 'Bùi Huy Hoàng', code: 'RFID-HOANG-011', desc: 'Hội Viên Tennis' },
                ].map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    disabled={isScanning}
                    onClick={() => handleSimulateScan(demo.id, demo.name)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 flex items-center justify-between text-left transition cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{demo.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{demo.code} · {demo.desc}</div>
                    </div>
                    <span className="material-symbols-outlined text-orange-500 text-[18px]">contactless</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
