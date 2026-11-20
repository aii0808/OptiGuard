import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutGrid,
  MapPin,
  Network,
  ClipboardList,
  CheckCircle2,
  FileText,
  Users,
  LogOut,
  Sun,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../theme.jsx';
import { useSnackbar } from './Snackbar.jsx';
import Logo from './Logo.jsx';
import { api } from '../api.js';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode, soundEnabled, toggleSound, triggerDingDong } = useTheme();
  const { showSnackbar } = useSnackbar();

  // Desktop sidebar collapse state
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('og_sidebar_collapsed') === 'true';
  });

  // Mobile sidebar drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [pendingCount, setPendingCount] = useState(0);
  const [openPoolCount, setOpenPoolCount] = useState(0);
  const nav = useNavigate();
  const location = useLocation();

  // Persist current active path so refresh stays on this exact page
  useEffect(() => {
    if (location.pathname && location.pathname !== '/login' && location.pathname !== '/register') {
      localStorage.setItem('og_current_path', location.pathname);
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('og_sidebar_collapsed', collapsed);
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Periodic poll for badges and notifications
  useEffect(() => {
    let prevPool = 0;
    async function checkBadges() {
      try {
        if (user?.role === 'pimpinan') {
          const list = await api('/auth/pending-users');
          setPendingCount(list.length || 0);
        }
        if (user?.role === 'teknisi') {
          const pool = await api('/tiket/open-pool');
          const count = pool.length || 0;
          setOpenPoolCount(count);
          if (count > prevPool && prevPool !== 0) {
            triggerDingDong();
            showSnackbar(`Tersedia ${count} tugas baru di Open Pool!`, 'info');
          }
          prevPool = count;
        }
      } catch {
        // quiet
      }
    }

    if (user) {
      checkBadges();
      const iv = setInterval(checkBadges, 12000);
      return () => clearInterval(iv);
    }
  }, [user, triggerDingDong, showSnackbar]);

  function handleLogout() {
    if (window.confirm('Apakah Anda yakin ingin keluar dari OptiGuard?')) {
      logout();
      nav('/login');
    }
  }

  // Navigation Links definition matching the user's reference mockup
  const pimpinanLinks = [
    { to: '/dashboard', label: 'Dashboard Lengkap', icon: LayoutGrid },
    { to: '/webgis', label: 'WebGIS Pemetaan ODP', icon: MapPin },
    { to: '/tiket', label: 'Manajemen Tiket Tugas', icon: ClipboardList },
    { to: '/approval', label: 'Permohonan dari Teknisi', icon: CheckCircle2, badge: pendingCount },
    { to: '/laporan', label: 'Laporan Kerja Lapangan', icon: FileText },
    { to: '/profil', label: 'Kelola Akun & Pegawai', icon: Users },
  ];

  const teknisiLinks = [
    { to: '/dashboard', label: 'Dashboard Lengkap', icon: LayoutGrid },
    { to: '/tugas', label: 'Tugas & Open Pool', icon: ClipboardList, badge: openPoolCount },
    { to: '/webgis', label: 'WebGIS Pemetaan ODP', icon: MapPin },
    { to: '/laporan', label: 'Laporan Kerja Lapangan', icon: FileText },
    { to: '/profil', label: 'Kelola Akun & Profil', icon: Users },
  ];

  const links = user?.role === 'pimpinan' ? pimpinanLinks : teknisiLinks;

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#0A0E17] text-slate-100">
      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Modern Sidebar (1 Screen Height, fits in viewport, logout visible at bottom) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen max-h-screen bg-[#0D1322] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileDrawerOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        {/* Top Header of Sidebar (Matching Reference Image) */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Telkom Akses Logo Badge */}
            <Logo size="sm" showSubtitle={!collapsed} variant="telkom" />
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card (Matching Reference Image) */}
        {!collapsed && user && (
          <div className="p-4 mx-3 my-2 rounded-2xl bg-[#131A2D] border border-slate-800/60 flex items-center gap-3 shrink-0 shadow-sm">
            {/* Avatar with online dot */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#ED1C24] flex items-center justify-center font-black text-base text-white shadow-md">
                {user.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#131A2D]" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate leading-tight">
                {user.nama}
              </span>
              <div className="mt-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#26111B] text-rose-300 border border-rose-900/40">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items List */}
        <div className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {!collapsed && (
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 px-3 pt-2 pb-1">
              MENU NAVIGASI
            </div>
          )}

          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex items-center ${
                    collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-3'
                  } rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#ED1C24] text-white shadow-lg shadow-red-600/30 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {/* Badge for Pending / Open Pool */}
                {item.badge > 0 && (
                  <span
                    className={`${
                      collapsed
                        ? 'absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#0D1322]'
                        : 'px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-sm shrink-0'
                    }`}
                  >
                    {!collapsed && item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Pinned Controls (Theme Toggle & Keluar Button - Matching Reference Screenshot) */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0B0F19] shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Sun/Moon Theme Toggle Icon Button */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#131A2D] hover:bg-[#1A233D] border border-slate-700/60 text-amber-400 transition cursor-pointer shrink-0 shadow-sm"
              title={darkMode ? 'Mode Gelap Aktif (Klik untuk Mode Terang)' : 'Mode Terang Aktif (Klik untuk Mode Gelap)'}
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
            </button>

            {/* Logout Button (Dark Red Pill with Exit Icon as in reference screenshot) */}
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-[#240C14] hover:bg-[#34111D] border border-[#5E1424] text-rose-300 hover:text-rose-200 transition cursor-pointer shadow-sm ${
                collapsed ? 'w-10 h-10 p-0' : 'flex-1'
              }`}
              title="Keluar dari Sistem"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Content Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Navbar */}
        <header className="h-16 px-4 md:px-6 bg-[#0D1322]/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            {/* Burger Button: Controls Desktop Collapse and Mobile Drawer */}
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileDrawerOpen((prev) => !prev);
                } else {
                  setCollapsed((prev) => !prev);
                }
              }}
              className="p-2.5 rounded-2xl bg-[#131A2D] hover:bg-[#1B243E] border border-slate-700/70 text-white transition active:scale-95 cursor-pointer shadow-sm"
              title="Buka / Ciutkan Sidebar (Burger Menu)"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5 text-[#ED1C24]" />
            </button>

            {/* OptiGuard Brand Badge */}
            <Logo size="sm" showSubtitle={false} />
          </div>

          {/* Right Action Icons in Header */}
          <div className="flex items-center gap-3">
            {/* Sound Notification Button */}
            <button
              onClick={() => {
                triggerDingDong();
                toggleSound();
                showSnackbar(
                  !soundEnabled ? 'Notifikasi Suara: AKTIF 🔔' : 'Notifikasi Suara: BISU 🔇',
                  'info'
                );
              }}
              className={`p-2 rounded-2xl border transition flex items-center justify-center cursor-pointer shadow-sm ${
                soundEnabled
                  ? 'bg-[#131A2D] border-slate-700 text-slate-200'
                  : 'bg-red-950/30 border-red-900/50 text-red-400'
              }`}
              title={soundEnabled ? 'Suara Bell: AKTIF' : 'Suara Bell: BISU'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* User Pill */}
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-[#ED1C24] flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {user?.nama?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold truncate max-w-[130px] text-slate-200">
                  {user?.nama}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with dynamic theme background */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${darkMode ? 'bg-[#0B0F19]' : 'bg-slate-50 text-slate-900'}`}>
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
