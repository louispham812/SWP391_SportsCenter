import { useNavigate } from 'react-router-dom';
import PortalLayout from './PortalLayout';
import { useApp } from '../../context/AppContext';

export default function MemberLayout({ children }) {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const memberMenu = [
    {
      label: 'Tổng quan',
      path: '/member',
      icon: 'dashboard',
      section: 'Hoạt động & Đặt lịch',
      mobilePin: true,
      mobileLabel: 'Tổng quan',
      subtitle: 'Bảng điều khiển cá nhân, lịch tập hôm nay',
    },
    {
      label: 'Đặt sân thể thao',
      path: '/member/book/court/sports',
      icon: 'sports_tennis',
      section: 'Hoạt động & Đặt lịch',
      mobilePin: true,
      mobileLabel: 'Đặt sân',
      subtitle: 'Chọn môn thể thao, sân, khung giờ và thanh toán',
    },
    {
      label: 'Đăng ký lớp học',
      path: '/member/classes',
      icon: 'school',
      section: 'Hoạt động & Đặt lịch',
      mobilePin: true,
      mobileLabel: 'Lớp học',
      subtitle: 'Đăng ký và hủy lịch lớp học thể thao theo kỳ',
    },
    {
      label: 'Thời khóa biểu của tôi',
      path: '/member/schedule',
      icon: 'calendar_month',
      section: 'Hoạt động & Đặt lịch',
      mobilePin: true,
      mobileLabel: 'Lịch tập',
      subtitle: 'Lịch sân và lịch lớp đã thanh toán',
    },
    {
      label: 'Lịch sử điểm danh',
      path: '/member/attendance',
      icon: 'fact_check',
      section: 'Tập luyện & AI',
      subtitle: 'Chuyên cần buổi học và lượt quét cổng RFID',
    },
    {
      label: 'Kế hoạch & Nhận xét HLV',
      path: '/member/workout-plans',
      icon: 'monitor_weight',
      section: 'Tập luyện & AI',
      subtitle: 'Chỉ số InBody, mục tiêu và phản hồi HLV',
    },
    {
      label: 'Trợ lý AI thể thao',
      path: '/member/ai-assistant',
      icon: 'smart_toy',
      section: 'Tập luyện & AI',
      subtitle: 'Gợi ý bài tập AI, phân tích InBody',
    },
    {
      label: 'Đánh giá HLV & lớp học',
      path: '/member/reviews',
      icon: 'star',
      section: 'Tập luyện & AI',
      subtitle: 'Gửi nhận xét về lớp học và huấn luyện viên',
    },
    {
      label: 'Hạng hội viên & Quyền lợi',
      path: '/member/packages',
      icon: 'card_membership',
      section: 'Gói tập & Tài khoản',
      subtitle: 'Xem gói tập, gia hạn và nâng cấp thẻ',
    },
    {
      label: 'Thông báo & Nhắc nhở',
      path: '/member/notifications',
      icon: 'notifications',
      section: 'Gói tập & Tài khoản',
      subtitle: 'Lịch học sắp tới, hạn gói thẻ, nhận xét',
    },
    {
      label: 'Lịch sử giao dịch',
      path: '/member/transactions',
      icon: 'account_balance_wallet',
      section: 'Gói tập & Tài khoản',
      subtitle: 'Biên lai điện tử, hoàn tiền và chi tiêu',
    },
    {
      label: 'Khiếu nại & Hỗ trợ',
      path: '/member/tickets',
      icon: 'support_agent',
      section: 'Gói tập & Tài khoản',
      subtitle: 'Gửi khiếu nại và theo dõi phản hồi từ trung tâm',
    },
    {
      label: 'Hồ sơ & Thẻ số',
      path: '/member/profile',
      icon: 'badge',
      section: 'Gói tập & Tài khoản',
      subtitle: 'Mã QR check-in, thông tin cá nhân',
    },
  ];

  return (
    <PortalLayout
      role="member"
      roleBadge="F SPORT MEMBER"
      currentUser={currentUser}
      menuItems={memberMenu}
      quickAction={{
        label: 'Đặt Sân Ngay',
        icon: 'sports_tennis',
        onClick: () => navigate('/member/book/court/sports'),
      }}
    >
      {children}
    </PortalLayout>
  );
}
