import React from 'react';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';

export default function MemberLayout({ children }) {
  const { currentUser } = useApp();
  const memberMenu = [
    { label: 'Tổng quan hội viên', path: '/member', icon: 'dashboard' },
    { label: 'Gói tập & Quyền lợi', path: '/member/packages', icon: 'card_membership' },
    { label: 'Đăng ký lớp học', path: '/member/classes', icon: 'school' },
    { label: 'Đặt sân thể thao', path: '/member/book/court/sports', icon: 'sports_tennis' },
    { label: 'Thời khóa biểu của tôi', path: '/member/schedule', icon: 'calendar_month' },
    { label: 'Lịch sử điểm danh', path: '/member/attendance', icon: 'fact_check' },
    { label: 'Kế hoạch & Nhận xét HLV', path: '/member/workout-plans', icon: 'monitor_weight' },
    { label: 'Trợ lý AI thể thao', path: '/member/ai-assistant', icon: 'smart_toy' },
    { label: 'Thông báo & Nhắc nhở', path: '/member/notifications', icon: 'notifications' },
    { label: 'Đánh giá HLV & lớp học', path: '/member/reviews', icon: 'star' },
    { label: 'Lịch sử giao dịch', path: '/member/transactions', icon: 'account_balance_wallet' },
    { label: 'Hồ sơ & Thẻ số', path: '/member/profile', icon: 'badge' },
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
