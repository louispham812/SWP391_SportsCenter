import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import FacilitiesPage from './pages/FacilitiesPage';
import PricingPage from './pages/PricingPage';
import AuthPage from './pages/AuthPage';
import PublicContentPage from './pages/PublicContentPage';

// Member Portal Pages
import MemberDashboardPage from './pages/member/MemberDashboardPage';
import MemberSchedulePage from './pages/member/MemberSchedulePage';
import MemberClassBookingPage from './pages/member/MemberClassBookingPage';
import MemberCheckoutPage from './pages/member/MemberCheckoutPage';
import MemberOrdersPage from './pages/member/MemberOrdersPage';
import MemberAttendanceHistoryPage from './pages/member/MemberAttendanceHistoryPage';
import MemberWorkoutPlanPage from './pages/member/MemberWorkoutPlanPage';
import MemberMembershipPage from './pages/member/MemberMembershipPage';
import MemberAIAssistantPage from './pages/member/MemberAIAssistantPage';
import MemberProfilePage from './pages/member/MemberProfilePage';
import MemberPlaceholderPage from './pages/member/MemberPlaceholderPage';

// Receptionist Portal Pages
import ReceptionCheckInPage from './pages/receptionist/ReceptionCheckInPage';
import ReceptionPOSPage from './pages/receptionist/ReceptionPOSPage';

// Coach Portal Pages (ĐÃ BỔ SUNG ĐẦY ĐỦ VÀ ĐỒNG BỘ)
import CoachDashboardPage from './pages/coach/CoachDashboardPage';
import CoachSchedulePage from './pages/coach/CoachSchedulePage';
import CoachStudentsPage from './pages/coach/CoachStudentsPage';
import CoachAttendancePage from './pages/coach/CoachAttendancePage';
import CoachProfilePage from './pages/coach/CoachProfilePage';

// Admin / Manager Portal Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMembersPage from './pages/admin/AdminMembersPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminFacilitiesPage from './pages/admin/AdminFacilitiesPage';
import AdminPackagesPage from './pages/admin/AdminPackagesPage';

import ToastContainer from './components/ToastContainer';
import { AppProvider, useApp } from './context/AppContext';

function RequireRole({ role, children }) {
  const { currentUser, currentRole } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (currentRole !== role) {
    return <Navigate to={`/${currentRole || 'login'}`} replace />;
  }
  return children;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/sports" element={<PublicContentPage contentType="sports" />} />
          <Route path="/sports/:slug" element={<PublicContentPage contentType="sports" />} />
          <Route path="/facilities/:slug" element={<PublicContentPage contentType="facilities" />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Member Routes */}
          <Route path="/member" element={<RequireRole role="member"><MemberDashboardPage /></RequireRole>} />
          <Route path="/member/schedule" element={<RequireRole role="member"><MemberSchedulePage /></RequireRole>} />
          <Route path="/member/classes" element={<RequireRole role="member"><MemberClassBookingPage /></RequireRole>} />
          <Route path="/member/checkout" element={<RequireRole role="member"><MemberCheckoutPage /></RequireRole>} />
          <Route path="/member/orders" element={<RequireRole role="member"><MemberOrdersPage /></RequireRole>} />
          <Route path="/member/membership" element={<RequireRole role="member"><MemberMembershipPage /></RequireRole>} />
          <Route path="/member/ai-assistant" element={<RequireRole role="member"><MemberAIAssistantPage /></RequireRole>} />
          <Route path="/member/profile" element={<RequireRole role="member"><MemberProfilePage /></RequireRole>} />
          <Route path="/member/attendance" element={<RequireRole role="member"><MemberAttendanceHistoryPage /></RequireRole>} />
          <Route path="/member/workout-plan" element={<RequireRole role="member"><MemberWorkoutPlanPage /></RequireRole>} />
          <Route path="/member/court-booking" element={<RequireRole role="member"><MemberPlaceholderPage title="Đặt Sân Tự Do & Chia Tiền Sân" icon="stadium" desc="Sơ đồ chọn sân Pickleball, Cầu Lông, Tennis theo giờ thực & mời bạn cùng chia tiền." /></RequireRole>} />
          <Route path="/member/wallet" element={<RequireRole role="member"><MemberPlaceholderPage title="Ví FPT Pay & Tích Điểm F-Points" icon="account_balance_wallet" desc="Nạp tiền trước thanh toán 1-click, lưu tiền hoàn ca tập & đổi điểm chuyên cần lấy quà." /></RequireRole>} />
          <Route path="/member/matchmaking" element={<RequireRole role="member"><MemberPlaceholderPage title="Ghép Đội & Giải Đấu Nội Bộ" icon="groups" desc="Tìm bạn tập cùng trình độ, đăng ký giải đấu FPT Open và bảng xếp hạng ELO." /></RequireRole>} />
          <Route path="/member/analytics" element={<RequireRole role="member"><MemberPlaceholderPage title="Thống Kê Thể Trạng & InBody" icon="analytics" desc="Biểu đồ theo dõi tiến độ cân nặng, tỷ lệ mỡ, khối lượng cơ và tổng lượng calo tiêu hao." /></RequireRole>} />
          <Route path="/member/reviews" element={<RequireRole role="member"><MemberPlaceholderPage title="Đánh Giá HLV & Chất Lượng Lớp" icon="star" desc="Đánh giá sao và gửi phản hồi sau các ca tập để nâng cao chất lượng trung tâm." /></RequireRole>} />

          {/* Receptionist Routes */}
          <Route path="/receptionist" element={<RequireRole role="receptionist"><ReceptionCheckInPage /></RequireRole>} />
          <Route path="/receptionist/pos" element={<RequireRole role="receptionist"><ReceptionPOSPage /></RequireRole>} />
          <Route path="/receptionist/members" element={<RequireRole role="receptionist"><ReceptionCheckInPage /></RequireRole>} />
          <Route path="/receptionist/shift" element={<RequireRole role="receptionist"><ReceptionPOSPage /></RequireRole>} />

          {/* Coach Routes (ĐÃ CHUẨN HÓA LOGIC ROUTING) */}
          <Route path="/coach" element={<RequireRole role="coach"><CoachDashboardPage /></RequireRole>} />
          <Route path="/coach/schedule" element={<RequireRole role="coach"><CoachSchedulePage /></RequireRole>} />
          <Route path="/coach/students" element={<RequireRole role="coach"><CoachStudentsPage /></RequireRole>} />
          <Route path="/coach/attendance" element={<RequireRole role="coach"><CoachAttendancePage /></RequireRole>} />
          <Route path="/coach/income" element={<RequireRole role="coach"><CoachDashboardPage /></RequireRole>} />
          <Route path="/coach/profile" element={<RequireRole role="coach"><CoachProfilePage /></RequireRole>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<RequireRole role="admin"><AdminDashboardPage /></RequireRole>} />
          <Route path="/admin/members" element={<RequireRole role="admin"><AdminMembersPage /></RequireRole>} />
          <Route path="/admin/staff" element={<RequireRole role="admin"><AdminStaffPage /></RequireRole>} />
          <Route path="/admin/facilities" element={<RequireRole role="admin"><AdminFacilitiesPage /></RequireRole>} />
          <Route path="/admin/packages" element={<RequireRole role="admin"><AdminPackagesPage /></RequireRole>} />
          <Route path="/admin/settings" element={<RequireRole role="admin"><AdminDashboardPage /></RequireRole>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;