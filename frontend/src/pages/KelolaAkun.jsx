import { useState, useEffect } from 'react';
import {
  UserCog,
  UserPlus,
  User,
  Mail,
  Lock,
  Send,
  Volume2,
  VolumeX,
  Shield,
  Trash2,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../theme.jsx';
import { useSnackbar } from '../components/Snackbar.jsx';
import { Tilt3DCard } from '../components/MouseEffect.jsx';

export default function KelolaAkun() {
  const { user } = useAuth();
  const { soundEnabled, toggleSound, triggerDingDong, primaryColor } = useTheme();
  const { showSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState('profil'); // 'profil' | 'users'

  // Profile state
  const [profileForm, setProfileForm] = useState({
    nama_lengkap: user.nama || '',
    password: '',
    telegram_chat_id: user.telegram_chat_id || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // User Management state (for Pimpinan)
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    nama_lengkap: '',
    email: '',
    password: '',
    role: 'teknisi',
    telegram_chat_id: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Load current user profile data
  useEffect(() => {
    async function muatMe() {
      try {
        const res = await api('/auth/me');
        if (res.user) {
          setProfileForm({
            nama_lengkap: res.user.nama_lengkap || res.user.nama || '',
            password: '',
            telegram_chat_id: res.user.telegram_chat_id || '',
          });
        }
      } catch (e) {
        // quiet
      }
    }
    muatMe();
  }, []);

  // Load all users if Pimpinan
  async function muatAllUsers() {
    if (user.role !== 'pimpinan') return;
    setLoadingUsers(true);
    try {
      const data = await api('/auth/users');
      setAllUsers(data || []);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (user.role === 'pimpinan') {
      muatAllUsers();
    }
  }, [user.role]);

  // Update personal profile
  async function handleSimpanProfil(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        nama_lengkap: profileForm.nama_lengkap,
        telegram_chat_id: profileForm.telegram_chat_id,
      };
      if (profileForm.password && profileForm.password.trim()) {
        payload.password = profileForm.password.trim();
      }
      const res = await api('/auth/profil', { method: 'PUT', body: payload });
      showSnackbar('Profil Anda berhasil diperbarui!', 'success');

      // Update storage
      const current = JSON.parse(localStorage.getItem('og_user') || '{}');
      current.nama = res.user.nama_lengkap;
      current.telegram_chat_id = res.user.telegram_chat_id;
      localStorage.setItem('og_user', JSON.stringify(current));
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  // Pimpinan creates new account
  async function handleCreateUser(e) {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await api('/auth/create-user', {
        method: 'POST',
        body: newUserForm,
      });
      showSnackbar(res.message, 'success');
      setNewUserForm({
        nama_lengkap: '',
        email: '',
        password: '',
        role: 'teknisi',
        telegram_chat_id: '',
      });
      await muatAllUsers();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setCreatingUser(false);
    }
  }

  // Pimpinan resets user password
  async function handleResetPassword(e) {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;
    try {
      await api(`/auth/users/${resetModalUser.id}`, {
        method: 'PUT',
        body: { password: newPassword },
      });
      showSnackbar(`Kata sandi akun ${resetModalUser.nama_lengkap} berhasil diperbarui!`, 'success');
      setResetModalUser(null);
      setNewPassword('');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }

  // Pimpinan deletes user
  async function handleDeleteUser(id, nama) {
    if (!window.confirm(`Hapus akun "${nama}" secara permanen dari sistem?`)) return;
    try {
      const res = await api(`/auth/users/${id}`, { method: 'DELETE' });
      showSnackbar(res.message, 'success');
      await muatAllUsers();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-3xl glass-panel p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-[#ED1C24]" />
            <span>Kelola Akun & Manajemen Tim STO</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pengaturan profil pribadi, preferensi notifikasi, dan administrasi akun pengguna Telkom
          </p>
        </div>

        {/* Tab switch for Pimpinan */}
        {user.role === 'pimpinan' && (
          <div className="flex rounded-2xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('profil')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'profil'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Profil Saya
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#ED1C24]" />
              <span>Manajemen Akun Tim ({allUsers.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Profil Saya & Audio */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Profil */}
          <Tilt3DCard className="rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-200 dark:border-slate-800">
              Informasi Akun Anda
            </h3>

            <form onSubmit={handleSimpanProfil} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileForm.nama_lengkap}
                    onChange={(e) => setProfileForm({ ...profileForm, nama_lengkap: e.target.value })}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Alamat Email <span className="text-slate-400 font-normal">(ID Autentikasi)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Telegram Chat ID <span className="text-slate-400 font-normal">(Untuk Notifikasi)</span>
                </label>
                <div className="relative">
                  <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Contoh: 8003576551"
                    value={profileForm.telegram_chat_id}
                    onChange={(e) => setProfileForm({ ...profileForm, telegram_chat_id: e.target.value })}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ganti Kata Sandi <span className="text-slate-400 font-normal">(Kosongkan bila tidak diubah)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Masukkan kata sandi baru..."
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                disabled={savingProfile}
                className="w-full rounded-2xl py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50 bg-[#ED1C24] cursor-pointer"
              >
                {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan Akun'}
              </button>
            </form>
          </Tilt3DCard>

          {/* Audio Chime Settings */}
          <Tilt3DCard className="rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-200 dark:border-slate-800">
              Notifikasi Suara Bell (Ding-Dong)
            </h3>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-500" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    Audio Chime Realtime
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {soundEnabled ? 'Aktif (Berbunyi saat tugas masuk/selesai)' : 'Mati / Senyap'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {soundEnabled ? 'Matikan' : 'Aktifkan'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerDingDong();
                showSnackbar('Bunyi notifikasi bell berhasil diuji coba!', 'success');
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Volume2 className="w-4 h-4 text-[#ED1C24]" />
              <span>🔊 Uji Coba Bunyi Bell Notifikasi (Ding-Dong)</span>
            </button>
          </Tilt3DCard>
        </div>
      )}

      {/* TAB 2: Pimpinan Manajemen Akun & Pendaftaran Akun Baru */}
      {activeTab === 'users' && user.role === 'pimpinan' && (
        <div className="space-y-6">
          {/* Form Pendaftaran Akun Pengguna Baru Langsung */}
          <Tilt3DCard className="rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#ED1C24]" />
                <span>Daftarkan Akun Pengguna Baru (Langsung Aktif)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Khusus Pimpinan STO</span>
            </div>

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Lengkap Pegawai
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Natasya / Ari"
                  value={newUserForm.nama_lengkap}
                  onChange={(e) => setNewUserForm({ ...newUserForm, nama_lengkap: e.target.value })}
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="pegawai@gmail.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kata Sandi Awal
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Role Akses
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="teknisi">👷 Teknisi Patroli (Mobile/Web)</option>
                  <option value="pimpinan">👔 Pimpinan / Koordinator (Web)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Telegram Chat ID <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 8003576551"
                  value={newUserForm.telegram_chat_id}
                  onChange={(e) => setNewUserForm({ ...newUserForm, telegram_chat_id: e.target.value })}
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  disabled={creatingUser}
                  className="w-full rounded-2xl py-2.5 text-xs font-bold text-white shadow-md bg-[#ED1C24] hover:bg-red-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {creatingUser ? 'Menyimpan Akun...' : 'Tambahkan Akun Pengguna'}
                </button>
              </div>
            </form>
          </Tilt3DCard>

          {/* Tabel Daftar Seluruh Pengguna */}
          <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Daftar Seluruh Pengguna Sistem ({allUsers.length} Akun)
                </h3>
              </div>
              <button
                onClick={muatAllUsers}
                disabled={loadingUsers}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3">ID</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Telegram Chat ID</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3 font-mono font-bold text-slate-400">#{u.id}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{u.nama_lengkap}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'pimpinan'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">
                        {u.telegram_chat_id || '-'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => setResetModalUser(u)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition"
                          title="Reset Kata Sandi"
                        >
                          Reset Pass
                        </button>
                        {u.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.nama_lengkap)}
                            className="p-1 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition"
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#ED1C24]" />
              <span>Reset Password: {resetModalUser.nama_lengkap}</span>
            </h3>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi baru..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetModalUser(null);
                    setNewPassword('');
                  }}
                  className="rounded-2xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#ED1C24] py-2.5 text-xs font-bold text-white shadow-md transition"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
