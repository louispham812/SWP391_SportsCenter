import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import PricingPage from './pages/PricingPage';
import AuthPage from './pages/AuthPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyCodePage from './pages/VerifyCodePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PublicContentPage from './pages/PublicContentPage';

// Member Portal Pages
import MemberDashboardPage from './pages/member/MemberDashboardPage';
import MemberPackagesPage from './pages/member/MemberPackagesPage';
import MemberClassesPage from './pages/member/MemberClassesPage';
import MemberSchedulePage from './pages/member/MemberSchedulePage';
import MemberAttendancePage from './pages/member/MemberAttendancePage';
import MemberWorkoutPlansPage from './pages/member/MemberWorkoutPlansPage';
import MemberNotificationsPage from './pages/member/MemberNotificationsPage';
import MemberTransactionsPage from './pages/member/MemberTransactionsPage';
import MemberBookingFlowPage from './pages/member/MemberBookingFlowPage';
import MemberAIAssistantPage from './pages/member/MemberAIAssistantPage';
import MemberProfilePage from './pages/member/MemberProfilePage';

// Receptionist Portal Pages
import ReceptionCheckInPage from './pages/receptionist/ReceptionCheckInPage';
import ReceptionPOSPage from './pages/receptionist/ReceptionPOSPage';
import ReceptionMembersPage from './pages/receptionist/ReceptionMembersPage';
import ReceptionClassesPage from './pages/receptionist/ReceptionClassesPage';
import ReceptionShiftReportPage from './pages/receptionist/ReceptionShiftReportPage';
import ReceptionEquipmentPage from './pages/receptionist/ReceptionEquipmentPage';

// Coach Portal Pages (Chỉ giữ các trang đã tạo)
import CoachDashboardPage from './pages/coach/CoachDashboardPage';
import CoachSchedulePage from './pages/coach/CoachSchedulePage';
import CoachStudentsPage from './pages/coach/CoachStudentsPage';
import CoachAttendancePage from './pages/coach/CoachAttendancePage';
import CoachProfilePage from './pages/coach/CoachProfilePage';

// Admin / Manager Portal Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMembersPage from './pages/admin/AdminMembersPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminStaffApprovalsPage from './pages/admin/AdminStaffApprovalsPage';
import AdminFacilitiesPage from './pages/admin/AdminFacilitiesPage';
import AdminPackagesPage from './pages/admin/AdminPackagesPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Floating Demo Switcher & Global Notifications
import CoachNotificationsPage from './pages/coach/CoachNotificationsPage';
import CoachReviewsPage from './pages/coach/CoachReviewsPage';
import MemberReviewsPage from './pages/member/MemberReviewsPage';
import AdminBroadcastPage from './pages/admin/AdminBroadcastPage';
import AdminAuditLogPage from './pages/admin/AdminAuditLogPage';
import AdminMaintenancePage from './pages/admin/AdminMaintenancePage';
import ToastContainer from './components/ToastContainer';

import { AppProvider, useApp } from './context/AppContext';

