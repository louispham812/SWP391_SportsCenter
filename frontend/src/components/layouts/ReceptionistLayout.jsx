import { useEffect, useState } from 'react';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/apiClient';

export default function ReceptionistLayout({ children }) {
  const { currentUser, showToast } = useApp();
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [rfidCandidates, setRfidCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!showRfidModal) return;
    let active = true;
    setLoadingCandidates(true);
    apiRequest('/receptionist/members?query=&page=0&size=8')
      .then((res) => {
        if (!active) return;
        const rows = Array.isArray(res?.content) ? res.content : [];
        const sorted = [...rows].sort((a, b) => (b.rfidCode ? 1 : 0) - (a.rfidCode ? 1 : 0));
        setRfidCandidates(sorted.slice(0, 4));
      })
      .catch(() => {
        if (active) setRfidCandidates([]);
      })
      .finally(() => {
        if (active) setLoadingCandidates(false);
      });
    return () => {
      active = false;
    };
  }, [showRfidModal]);

  const receptionistMenu = [
    {
      label: 'Tổng quan',
      path: '/receptionist',
      icon: 'dashboard',
      section: 'Quầy lễ tân & POS',
      mobilePin: true,
      mobileLabel: 'Tổng quan',
      subtitle: 'Bảng vận hành trung tâm, theo dõi check-in và doanh thu ca',
    },
    {
      label: 'Check-in tại quầy',
      path: '/receptionist/checkin',
      icon: 'how_to_reg',
      section: 'Quầy lễ tân & POS',
      mobilePin: true,
      mobileLabel: 'Check-in',
      subtitle: 'Quét thẻ RFID, tìm kiếm hội viên, mở cổng tự động',
    },
    {
      label: 'Bán hàng & Thu ngân POS',
      path: '/receptionist/pos',
      icon: 'point_of_sale',
      section: 'Quầy lễ tân & POS',
      mobilePin: true,
      mobileLabel: 'Bán POS',
      subtitle: 'Bán gói tập, nước uống, thiết bị thể thao',
    },
    {
      label: 'Mượn & Thuê Dụng Cụ',
      path: '/receptionist/equipment',
      icon: 'sports_tennis',
      section: 'Quầy lễ tân & POS',
      subtitle: 'Quản lý mượn trả vợt, bóng và dụng cụ tại quầy',
    },
    {
      label: 'Tra cứu & Quản lý Hội viên',
      path: '/receptionist/members',
      icon: 'badge',
      section: 'Hội viên & Vận hành ca',
      mobilePin: true,
      mobileLabel: 'Hội viên',
      subtitle: 'Tra cứu thông tin, thẻ số và gia hạn hội viên',
    },
    {
      label: 'Thời khóa biểu các lớp',
      path: '/receptionist/classes',
      icon: 'calendar_month',
      section: 'Hội viên & Vận hành ca',
      subtitle: 'Theo dõi lịch lớp học, đăng ký hộ và hủy lớp học viên',
    },
    {
      label: 'Hỗ trợ & Khiếu nại',
      path: '/receptionist/tickets',
      icon: 'support_agent',
      section: 'Hội viên & Vận hành ca',
      subtitle: 'Tiếp nhận, tạo mới và xử lý ticket khiếu nại hội viên',
    },
    {
      label: 'Báo cáo ca trực & Doanh thu',
      path: '/receptionist/shift',
      icon: 'monitoring',
      section: 'Hội viên & Vận hành ca',
      subtitle: 'Tổng hợp thu chi tiền mặt, VNPay và bàn giao ca',
    },
    {
      label: 'Hồ sơ cá nhân',
      path: '/receptionist/profile',
      icon: 'account_circle',
      section: 'Hội viên & Vận hành ca',
      subtitle: 'Mã QR nhân viên, thẻ định danh ca trực và bảo mật tài khoản',
    },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 !m-0">
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
              <label className="text-xs font-bold uppercase text-slate-700">Quẹt nhanh thẻ hội viên trên hệ thống:</label>
              <div className="space-y-2">
                {loadingCandidates ? (
                  <p className="text-xs text-slate-500 py-2">Đang tải danh sách thẻ RFID...</p>
                ) : rfidCandidates.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">Chưa có hội viên phù hợp trong hệ thống.</p>
                ) : (
                  rfidCandidates.map((demo) => (
                    <button
                      key={demo.userId}
                      type="button"
                      disabled={isScanning}
                      onClick={() => handleSimulateScan(demo.userId, demo.fullName)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{demo.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {demo.rfidCode || `SPORTHUB-MEMBER-${demo.userId}`} · {demo.activePackageName || 'Chưa có gói'}
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-orange-500 text-[18px]">contactless</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
