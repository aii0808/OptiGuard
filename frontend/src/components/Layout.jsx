import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutGrid,
  MapPin,
  ClipboardList,
  CheckCircle2,
  FileText,
  Users,
  User,
  LogOut,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  AlertTriangle,
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

  // Modern Logout Modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  // Periodic poll for open pool badge and notifications
  useEffect(() => {
    let prevPool = 0;
    async function checkBadges() {
      try {
        if (user?.role === 'teknisi') {
          const pool = await api('/tiket/open-pool');
          const count = pool?.length || 0;
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

  function confirmLogout() {
    setShowLogoutModal(false);
    logout();
    nav('/login');
  }

  // Navigation Links definition (Persetujuan teknisi dihapus karena teknisi langsung aktif via kode STO-OPTIGUARD)
  const pimpinanLinks = [
    { to: '/dashboard', label: 'Dashboard Lengkap', icon: LayoutGrid },
    { to: '/webgis', label: 'WebGIS Pemetaan ODP', icon: MapPin },
    { to: '/tiket', label: 'Manajemen Tiket Tugas', icon: ClipboardList },
    { to: '/laporan', label: 'Laporan Kerja Lapangan', icon: FileText },
    { to: '/profil', label: 'Kelola Akun & Pegawai', icon: Users },
  ];

  const teknisiLinks = [
    { to: '/dashboard', label: 'Dashboard Lengkap', icon: LayoutGrid },
    { to: '/tugas', label: 'Tugas & Open Pool', icon: ClipboardList, badge: openPoolCount },
    { to: '/webgis', label: 'WebGIS Pemetaan ODP', icon: MapPin },
    { to: '/laporan', label: 'Laporan Kerja Lapangan', icon: FileText },
    { to: '/profil', label: 'Profil Saya', icon: User },
  ];

  const links = user?.role === 'pimpinan' ? pimpinanLinks : teknisiLinks;

  return (
    // UBAH: h-screen jadi h-dvh supaya tinggi ikut layar HP yang kelihatan (bukan 100vh)
    <div className="h-dvh w-screen overflow-hidden flex bg-[#0A0E17] text-slate-100">
      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar. UBAH: h-screen jadi h-dvh (dua kali di className bawah), tombol Keluar jadi tidak ketutup toolbar HP */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-dvh max-h-dvh bg-[#0D1322] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileDrawerOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        {/* Top Header of Sidebar */}
        <div
          className={`border-b border-slate-800/60 shrink-0 flex items-center ${
            collapsed ? 'p-3 justify-center' : 'px-4 py-3 justify-between'
          }`}
        >
          <div className={`flex items-center overflow-hidden ${collapsed ? 'justify-center w-full' : 'gap-3'}`}>
            {/* Unified OptiGuard Logo */}
            <Logo
              size="sm"
              showSubtitle={!collapsed}
              showText={!collapsed}
            />
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        {/* UBAH: kartu profil jadi strip datar (tanpa box, tanpa margin) seperti di aplikasi STO */}
        {!collapsed && user && (
          <div className="px-4 py-3 border-b border-slate-800/60 flex items-center gap-3 shrink-0">
            {/* Avatar with online dot */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#ED1C24] flex items-center justify-center font-black text-sm text-white shadow-md">
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
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
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
                    collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'
                  } rounded-xl text-xs font-semibold transition-all duration-200 ${
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

        {/* Bottom Pinned Controls (Theme Toggle & Modern Keluar Button) */}
        {/* UBAH: tambah pb-[...] supaya tombol Keluar naik di atas bar navigasi HP */}
        <div className="px-3 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-slate-800/80 bg-[#0B0F19] shrink-0">
          <div className={`flex ${collapsed ? 'flex-col items-center gap-2.5' : 'items-center justify-between gap-2'}`}>
            {/* UBAH: tombol Keluar tidak lagi memanjang (flex-1), jadi kecil di kanan seperti di aplikasi STO */}
            {/* Sun/Moon Theme Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#131A2D] hover:bg-[#1A233D] border border-slate-700/60 text-amber-400 transition cursor-pointer shrink-0 shadow-sm"
              title={darkMode ? 'Mode Gelap Aktif (Klik untuk Mode Terang)' : 'Mode Terang Aktif (Klik untuk Mode Gelap)'}
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
            </button>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`flex items-center justify-center gap-2 rounded-xl font-bold text-xs bg-[#240C14] hover:bg-[#38121F] border border-[#5E1424] text-rose-300 hover:text-rose-100 transition cursor-pointer shadow-sm ${
                collapsed ? 'w-9 h-9 p-0' : 'py-2 px-5'
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
      {/* UBAH: h-screen jadi h-dvh */}
      <div className="flex-1 flex flex-col h-dvh overflow-hidden">
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

            {/* OptiGuard Brand Badge: Only visible when sidebar is collapsed on desktop, or on mobile */}
            <div className="md:hidden">
              <Logo size="sm" showSubtitle={false} showText={true} />
            </div>
            {collapsed && (
              <div className="hidden md:block">
                <Logo size="sm" showSubtitle={false} showText={true} />
              </div>
            )}
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
          </div>
        </header>

        {/* Page Content with dynamic theme background */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${darkMode ? 'bg-[#0B0F19]' : 'bg-slate-50 text-slate-900'}`}>
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Modern Logout Confirmation Modal (Dims Entire Application to Dark Gray Overlay) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-9999 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#0D1322] border border-slate-700/80 p-6 shadow-2xl space-y-5 text-center relative overflow-hidden">
            {/* Glowing Accent Top Bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-1 bg-linear-to-r from-transparent via-red-500 to-transparent" />

            {/* Warning / Logout Icon */}
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-[#ED1C24] flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
              <LogOut className="w-8 h-8" />
            </div>

            {/* Modal Content */}
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white">
                Konfirmasi Keluar Aplikasi
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin keluar dari <b className="text-white">OptiGuard</b>? Sesi kerja Anda akan diakhiri dan data Anda tersimpan aman.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="w-full py-2.5 rounded-2xl font-bold text-xs bg-[#ED1C24] hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}