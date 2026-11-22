import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, Palette, Sun, Moon, Loader2 } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../theme.jsx';
import { useSnackbar } from '../components/Snackbar.jsx';
import Logo from '../components/Logo.jsx';
import Splashscreen from '../components/Splashscreen.jsx';
import ParticleCanvas from '../components/ParticleCanvas.jsx';

const PARTICLE_COLORS = [
  { key: 'telkom', name: 'Telkom Red', color: '#ED1C24' },
  { key: 'emerald', name: 'Emerald', color: '#10B981' },
  { key: 'burgundy', name: 'Burgundy', color: '#9F1239' },
  { key: 'sapphire', name: 'Sapphire Blue', color: '#0284C7' },
  { key: 'amber', name: 'Amber Gold', color: '#D97706' },
  { key: 'violet', name: 'Cyber Violet', color: '#8B5CF6' },
];

export default function Login() {
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { showSnackbar } = useSnackbar();
  const nav = useNavigate();

  // Particle color customizable by user
  const [particleColor, setParticleColor] = useState(() => {
    return localStorage.getItem('og_particle_color') || '#ED1C24';
  });

  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem('og_splash_seen');
    if (!seen) {
      sessionStorage.setItem('og_splash_seen', 'true');
      return true;
    }
    return false;
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSelectParticleColor(color) {
    setParticleColor(color);
    localStorage.setItem('og_particle_color', color);
  }

  async function submit(e) {
    e.preventDefault();
    if (!email || !password || loading) return;
    setLoading(true);
    try {
      const u = await login(email, password);
      nav('/dashboard', { replace: true });
      showSnackbar(`Selamat datang kembali, ${u.nama}!`, 'success');
    } catch (e2) {
      showSnackbar(e2.message, 'error');
      setLoading(false);
    }
  }

  if (showSplash) {
    return <Splashscreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors ${darkMode ? 'bg-[#0A0E17]' : 'bg-slate-100'}`}>
      {/* Dynamic Background Particle Mesh Animation */}
      <ParticleCanvas color={particleColor} />

      {/* Top Left: Dark/Light Mode Theme Toggle & View Splashscreen Button */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-amber-500 dark:text-amber-400 hover:scale-105 transition shadow-sm cursor-pointer"
          title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        <button
          type="button"
          onClick={() => setShowSplash(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#ED1C24] dark:hover:text-[#ED1C24] transition shadow-sm cursor-pointer"
          title="Lihat Animasi Splashscreen & Moto OptiGuard"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#ED1C24]" />
          <span className="hidden sm:inline">Splashscreen & Moto</span>
        </button>
      </div>

      {/* Top Right: Particle Animation Color Selector (Separated from form box) */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 mr-1">
          <Palette className="w-3.5 h-3.5" style={{ color: particleColor }} />
          <span className="hidden sm:inline text-[11px]">Warna Partikel:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {PARTICLE_COLORS.map((th) => (
            <button
              key={th.key}
              type="button"
              onClick={() => handleSelectParticleColor(th.color)}
              className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                particleColor === th.color
                  ? 'scale-125 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900'
                  : 'hover:scale-110 opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: th.color }}
              title={th.name}
            />
          ))}
        </div>
      </div>

      {/* Clean Enterprise Login Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <Logo size="lg" color={particleColor} />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Sistem Validasi Instalasi & Preventive Maintenance ODP
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="nama@telkom.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1C24] transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1C24] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'Sembunyikan Kata Sandi' : 'Lihat Kata Sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-2xl font-bold text-xs text-white shadow-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
              style={{ backgroundColor: '#ED1C24' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memvalidasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke OptiGuard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link to Register */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Belum memiliki akun?{' '}
              <Link
                to="/register"
                className="font-bold text-[#ED1C24] hover:underline cursor-pointer"
              >
                Daftar Akun Teknisi
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
