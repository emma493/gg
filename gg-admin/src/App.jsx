import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { checkAdminSeat, getUserRole } from './lib/admin';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ClaimAdminPage from './pages/ClaimAdminPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const surface = { background: '#1E1F27', border: '1px solid rgba(255,255,255,0.08)' };

const linkBase = 'flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors no-underline';
const linkIdle = 'text-[#A1A2A7] hover:bg-white/[0.06] hover:text-white';
const linkActive = 'bg-[#FF2B55]/[0.12] text-white';

// Error boundary to prevent blank pages on component crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  static getDerivedStateFromProps() {
    // Reset on route change
    return null;
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, info: errorInfo });
    console.error('React Error Boundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1014' }}>
          <div className="rounded-[14px] p-8 text-center" style={surface}>
            <AlertCircle size={40} className="mx-auto mb-4 text-[#FF2B55]" />
            <h1 className="text-white text-[20px] font-bold mb-2">Something went wrong</h1>
            <p className="text-[#8A8B91] text-[13px] mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-[10px] text-white font-bold bg-[#FF2B55] hover:bg-[#FF2B55]/[0.9]"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageFallback() {
  return (
    <div className="rounded-[14px] min-h-[240px] animate-pulse" style={{ background: '#1E1F27' }} />
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [seatClaimed, setSeatClaimed] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        if (cancelled) return;
        setUser(u);
        if (u) {
          try {
            const role = await getUserRole(u.uid);
            setIsAdmin(role === 'admin');
            const seat = await checkAdminSeat();
            setSeatClaimed(seat.claimed);
          } catch (e) {
            setAuthError(e.message || 'Auth check failed');
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
          setSeatClaimed(false);
        }
        setLoading(false);
      },
      (err) => {
        if (cancelled) return;
        setAuthError(err.message || 'Auth listener failed');
        setLoading(false);
      }
    );
    return () => { cancelled = true; unsub(); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1014' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full animate-spin" style={{ background: '#FF2B55' }} />
          <p className="text-white text-[14px]">Loading…</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1014' }}>
        <div className="rounded-[14px] p-8 text-center" style={surface}>
          <AlertCircle size={40} className="mx-auto mb-4 text-[#FF2B55]" />
          <h1 className="text-white text-[20px] font-bold mb-2">Auth Error</h1>
          <p className="text-[#8A8B91] text-[13px] mb-4">{authError}</p>
          <p className="text-[#FF2B55] text-[12px] mb-6">Make sure claimprizes.netlify.app is added to Firebase Authorized Domains</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-[10px] text-white font-bold bg-[#FF2B55] hover:bg-[#FF2B55]/[0.9]"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Public routes — not signed in
  if (!user) {
    return (
      <ErrorBoundary>
        <BrowserRouter basename="/gg-admin">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  // Signed in but not admin — show claim page if seat free, else access denied
  if (!isAdmin) {
    if (seatClaimed) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1014' }}>
          <div className="rounded-[14px] p-8 text-center" style={surface}>
            <AlertCircle size={40} className="mx-auto mb-4 text-[#FF2B55]" />
            <h1 className="text-white text-[20px] font-bold mb-2">Access denied</h1>
            <p className="text-[#8A8B91] text-[13px] mb-6">
              The admin seat has already been claimed. You are signed in as a regular user.
            </p>
            <button
              onClick={() => signOut(auth)}
              className="px-4 py-2 rounded-[10px] text-white font-bold bg-[#FF2B55] hover:bg-[#FF2B55]/[0.9]"
            >
              Logout
            </button>
          </div>
        </div>
      );
    }
    return (
      <ErrorBoundary>
        <BrowserRouter basename="/gg-admin">
          <Routes>
            <Route path="/claim-admin" element={<ClaimAdminPage user={user} />} />
            <Route path="/" element={<Navigate to="/claim-admin" replace />} />
            <Route path="*" element={<Navigate to="/claim-admin" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  // Admin shell
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/gg-admin">
        <div className="min-h-screen flex" style={{ background: '#0F1014' }}>
          <aside className="w-[248px] shrink-0 min-h-screen flex flex-col px-4 py-5 max-lg:hidden" style={{ background: '#16171D', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-2 mb-8">
              <div className="text-white text-[19px] font-black tracking-tight">GG Admin</div>
            </div>
            <nav className="flex flex-col gap-1">
              <NavLink to="/dashboard" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
                <LayoutDashboard size={18} strokeWidth={2.2} />
                Dashboard
              </NavLink>
              <NavLink to="/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
                <Users size={18} strokeWidth={2.2} />
                Visitors
              </NavLink>
              <NavLink to="/analytics" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
                <ClipboardList size={18} strokeWidth={2.2} />
                Analytics
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
                <Settings size={18} strokeWidth={2.2} />
                Settings
              </NavLink>
            </nav>
            <div className="mt-auto pt-6 border-t border-white/[0.08]">
              <button
                onClick={() => signOut(auth)}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-[10px] text-[#A1A2A7] font-semibold hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <LogOut size={18} strokeWidth={2.2} />
                Logout
              </button>
            </div>
          </aside>
          <div className="flex-1 min-w-0">
            <div className="lg:hidden flex items-center gap-2 px-4 py-3 overflow-x-auto" style={{ background: '#16171D', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-white font-black mr-2 shrink-0">GG Admin</span>
            </div>
            <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage user={user} />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
    );
  }
}
