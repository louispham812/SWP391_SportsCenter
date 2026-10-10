import React from 'react';
import PortalLayout from './PortalLayout';
import { mockUsers } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export default function ReceptionistLayout({ children }) {
  const { showToast } = useApp();
  const receptionistMenu = [
    { label: 'Check-in tại quầy', path: '/receptionist', icon: 'how_to_reg' },
    { label: 'Bán hàng & Thu ngân POS', path: '/receptionist/pos', icon: 'point_of_sale' },
    { label: 'Tra cứu & Quản lý Hội viên', path: '/admin/members', icon: 'badge' },
    { label: 'Thời khóa biểu các lớp', path: '/member/schedule', icon: 'calendar_month' },
    { label: 'Báo cáo ca trực & Doanh thu', path: '/admin', icon: 'monitoring' },
  ];

  return (
    <PortalLayout
      role="receptionist"
      roleBadge="ELITE RECEPTION"
      currentUser={mockUsers.receptionist}
      menuItems={receptionistMenu}
      quickAction={{
        label: 'Quét Thẻ RFID',
        icon: 'qr_code_scanner',
        onClick: () => {
          showToast('Chế độ quét RFID', 'Đầu đọc thẻ RFID & máy quét QR đã kích hoạt sẵn sàng!', 'info');
        },
      }}
    >
      {children}
    </PortalLayout>
  );
}
