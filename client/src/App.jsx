import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WaitingApprovalPage from './pages/WaitingApprovalPage';
import EventListPage from './pages/EventListPage';
import EventDetailPage from './pages/EventDetailPage';
import MyPage from './pages/MyPage';
import NotificationsPage from './pages/NotificationsPage';
import LikesPage from './pages/LikesPage';
import MatchResultPage from './pages/MatchResultPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminEventDetailPage from './pages/admin/AdminEventDetailPage';
import AdminResultsPage from './pages/admin/AdminResultsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

function RequireAuth({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/" replace />;
  if (user.status === 'pending') return <Navigate to="/pending" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuthStore();
  if (!user?.isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공통 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pending" element={<WaitingApprovalPage />} />

        {/* 회원 */}
        <Route path="/events" element={<RequireAuth><EventListPage /></RequireAuth>} />
        <Route path="/events/:id" element={<RequireAuth><EventDetailPage /></RequireAuth>} />
        <Route path="/events/:id/likes" element={<RequireAuth><LikesPage /></RequireAuth>} />
        <Route path="/events/:id/result" element={<RequireAuth><MatchResultPage /></RequireAuth>} />
        <Route path="/my" element={<RequireAuth><MyPage /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />

        {/* 운영자 */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/events" element={<RequireAdmin><AdminEventsPage /></RequireAdmin>} />
        <Route path="/admin/events/:id" element={<RequireAdmin><AdminEventDetailPage /></RequireAdmin>} />
        <Route path="/admin/results/:id" element={<RequireAdmin><AdminResultsPage /></RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin><AdminUsersPage /></RequireAdmin>} />
      </Routes>
    </BrowserRouter>
  );
}
