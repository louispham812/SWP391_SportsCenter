import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Public Pages
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import AuthPage from './pages/AuthPage';

// Member Portal Pages
import MemberDashboardPage from './pages/member/MemberDashboardPage';
import MemberSchedulePage from './pages/member/MemberSchedulePage';
import MemberAIAssistantPage from './pages/member/MemberAIAssistantPage';
import MemberProfilePage from './pages/member/MemberProfilePage';

// Receptionist Portal Pages
import ReceptionCheckInPage from './pages/receptionist/ReceptionCheckInPage';
import ReceptionPOSPage from './pages/receptionist/ReceptionPOSPage';

// Coach Portal Pages
import CoachSchedulePage from './pages/coach/CoachSchedulePage';
import CoachStudentsPage from './pages/coach/CoachStudentsPage';
import CoachAttendancePage from './pages/coach/CoachAttendancePage';

// Admin / Manager Portal Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMembersPage from './pages/admin/AdminMembersPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminFacilitiesPage from './pages/admin/AdminFacilitiesPage';
import AdminPackagesPage from './pages/admin/AdminPackagesPage';

// Floating Demo Switcher & Global Notifications
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
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* Member Routes (Flow 1, 2, 5, 6) */}
        <Route path="/member" element={<RequireRole role="member"><MemberDashboardPage /></RequireRole>} />
        <Route path="/member/schedule" element={<RequireRole role="member"><MemberSchedulePage /></RequireRole>} />
        <Route path="/member/ai-assistant" element={<RequireRole role="member"><MemberAIAssistantPage /></RequireRole>} />
        <Route path="/member/profile" element={<RequireRole role="member"><MemberProfilePage /></RequireRole>} />

        {/* Receptionist Routes (Flow 1, 3, 4) */}
        <Route path="/receptionist" element={<RequireRole role="receptionist"><ReceptionCheckInPage /></RequireRole>} />
        <Route path="/receptionist/pos" element={<RequireRole role="receptionist"><ReceptionPOSPage /></RequireRole>} />
        <Route path="/receptionist/members" element={<RequireRole role="receptionist"><ReceptionCheckInPage /></RequireRole>} />
        <Route path="/receptionist/shift" element={<RequireRole role="receptionist"><ReceptionPOSPage /></RequireRole>} />

        {/* Coach Routes (Flow 2, 4, 5) */}
        <Route path="/coach" element={<RequireRole role="coach"><CoachSchedulePage /></RequireRole>} />
        <Route path="/coach/students" element={<RequireRole role="coach"><CoachStudentsPage /></RequireRole>} />
        <Route path="/coach/attendance" element={<RequireRole role="coach"><CoachAttendancePage /></RequireRole>} />
        <Route path="/coach/income" element={<RequireRole role="coach"><CoachSchedulePage /></RequireRole>} />

        {/* Admin / Center Manager Routes (Flow 1, 2, 3) */}
        <Route path="/admin" element={<RequireRole role="admin"><AdminDashboardPage /></RequireRole>} />
        <Route path="/admin/members" element={<RequireRole role="admin"><AdminMembersPage /></RequireRole>} />
        <Route path="/admin/staff" element={<RequireRole role="admin"><AdminStaffPage /></RequireRole>} />
        <Route path="/admin/facilities" element={<RequireRole role="admin"><AdminFacilitiesPage /></RequireRole>} />
        <Route path="/admin/packages" element={<RequireRole role="admin"><AdminPackagesPage /></RequireRole>} />
        <Route path="/admin/settings" element={<RequireRole role="admin"><AdminDashboardPage /></RequireRole>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </BrowserRouter>
    </AppProvider>
  );
}

export default App;
