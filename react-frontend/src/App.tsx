import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/Login';
import MemberPage from './pages/MemberPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ProgramsPage from './pages/ProgramsPage';
import TrainersPage from './pages/TrainersPage';
import PricingPage from './pages/PricingPage';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminMembersPage from './pages/AdminMembersPage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import AdminBillingPage from './pages/AdminBillingPage';
import AdminInstructorsPage from './pages/AdminInstructorsPage';
import AdminPlansPage from './pages/AdminPlansPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminSchedulesPage from './pages/AdminSchedulesPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminMemberDetailsPage from './pages/AdminMemberDetailsPage';
import MemberLayout from './pages/MemberLayout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/trainers" element={<TrainersPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
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
        
        {/* Member Routes */}
        <Route path="/member" element={<MemberLayout />}>
          <Route index element={<MemberPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
