import React from 'react';
import { useNavigate } from 'react-router-dom';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';

// Khai báo menu tĩnh đầy đủ các mục phân hệ Coach
const COACH_MENU = [
  { label: 'Trang chủ tổng quan', path: '/coach', icon: 'dashboard' },
  { label: 'Lịch giảng dạy tuần', path: '/coach/schedule', icon: 'calendar_month' },
  { label: 'Học viên của tôi', path: '/coach/students', icon: 'groups' },
  { label: 'Điểm danh & Nhận xét', path: '/coach/attendance', icon: 'fact_check' },
  { label: 'Thông tin cá nhân', path: '/coach/profile', icon: 'person' }, // BỔ SUNG MỚI
  { label: 'Lịch toàn trung tâm', path: '/member/schedule', icon: 'stadium' },
];

export default function CoachLayout({ children }) {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  return (
    <PortalLayout
      role="coach"
      roleBadge="FPT COACH"
      currentUser={currentUser}
      menuItems={COACH_MENU}
      quickAction={{
        label: 'Điểm Danh Ca Dạy',
        icon: 'fact_check',
        onClick: () => navigate('/coach/attendance'),
      }}
    >
      {children}
    </PortalLayout>
  );
}