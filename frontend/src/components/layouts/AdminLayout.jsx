import React from 'react';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';

export default function AdminLayout({ children }) {
  const { currentUser, showToast } = useApp();
  const adminMenu = [
    { label: 'Tổng quan', path: '/admin', icon: 'grid_view' },
    { label: 'Gói tập & Dịch vụ', path: '/admin/packages', icon: 'card_membership' },
    { label: 'Lịch & Sân bãi', path: '/admin/facilities', icon: 'stadium' },
    { label: 'Nhân sự & Khách', path: '/admin/staff', icon: 'group' },
    { label: 'Duyệt & Phê duyệt', path: '/admin/staff-approvals', icon: 'how_to_reg' },
    { label: 'Quản lý Hội viên', path: '/admin/members', icon: 'shield_person' },
    { label: 'Cài đặt & Phân quyền', path: '/admin/settings', icon: 'settings' },
  ];

  return (
    <PortalLayout
      role="admin"
      roleBadge="F SPORT ADMIN"
      currentUser={currentUser}
      menuItems={adminMenu}
      quickAction={{
        label: 'Xuất Báo Cáo',
        icon: 'download',
        onClick: () => {
          showToast('Xuất báo cáo', 'Đang kết xuất và tải xuống bản báo cáo vận hành trung tâm...', 'success');
          const csvContent = "\uFEFF" + 
            "BÁO CÁO VẬN HÀNH & DOANH THU TRUNG TÂM THỂ THAO SPORT HUB\n" +
            "Ngày xuất," + new Date().toLocaleDateString('vi-VN') + "\n\n" +
            "CHỈ SỐ TỔNG QUAN,GIÁ TRỊ\n" +
            "Tổng doanh thu tháng,158.450.000 VNĐ\n" +
            "Hội viên mới,42 hội viên\n" +
            "Tổng lượt check-in qua cổng,586 lượt\n" +
            "Tỷ lệ lấp đầy sân & lớp,88.5%\n\n" +
            "DOANH THU THEO PHƯƠNG THỨC THANH TOÁN,SỐ TIỀN,SỐ LƯỢNG GIAO DỊCH\n" +
            "Chuyển khoản VietQR,94.200.000 VNĐ,142\n" +
            "Tiền mặt tại quầy POS,38.150.000 VNĐ,58\n" +
            "Thẻ ngân hàng / POS,26.100.000 VNĐ,35\n";
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `BaoCao_VanHanh_SportHub_${new Date().toISOString().slice(0, 10)}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        },
      }}
    >
      {children}
    </PortalLayout>
  );
}
