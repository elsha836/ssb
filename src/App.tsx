import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { LayoutDashboard, Users, UserRound, Calendar, ClipboardCheck, GraduationCap, CreditCard, Bell, Trophy, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Coaches = lazy(() => import('./pages/Coaches'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Assessments = lazy(() => import('./pages/Assessments'));
const Payments = lazy(() => import('./pages/Payments'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Matches = lazy(() => import('./pages/Matches'));
const Login = lazy(() => import('./pages/Login'));

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active?: boolean, key?: string }) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-emerald-100 hover:bg-emerald-800/50"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-white" : "text-emerald-400 group-hover:text-emerald-200")} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Navigation = () => {
  const { profile, isAdmin, isCoach, isParent } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/students', icon: Users, label: 'Siswa', show: true },
    { to: '/coaches', icon: UserRound, label: 'Pelatih', show: isAdmin || isCoach },
    { to: '/schedule', icon: Calendar, label: 'Jadwal', show: true },
    { to: '/attendance', icon: ClipboardCheck, label: 'Absensi', show: isAdmin || isCoach },
    { to: '/assessments', icon: GraduationCap, label: 'Penilaian', show: true },
    { to: '/payments', icon: CreditCard, label: 'Pembayaran', show: isAdmin || isParent },
    { to: '/matches', icon: Trophy, label: 'Pertandingan', show: true },
    { to: '/announcements', icon: Bell, label: 'Pengumuman', show: true },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-emerald-600 text-white rounded-lg"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-emerald-950 text-white transform transition-transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-inner">
              <Trophy className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SSB <span className="text-emerald-400">PRO</span></h1>
          </div>

          <nav className="space-y-1">
            {menuItems.filter(item => item.show).map((item) => (
              <SidebarItem 
                key={item.to} 
                to={item.to} 
                icon={item.icon} 
                label={item.label} 
                active={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))}
              />
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 bg-emerald-950/50 border-t border-emerald-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-800 border-2 border-emerald-700 overflow-hidden">
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-emerald-400 font-bold">
                  {profile?.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-emerald-500 capitalize">{profile?.role || 'Guest'}</p>
            </div>
          </div>
          <button 
            onClick={() => import('./lib/firebase').then(f => f.auth.signOut())}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-emerald-50">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-emerald-50">
          <Routes>
            <Route path="/login" element={
              <Suspense fallback={<div>Loading...</div>}>
                <Login />
              </Suspense>
            } />
            <Route path="*" element={
              <PrivateRoute>
                <div className="flex">
                  <Navigation />
                  <main className="flex-1 lg:ml-64 p-4 lg:p-8">
                    <AnimatePresence mode="wait">
                      <Suspense fallback={
                        <div className="flex items-center justify-center h-full">
                          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      }>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/students" element={<Students />} />
                          <Route path="/coaches" element={<Coaches />} />
                          <Route path="/schedule" element={<Schedule />} />
                          <Route path="/attendance" element={<Attendance />} />
                          <Route path="/assessments" element={<Assessments />} />
                          <Route path="/payments" element={<Payments />} />
                          <Route path="/announcements" element={<Announcements />} />
                          <Route path="/matches" element={<Matches />} />
                        </Routes>
                      </Suspense>
                    </AnimatePresence>
                  </main>
                </div>
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
