import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from './store';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WaitingApprovalPage from './pages/WaitingApprovalPage';
import HomePage from './pages/HomePage';
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

// ── 세션 타임아웃 ──────────────────────────────────────────
// 마지막 활동으로부터 IDLE_MS 경과 시 자동 로그아웃
const IDLE_MS = 60 * 1000; // 1분 (변경 시 이 값만 수정)

function IdleTimer() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const timer = useRef(null);

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      logout();
      navigate('/', { replace: true });
    }, IDLE_MS);
  }, [logout, navigate]);

  useEffect(() => {
    if (!user || user.isAdmin) return; // 미로그인·어드민은 제외

    const events = ['click', 'keydown', 'touchstart', 'mousemove', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset(); // 최초 타이머 시작

    return () => {
      clearTimeout(timer.current);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [user, reset]);

  return null;
}
// ──────────────────────────────────────────────────────────

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
      <IdleTimer />
      <Routes>
        {/* 공통 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pending" element={<WaitingApprovalPage />} />

        {/* 회원 */}
        <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
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
