import React from 'react';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';

// Khai báo menu tĩnh bên ngoài component để tránh khởi tạo lại mảng mỗi lần re-render
const ADMIN_MENU = [
  { label: 'Tổng quan', path: '/admin', icon: 'grid_view' },
  { label: 'Gói tập & Dịch vụ', path: '/admin/packages', icon: 'card_membership' },
  { label: 'Lịch & Sân bãi', path: '/admin/facilities', icon: 'stadium' },
  { label: 'Nhân sự & Khách', path: '/admin/staff', icon: 'group' },
  { label: 'Quản lý Hội viên', path: '/admin/members', icon: 'shield_person' },
];

export default function AdminLayout({ children }) {
  const { currentUser, showToast } = useApp();

  const handleExportReport = () => {
    showToast(
      'Xuất Báo Cáo',
      'Đang tạo và tải xuống báo cáo vận hành FPT Sports Center...',
      'success'
    );
  };

  return (
    <PortalLayout
      role="admin"
      roleBadge="FPT ADMIN"
      currentUser={currentUser}
      menuItems={ADMIN_MENU}
      quickAction={{
        label: 'Xuất Báo Cáo',
        icon: 'download',
        onClick: handleExportReport,
      }}
    >
      {children}
    </PortalLayout>
  );
}