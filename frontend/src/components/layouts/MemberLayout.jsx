import React from 'react';
import PortalLayout from './PortalLayout';
import { mockUsers } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export default function MemberLayout({ children }) {
  const { showToast } = useApp();
  const memberMenu = [
    { label: 'Tổng quan hội viên', path: '/member', icon: 'dashboard' },
    { label: 'Lịch học & Đặt lớp', path: '/member/schedule', icon: 'calendar_month' },
    { label: 'Tiến độ & Trợ lý AI', path: '/member/ai-assistant', icon: 'smart_toy' },
    { label: 'Hồ sơ & Thẻ số', path: '/member/profile', icon: 'badge' },
    { label: 'Gói tập & Bảng giá', path: '/pricing', icon: 'card_membership' },
  ];

  return (
    <PortalLayout
      role="member"
      roleBadge="ELITE MEMBER"
      currentUser={mockUsers.member}
      menuItems={memberMenu}
      quickAction={{
        label: 'Mã Thẻ QR',
        icon: 'qr_code_scanner',
        onClick: () => {
          const qrBtn = document.getElementById('quick-qr-trigger');
          if (qrBtn) qrBtn.click();
          else showToast('Mã Check-in QR', 'Mã cá nhân của bạn là #ELT-8924. Vui lòng đưa trước máy quét tại quầy!', 'info');
        },
      }}
    >
      {children}
    </PortalLayout>
  );
}
