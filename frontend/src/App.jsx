import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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
import RoleSwitcher from './components/RoleSwitcher';
import ToastContainer from './components/ToastContainer';

import { AppProvider } from './context/AppContext';

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
        <Route path="/member" element={<MemberDashboardPage />} />
        <Route path="/member/schedule" element={<MemberSchedulePage />} />
        <Route path="/member/ai-assistant" element={<MemberAIAssistantPage />} />
        <Route path="/member/profile" element={<MemberProfilePage />} />

        {/* Receptionist Routes (Flow 1, 3, 4) */}
        <Route path="/receptionist" element={<ReceptionCheckInPage />} />
        <Route path="/receptionist/pos" element={<ReceptionPOSPage />} />
        <Route path="/receptionist/members" element={<ReceptionCheckInPage />} />
        <Route path="/receptionist/shift" element={<ReceptionPOSPage />} />

        {/* Coach Routes (Flow 2, 4, 5) */}
        <Route path="/coach" element={<CoachSchedulePage />} />
        <Route path="/coach/students" element={<CoachStudentsPage />} />
        <Route path="/coach/attendance" element={<CoachAttendancePage />} />
        <Route path="/coach/income" element={<CoachSchedulePage />} />

        {/* Admin / Center Manager Routes (Flow 1, 2, 3) */}
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/members" element={<AdminMembersPage />} />
        <Route path="/admin/staff" element={<AdminStaffPage />} />
        <Route path="/admin/facilities" element={<AdminFacilitiesPage />} />
        <Route path="/admin/packages" element={<AdminPackagesPage />} />
        <Route path="/admin/settings" element={<AdminDashboardPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating Demo Role Switcher */}
      <RoleSwitcher />
    </BrowserRouter>
    </AppProvider>
  );
}

export default App;
