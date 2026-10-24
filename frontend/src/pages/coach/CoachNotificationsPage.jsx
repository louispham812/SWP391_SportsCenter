import React from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import NotificationList from '../../components/common/NotificationList';

// COA-16: Nhận thông báo lịch dạy
export default function CoachNotificationsPage() {
  return (
    <CoachLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-primary uppercase">Thông báo lịch dạy</h1>
        <NotificationList title="Thông báo của tôi" />
      </div>
    </CoachLayout>
  );
}
