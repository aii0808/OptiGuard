import { useEffect, useState } from 'react';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Send,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api.js';
import { useSnackbar } from '../components/Snackbar.jsx';
import { Tilt3DCard } from '../components/MouseEffect.jsx';

export default function ApprovalTeknisi() {
  const { showSnackbar } = useSnackbar();
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  async function muat() {
    try {
      setLoading(true);
      const list = await api('/auth/pending-users');
      setPendingList(list || []);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []);

  async function handleApprove(id, nama) {
    if (!window.confirm(`Setujui pendaftaran teknisi "${nama}"? Akun ini akan aktif dan dapat login.`)) return;
    setActionId(id);
    try {
      const res = await api(`/auth/approve-user/${id}`, { method: 'POST' });
      showSnackbar(res.message, 'success');
      await muat();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id, nama) {
    if (!window.confirm(`Tolak pendaftaran teknisi "${nama}"?`)) return;
    setActionId(id);
    try {
      const res = await api(`/auth/reject-user/${id}`, { method: 'POST' });
      showSnackbar(res.message, 'info');
      await muat();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl glass-panel p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#ED1C24]" />
            <span>Verifikasi & Persetujuan Registrasi Teknisi Baru</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sesuai aturan operasional, seluruh akun teknisi yang mendaftar wajib disetujui Pimpinan sebelum diberikan hak akses ke sistem
          </p>
        </div>

        <button
          onClick={muat}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
          Antrean Persetujuan ({pendingList.length})
        </h3>

        {pendingList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <p>Tidak ada pendaftaran teknisi baru yang menunggu persetujuan saat ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingList.map((item) => (
              <Tilt3DCard
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {item.nama_lengkap}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{item.email}</span>
                    </span>
                    {item.telegram_chat_id && (
                      <span className="flex items-center gap-1 text-sky-500 font-mono">
                        <Send className="w-3.5 h-3.5" />
                        <span>Chat ID: {item.telegram_chat_id}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.created_at).toLocaleString('id-ID')}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionId === item.id}
                    onClick={() => handleReject(item.id, item.nama_lengkap)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak</span>
                  </button>

                  <button
                    disabled={actionId === item.id}
                    onClick={() => handleApprove(item.id, item.nama_lengkap)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50 bg-[#ED1C24] hover:bg-red-700 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{actionId === item.id ? 'Memproses...' : 'Setujui Akun'}</span>
                  </button>
                </div>
              </Tilt3DCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
