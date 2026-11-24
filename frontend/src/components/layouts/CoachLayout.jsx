import { useNavigate } from 'react-router-dom';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';

export default function CoachLayout({ children }) {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const coachMenu = [
    {
      label: 'Tổng quan',
      path: '/coach',
      icon: 'dashboard',
      section: 'Giảng dạy & Lớp học',
      mobilePin: true,
      mobileLabel: 'Tổng quan',
      subtitle: 'Bảng điều khiển HLV, ca dạy hôm nay và hiệu suất',
    },
    {
      label: 'Lịch giảng dạy tuần',
      path: '/coach/schedule',
      icon: 'calendar_month',
      section: 'Giảng dạy & Lớp học',
      mobilePin: true,
      mobileLabel: 'Lịch dạy',
      subtitle: 'Lịch ca dạy theo tuần và khai báo khung giờ rảnh nhận lớp',
    },
    {
      label: 'Đơn xin nghỉ & đổi ca',
      path: '/coach/leave',
      icon: 'free_cancellation',
      section: 'Giảng dạy & Lớp học',
      subtitle: 'Gửi đơn xin nghỉ phép, đổi ca và theo dõi phê duyệt',
    },
    {
      label: 'Điểm danh & Nhận xét',
      path: '/coach/attendance',
      icon: 'fact_check',
      section: 'Giảng dạy & Lớp học',
      mobilePin: true,
      mobileLabel: 'Điểm danh',
      subtitle: 'Ghi nhận chuyên cần, gửi bài tập về nhà',
    },
    {
      label: 'Học viên của tôi',
      path: '/coach/students',
      icon: 'groups',
      section: 'Giảng dạy & Lớp học',
      mobilePin: true,
      mobileLabel: 'Học viên',
      subtitle: 'Hồ sơ học viên, mục tiêu thể chất PAR-Q',
    },
    {
      label: 'Thù lao & Doanh thu',
      path: '/coach/income',
      icon: 'payments',
      section: 'Thu nhập & Hồ sơ',
      subtitle: 'Theo dõi thu nhập buổi dạy, hoa hồng và bảng kê đối soát',
    },
    {
      label: 'Đánh giá từ học viên',
      path: '/coach/reviews',
      icon: 'star',
      section: 'Thu nhập & Hồ sơ',
      subtitle: 'Xem nhận xét và xếp hạng từ học viên',
    },
    {
      label: 'Thông báo lịch dạy',
      path: '/coach/notifications',
      icon: 'notifications',
      section: 'Thu nhập & Hồ sơ',
      subtitle: 'Cập nhật lịch dạy, đăng ký mới và nhắc nhở',
    },
    {
      label: 'Hồ sơ & Thẻ HLV',
      path: '/coach/profile',
      icon: 'badge',
      section: 'Thu nhập & Hồ sơ',
      subtitle: 'Thông tin cá nhân, thẻ số HLV, chuyên môn và bằng cấp',
    },
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