function RequireRole({ role, roles, children }) {
  const { currentUser, currentRole } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  const allowedRoles = roles || (role ? [role] : []);
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
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
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/sports" element={<PublicContentPage contentType="sports" />} />
          <Route path="/sports/:slug" element={<PublicContentPage contentType="sports" />} />
          <Route path="/facilities" element={<PublicContentPage contentType="facilities" />} />
          <Route path="/facilities/:slug" element={<PublicContentPage contentType="facilities" />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-code" element={<VerifyCodePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/verify-otp" element={<OtpVerificationPage />} />
          <Route path="/otp" element={<OtpVerificationPage />} />

          {/* Member Routes */}
          <Route path="/member" element={<RequireRole role="member"><MemberDashboardPage /></RequireRole>} />
          <Route path="/member/packages" element={<RequireRole role="member"><MemberPackagesPage /></RequireRole>} />
          <Route path="/member/classes" element={<RequireRole role="member"><MemberClassesPage /></RequireRole>} />
          <Route path="/member/book" element={<RequireRole role="member"><MemberBookingFlowPage /></RequireRole>} />
          <Route path="/member/book/:bookingType/sports" element={<RequireRole role="member"><MemberBookingFlowPage /></RequireRole>} />
          <Route path="/member/book/courts/:sportId" element={<RequireRole role="member"><MemberBookingFlowPage /></RequireRole>} />
          <Route path="/member/book/classes/:sportId" element={<RequireRole role="member"><MemberBookingFlowPage /></RequireRole>} />
          <Route path="/member/book/coaches/:sportId" element={<RequireRole role="member"><MemberBookingFlowPage /></RequireRole>} />
          <Route path="/member/book/checkout/:bookingType/:resourceId" element={<RequireRole role="member"><MemberBookingFlowPage /></RequireRole>} />
          <Route path="/member/book/confirmation" element={<RequireRole role="member"><MemberBookingFlowPage /></RequireRole>} />
          <Route path="/member/schedule" element={<RequireRole roles={['member', 'coach']}><MemberSchedulePage /></RequireRole>} />
          <Route path="/member/attendance" element={<RequireRole role="member"><MemberAttendancePage /></RequireRole>} />
          <Route path="/member/workout-plans" element={<RequireRole role="member"><MemberWorkoutPlansPage /></RequireRole>} />
          <Route path="/member/notifications" element={<RequireRole role="member"><MemberNotificationsPage /></RequireRole>} />
          <Route path="/member/transactions" element={<RequireRole role="member"><MemberTransactionsPage /></RequireRole>} />
          <Route path="/member/ai-assistant" element={<RequireRole role="member"><MemberAIAssistantPage /></RequireRole>} />
          <Route path="/member/profile" element={<RequireRole role="member"><MemberProfilePage /></RequireRole>} />

          <Route path="/member/reviews" element={<RequireRole role="member"><MemberReviewsPage /></RequireRole>} />
          {/* Receptionist Routes */}
          <Route path="/receptionist" element={<RequireRole role="receptionist"><ReceptionCheckInPage /></RequireRole>} />
          <Route path="/receptionist/pos" element={<RequireRole role="receptionist"><ReceptionPOSPage /></RequireRole>} />
          <Route path="/receptionist/equipment" element={<RequireRole role="receptionist"><ReceptionEquipmentPage /></RequireRole>} />
          <Route path="/receptionist/members" element={<RequireRole role="receptionist"><ReceptionMembersPage /></RequireRole>} />
          <Route path="/receptionist/classes" element={<RequireRole role="receptionist"><ReceptionClassesPage /></RequireRole>} />
          <Route path="/receptionist/shift" element={<RequireRole role="receptionist"><ReceptionShiftReportPage /></RequireRole>} />

          {/* Coach Routes */}
          <Route path="/coach" element={<RequireRole role="coach"><CoachDashboardPage /></RequireRole>} />
          <Route path="/coach/schedule" element={<RequireRole role="coach"><CoachSchedulePage /></RequireRole>} />
          <Route path="/coach/students" element={<RequireRole role="coach"><CoachStudentsPage /></RequireRole>} />
          <Route path="/coach/attendance" element={<RequireRole role="coach"><CoachAttendancePage /></RequireRole>} />
          <Route path="/coach/income" element={<RequireRole role="coach"><CoachSchedulePage initialTab="income" /></RequireRole>} />

          <Route path="/coach/notifications" element={<RequireRole role="coach"><CoachNotificationsPage /></RequireRole>} />
          <Route path="/coach/reviews" element={<RequireRole role="coach"><CoachReviewsPage /></RequireRole>} />
          <Route path="/coach/profile" element={<RequireRole role="coach"><CoachProfilePage /></RequireRole>} />
          {/* Admin / Center Manager Routes */}
          <Route path="/admin" element={<RequireRole role="admin"><AdminDashboardPage /></RequireRole>} />
          <Route path="/admin/members" element={<RequireRole role="admin"><AdminMembersPage /></RequireRole>} />
          <Route path="/admin/staff" element={<RequireRole role="admin"><AdminStaffPage /></RequireRole>} />
          <Route path="/admin/staff-approvals" element={<RequireRole role="admin"><AdminStaffApprovalsPage /></RequireRole>} />
          <Route path="/admin/facilities" element={<RequireRole role="admin"><AdminFacilitiesPage /></RequireRole>} />
          <Route path="/admin/packages" element={<RequireRole role="admin"><AdminPackagesPage /></RequireRole>} />
          <Route path="/admin/settings" element={<RequireRole role="admin"><AdminSettingsPage /></RequireRole>} />

          <Route path="/admin/broadcast" element={<RequireRole role="admin"><AdminBroadcastPage /></RequireRole>} />
          <Route path="/admin/audit-logs" element={<RequireRole role="admin"><AdminAuditLogPage /></RequireRole>} />
          <Route path="/admin/maintenance" element={<RequireRole role="admin"><AdminMaintenancePage /></RequireRole>} />
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;