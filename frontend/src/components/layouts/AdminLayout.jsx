import React from 'react';
import PortalLayout from './PortalLayout';
import { mockUsers } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export default function AdminLayout({ children }) {
  const { showToast } = useApp();
  const adminMenu = [
    { label: 'Tổng quan', path: '/admin', icon: 'grid_view' },
    { label: 'Gói tập & Dịch vụ', path: '/admin/packages', icon: 'card_membership' },
    { label: 'Lịch & Sân bãi', path: '/admin/facilities', icon: 'stadium' },
    { label: 'Nhân sự & Khách', path: '/admin/staff', icon: 'group' },
    { label: 'Quản lý Hội viên', path: '/admin/members', icon: 'shield_person' },
  ];

  return (
    <PortalLayout
      role="admin"
      roleBadge="ELITE ADMIN"
      currentUser={mockUsers.admin}
      menuItems={adminMenu}
      quickAction={{
        label: 'Xuất Báo Cáo',
        icon: 'download',
        onClick: () => {
          showToast('Xuất báo cáo PDF/Excel', 'Đang tạo và tải xuống bản báo cáo vận hành trung tâm Tháng 11/2026...', 'success');
        },
      }}
    >
      {children}
    </PortalLayout>
  );
}
