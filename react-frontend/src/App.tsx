import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/Login';

// Lazy load the rest of the application
const MemberPage = React.lazy(() => import('./pages/MemberPage'));
const AdminLoginPage = React.lazy(() => import('./pages/AdminLoginPage'));
const ProgramsPage = React.lazy(() => import('./pages/ProgramsPage'));
const TrainersPage = React.lazy(() => import('./pages/TrainersPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const AdminLayout = React.lazy(() => import('./pages/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminMembersPage = React.lazy(() => import('./pages/AdminMembersPage'));
const AdminAttendancePage = React.lazy(() => import('./pages/AdminAttendancePage'));
const AdminScannerPage = React.lazy(() => import('./pages/AdminScannerPage'));
const AdminBillingPage = React.lazy(() => import('./pages/AdminBillingPage'));
const AdminInstructorsPage = React.lazy(() => import('./pages/AdminInstructorsPage'));
const AdminPlansPage = React.lazy(() => import('./pages/AdminPlansPage'));
const AdminReportsPage = React.lazy(() => import('./pages/AdminReportsPage'));
const AdminSchedulesPage = React.lazy(() => import('./pages/AdminSchedulesPage'));
const AdminSettingsPage = React.lazy(() => import('./pages/AdminSettingsPage'));
const AdminMemberDetailsPage = React.lazy(() => import('./pages/AdminMemberDetailsPage'));
const KioskLayout = React.lazy(() => import('./pages/KioskLayout'));
const MemberLayout = React.lazy(() => import('./pages/MemberLayout'));

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-zinc-950 text-white">Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Lazy loaded routes */}
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/trainers" element={<TrainersPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<AdminMembersPage />} />
            <Route path="members/:id" element={<AdminMemberDetailsPage />} />
            <Route path="attendance" element={<AdminAttendancePage />} />
            <Route path="billing" element={<AdminBillingPage />} />
            <Route path="instructors" element={<AdminInstructorsPage />} />
            <Route path="plans" element={<AdminPlansPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="schedules" element={<AdminSchedulesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
          
          {/* Kiosk Routes */}
          <Route path="/kiosk" element={<KioskLayout />}>
            <Route path="scanner" element={<AdminScannerPage />} />
          </Route>
          
          {/* Member Routes */}
          <Route path="/member" element={<MemberLayout />}>
            <Route index element={<MemberPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App;
