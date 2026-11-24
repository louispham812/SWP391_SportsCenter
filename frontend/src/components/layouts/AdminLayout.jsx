import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/apiClient';
import { exportToCsv } from '../../utils/csvExporter';

const toLocalDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toMondayStr = (date) => {
  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return toLocalDateStr(monday);
};

export default function AdminLayout({ children, dashboardQuickAction }) {
  const { currentUser, showToast } = useApp();
  const adminMenu = [
    {
      label: 'Tổng quan',
      path: '/admin',
      icon: 'grid_view',
      section: 'Vận hành & Cơ sở',
      mobilePin: true,
      mobileLabel: 'Tổng quan',
      subtitle: 'Doanh thu, hội viên và hoạt động lớp học',
    },
    {
      label: 'Lịch & Sân bãi',
      path: '/admin/facilities',
      icon: 'stadium',
      section: 'Vận hành & Cơ sở',
      mobilePin: true,
      mobileLabel: 'Sân bãi',
      subtitle: 'Lịch đặt cụm sân Pickleball, Tennis, Bể bơi',
    },
    {
      label: 'Quản lý lớp học',
      path: '/admin/classes',
      icon: 'calendar_month',
      section: 'Vận hành & Cơ sở',
      subtitle: 'Danh sách ca học nhóm theo bộ môn, dời giờ, đổi HLV và hủy ca',
    },
    {
      label: 'Tạo lịch lớp học',
      path: '/admin/classes/new',
      icon: 'event_available',
      section: 'Vận hành & Cơ sở',
      subtitle: 'Tạo lịch lớp, chọn sân, huấn luyện viên và học phí',
    },
    {
      label: 'Bảo trì sân bãi',
      path: '/admin/maintenance',
      icon: 'build',
      section: 'Vận hành & Cơ sở',
      subtitle: 'Quản lý lịch bảo trì sân bãi và thiết bị',
    },
    {
      label: 'Hạng hội viên & Quyền lợi',
      path: '/admin/packages',
      icon: 'card_membership',
      section: 'Vận hành & Cơ sở',
      subtitle: 'Cấu hình giá thẻ, thời hạn, quyền lợi',
    },
    {
      label: 'Duyệt & Phê duyệt',
      path: '/admin/staff-approvals',
      icon: 'how_to_reg',
      section: 'Nhân sự & Hội viên',
      mobilePin: true,
      mobileLabel: 'Phê duyệt',
      subtitle: 'Duyệt hoặc từ chối đăng ký Coach và Lễ tân',
    },
    {
      label: 'Quản lý Hội viên',
      path: '/admin/members',
      icon: 'shield_person',
      section: 'Nhân sự & Hội viên',
      mobilePin: true,
      mobileLabel: 'Hội viên',
      subtitle: 'Danh sách, trạng thái thẻ và hồ sơ hội viên',
    },
    {
      label: 'Quản lý nhân sự',
      path: '/admin/staff',
      icon: 'group',
      section: 'Nhân sự & Hội viên',
      subtitle: 'Danh sách HLV, lễ tân, quản lý và hiệu suất nhân sự',
    },
    {
      label: 'Xử lý Khiếu nại',
      path: '/admin/tickets',
      icon: 'support_agent',
      section: 'Nhân sự & Hội viên',
      subtitle: 'Theo dõi và phản hồi các ticket khiếu nại từ hội viên',
    },
    {
      label: 'Thông báo hàng loạt',
      path: '/admin/broadcast',
      icon: 'campaign',
      section: 'Tài chính & Hệ thống',
      subtitle: 'Gửi thông báo tới hội viên và nhân viên',
    },
    {
      label: 'Nhật ký hệ thống',
      path: '/admin/audit-logs',
      icon: 'history',
      section: 'Tài chính & Hệ thống',
      subtitle: 'Truy vết thao tác và nhật ký kiểm toán',
    },
    {
      label: 'Cài đặt & Phân quyền',
      path: '/admin/settings',
      icon: 'settings',
      section: 'Tài chính & Hệ thống',
      subtitle: 'Chính sách hệ thống, ma trận quyền và cấu hình AI',
    },
  ];

  return (
    <PortalLayout
      role="admin"
      roleBadge="F SPORT ADMIN"
      currentUser={currentUser}
      menuItems={adminMenu}
      quickAction={dashboardQuickAction || {
        label: 'Xuất Báo Cáo',
        icon: 'download',
        onClick: async () => {
          const today = new Date();
          const todayStr = toLocalDateStr(today);
          const weekStartStr = toMondayStr(today);
          try {
            const [report, schedule, checkIns] = await Promise.all([
              apiRequest(`/receptionist/report?date=${todayStr}`),
              apiRequest(`/bookings/receptionist-schedule?weekStart=${weekStartStr}`).catch(() => []),
              apiRequest('/receptionist/check-ins').catch(() => []),
            ]);
            const todayClasses = Array.isArray(schedule)
              ? schedule.filter((item) => item.startTime?.slice(0, 10) === todayStr)
              : [];
            const bookedSeats = todayClasses.reduce((sum, item) => sum + (item.bookedSlots || 0), 0);
            const maxSeats = todayClasses.reduce((sum, item) => sum + (item.maxSlots || 0), 0);
            const fillPercent = maxSeats > 0 ? ((bookedSeats / maxSeats) * 100).toFixed(1) : '0.0';
            const todayCheckIns = Array.isArray(checkIns)
              ? checkIns.filter((c) => String(c.checkedInAt || c.checkInTime || c.createdAt || '').slice(0, 10) === todayStr)
              : [];

            const rows = [
              ['BÁO CÁO VẬN HÀNH & DOANH THU TRUNG TÂM THỂ THAO F SPORT'],
              ['Ngày báo cáo', todayStr],
              ['Xuất lúc', today.toLocaleString('vi-VN')],
              [],
              ['CHỈ SỐ TỔNG QUAN', 'GIÁ TRỊ'],
              ['Tổng doanh thu trong ngày (VNĐ)', report?.totalRevenue ?? 0],
              ['Giao dịch hoàn tất', report?.completedPayments ?? 0],
              ['Hội viên mới trong ngày', report?.newMembers ?? 0],
              ['Lượt check-in cổng trong ngày', todayCheckIns.length],
              ['Tỷ lệ lấp đầy lớp hôm nay', `${fillPercent}%`],
              [],
              ['DOANH THU THEO PHƯƠNG THỨC THANH TOÁN', 'SỐ TIỀN (VNĐ)', 'SỐ GIAO DỊCH'],
              ...((report?.paymentMethods || []).length > 0
                ? report.paymentMethods.map((m) => [m.method || 'Khác', m.amount ?? 0, m.count ?? 0])
                : [['Chưa phát sinh giao dịch', 0, 0]]),
              [],
              ['LỊCH LỚP HỌC TRONG NGÀY', 'HLV', 'GIỜ BẮT ĐẦU', 'ĐÃ ĐẶT', 'TỐI ĐA'],
              ...((todayClasses.length > 0)
                ? todayClasses.map((c) => [
                    c.className || 'Lớp học',
                    c.coachName || 'Chưa gán',
                    c.startTime || '',
                    c.bookedSlots ?? 0,
                    c.maxSlots ?? 0,
                  ])
                : [['Không có lớp trong ngày', '', '', 0, 0]]),
            ];

            exportToCsv(`BaoCao_VanHanh_SportHub_${todayStr}.csv`, rows);
            showToast('Xuất báo cáo', `Đã tải xuống báo cáo vận hành thực tế ngày ${todayStr}.`, 'success');
          } catch (err) {
            showToast('Lỗi xuất báo cáo', err?.message || 'Không thể lấy dữ liệu báo cáo từ máy chủ.', 'error');
          }
        },
      }}
    >
      {children}
    </PortalLayout>
  );
}
