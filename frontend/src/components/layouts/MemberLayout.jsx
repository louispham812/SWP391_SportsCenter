import React from 'react';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';

export default function MemberLayout({ children }) {
  const { currentUser } = useApp();
  const memberMenu = [
    { label: 'Tổng quan hội viên', path: '/member', icon: 'dashboard' },
    { label: 'Đặt sân chơi', path: '/member/book/court/sports', icon: 'sports_tennis' },
    { label: 'Booking lớp học', path: '/member/book/class/sports', icon: 'fitness_center' },
    { label: 'Thời khóa biểu của tôi', path: '/member/schedule', icon: 'calendar_month' },
    { label: 'Tiến độ & Trợ lý AI', path: '/member/ai-assistant', icon: 'smart_toy' },
    { label: 'Hồ sơ & Thẻ số', path: '/member/profile', icon: 'badge' },
    { label: 'Gói tập & Bảng giá', path: '/pricing', icon: 'card_membership' },
  ];

  return (
    <PortalLayout
      role="member"
      roleBadge="F SPORT MEMBER"
      currentUser={currentUser}
      menuItems={memberMenu}
    >
      {children}
    </PortalLayout>
  );
}
