import React from 'react';
import { useNavigate } from 'react-router-dom';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';

export default function CoachLayout({ children }) {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const coachMenu = [
    { label: 'Lịch giảng dạy tuần', path: '/coach', icon: 'calendar_month' },
    { label: 'Học viên của tôi', path: '/coach/students', icon: 'groups' },
    { label: 'Điểm danh & Nhận xét', path: '/coach/attendance', icon: 'fact_check' },
    { label: 'Lịch toàn trung tâm', path: '/member/schedule', icon: 'stadium' },
  ];

  return (
    <PortalLayout
      role="coach"
      roleBadge="F SPORT COACH"
      currentUser={currentUser}
      menuItems={coachMenu}
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
