import React from 'react';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';

// Khai báo menu tĩnh ngoài component để tránh tái khởi tạo mảng khi re-render
const RECEPTIONIST_MENU = [
  { label: 'Check-in tại quầy', path: '/receptionist', icon: 'how_to_reg' },
  { label: 'Bán hàng & Thu ngân POS', path: '/receptionist/pos', icon: 'point_of_sale' },
  { label: 'Tra cứu & Quản lý Hội viên', path: '/admin/members', icon: 'badge' },
  { label: 'Thời khóa biểu các lớp', path: '/member/schedule', icon: 'calendar_month' },
  { label: 'Báo cáo ca trực & Doanh thu', path: '/admin', icon: 'monitoring' },
];

export default function ReceptionistLayout({ children }) {
  const { currentUser, showToast } = useApp();

  const handleQuickScan = () => {
    showToast(
      'Chế độ quét RFID',
      'Đầu đọc thẻ RFID & máy quét QR FPT đã kích hoạt sẵn sàng!',
      'info'
    );
  };

  return (
    <PortalLayout
      role="receptionist"
      roleBadge="FPT RECEPTION"
      currentUser={currentUser}
      menuItems={RECEPTIONIST_MENU}
      quickAction={{
        label: 'Quét Thẻ RFID',
        icon: 'qr_code_scanner',
        onClick: handleQuickScan,
      }}
    >
      {children}
    </PortalLayout>
  );
}