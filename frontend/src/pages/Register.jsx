import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, KeyRound, CheckCircle2, ArrowLeft, Sun, Moon, Palette, ShieldCheck, ChevronDown } from 'lucide-react';
import { useTheme } from '../theme.jsx';
import { useSnackbar } from '../components/Snackbar.jsx';
import Logo from '../components/Logo.jsx';
import ParticleCanvas from '../components/ParticleCanvas.jsx';
import { api } from '../api.js';

const PARTICLE_COLORS = [
  { key: 'telkom', name: 'Telkom Red', color: '#ED1C24' },
  { key: 'emerald', name: 'Emerald', color: '#10B981' },
  { key: 'burgundy', name: 'Burgundy', color: '#9F1239' },
  { key: 'sapphire', name: 'Sapphire Blue', color: '#0284C7' },
  { key: 'amber', name: 'Amber Gold', color: '#D97706' },
  { key: 'violet', name: 'Cyber Violet', color: '#8B5CF6' },
];

export default function Register() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { showSnackbar } = useSnackbar();
  const nav = useNavigate();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [form, setForm] = useState({
    nama_lengkap: '',
    email: '',
    password: '',
    kode_validasi: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const [particleColor, setParticleColor] = useState(() => {
    return localStorage.getItem('og_particle_color') || '#ED1C24';
  });

  function handleSelectParticleColor(color) {
    setParticleColor(color);
    localStorage.setItem('og_particle_color', color);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!form.kode_validasi.trim()) {
      showSnackbar('Kode validasi instansi wajib diisi', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await api('/auth/register', {
        method: 'POST',
        body: {
          ...form,
          kode_validasi: form.kode_validasi.trim().toUpperCase(),
        },
      });
      showSnackbar(res.message || 'Pendaftaran berhasil dan akun telah aktif!', 'success');
      setSuccess(res.message || 'Akun Anda berhasil divalidasi dan langsung aktif!');
    } catch (e2) {
      showSnackbar(e2.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors ${darkMode ? 'bg-[#0A0E17]' : 'bg-slate-100'}`}>
      {/* Particle Canvas Background */}
      <ParticleCanvas color={particleColor} />

      {/* Top Left: Theme Toggle & Back to Login */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-amber-500 dark:text-amber-400 hover:scale-105 transition shadow-sm cursor-pointer"
          title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        <Link
          to="/login"
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#ED1C24] dark:hover:text-[#ED1C24] transition shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </Link>
      </div>

      {/* Top Right: Particle Color Picker (Collapsible) */}
      <div className="absolute top-5 right-5 z-20">
        <div className="relative">
          <button
            type="button"
            onClick={() => setColorPickerOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 transition cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300"
            title="Pilih Tema Warna Partikel"
          >
            <Palette className="w-3.5 h-3.5" style={{ color: particleColor }} />
            <span
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/50"
              style={{ backgroundColor: particleColor }}
            />
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${colorPickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Collapsible Color Options Dropdown */}
          {colorPickerOpen && (
            <div className="absolute right-0 mt-2 p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5">
                Tema Partikel
              </span>
              {PARTICLE_COLORS.map((th) => (
                <button
                  key={th.key}
                  type="button"
                  onClick={() => {
                    handleSelectParticleColor(th.color);
                    setColorPickerOpen(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    particleColor === th.color
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10"
                    style={{ backgroundColor: th.color }}
                  />
                  <span className="truncate text-[11px]">{th.name}</span>
                  {particleColor === th.color && (
                    <span className="ml-auto text-[10px] text-emerald-500 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clean Enterprise Register Form Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center mb-6">
            <Logo size="md" color={particleColor} />
            <h2 className="text-base font-bold mt-3 text-slate-900 dark:text-slate-100">
              Registrasi Teknisi Patroli
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gunakan kode validasi resmi STO untuk aktivasi akun instan
            </p>
          </div>

          {success ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                Pendaftaran Berhasil & Akun Aktif!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {success}
              </p>
              <button
                onClick={() => nav('/login')}
                className="w-full rounded-2xl py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
                style={{ backgroundColor: '#ED1C24' }}
              >
                Masuk ke Halaman Login Sekarang
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Lengkap Pegawai
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Natasya / Ari"
                    value={form.nama_lengkap}
                    onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="nama@telkom.co.id"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 6 karakter"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Sembunyikan' : 'Lihat'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Kode Validasi Instansi */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kode Validasi Pendaftaran Instansi
                  </label>
                  <span className="text-[10px] text-red-500 font-semibold">*Wajib</span>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Masukkan kode validasi instansi"
                    value={form.kode_validasi}
                    onChange={(e) => setForm({ ...form, kode_validasi: e.target.value.toUpperCase() })}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Dapatkan kode validasi resmi dari Koordinator / Pimpinan STO Payakumbuh.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-2.5 px-4 rounded-2xl font-bold text-xs text-white shadow-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: '#ED1C24' }}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Memvalidasi akun...' : 'Validasi & Aktifkan Akun'}</span>
              </button>
            </form>
          )}

          {/* Footer Back */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sudah memiliki akun?{' '}
              <Link
                to="/login"
                className="font-bold text-[#ED1C24] hover:underline cursor-pointer"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
