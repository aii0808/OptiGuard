import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  MapPin,
  Bell,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../theme.jsx';

export default function DashboardTeknisi() {
  const { user } = useAuth();
  const theme = useTheme();
  const primaryColor = theme?.accent?.primary || theme?.primaryColor || '#ED1C24';
  const [tiketSaya, setTiketSaya] = useState([]);
  const [openPool, setOpenPool] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function muat() {
      try {
        const [myTickets, pool] = await Promise.all([
          api('/tiket'),
          api('/tiket/open-pool'),
        ]);
        setTiketSaya(myTickets || []);
        setOpenPool(pool || []);
      } catch (err) {
        console.error('Error load teknisi dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    muat();
  }, []);

  const pendingSaya = tiketSaya.filter((t) => t.status_tiket === 'Pending').length;
  const inProgressSaya = tiketSaya.filter((t) => t.status_tiket === 'In Progress').length;
  const selesaiSaya = tiketSaya.filter((t) => t.status_tiket === 'Selesai').length;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white border border-slate-700/60 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Teknisi Patroli Siaga</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Halo, {user.nama}
          </h1>
          <p className="text-xs text-slate-400 max-w-lg">
            Siap melaksanakan inspeksi fisik dan preventive maintenance ODP di wilayah kerja STO Payakumbuh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/tugas"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-lg transition active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Buka Tugas Patroli</span>
          </NavLink>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Tugas Berjalan */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-amber-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Sedang Berjalan</span>
            <div className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{inProgressSaya}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tiket In Progress</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Tugas Pending */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Antrean Tugas</span>
            <div className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{pendingSaya}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Menunggu Dimulai</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* Tugas Selesai */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-emerald-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tugas Selesai</span>
            <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{selesaiSaya}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Audit Tervalidasi</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Open Pool Tersedia */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-blue-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Open Pool Siaga</span>
            <div className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">{openPool.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Siap Diambil</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500">
            <Bell className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Open Pool Highlights */}
      {openPool.length > 0 && (
        <div className="rounded-3xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500 text-white">
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Tersedia {openPool.length} Tugas di Open Pool
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tugas ini belum ditugaskan ke teknisi mana pun. Anda dapat langsung mengklaimnya sekarang!
                </p>
              </div>
            </div>
            <NavLink
              to="/tugas"
              className="flex items-center gap-1 rounded-xl bg-blue-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-blue-700 transition"
            >
              <span>Klaim di Open Pool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>
      )}

      {/* Daftar Tugas Terbaru Saya */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Daftar Tugas Patroli Saya
          </h3>
          <NavLink to="/tugas" className="text-xs font-bold text-red-500 hover:underline">
            Lihat Semua Tugas →
          </NavLink>
        </div>

        {tiketSaya.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Belum ada tugas yang ditugaskan ke Anda.</p>
        ) : (
          <div className="space-y-2">
            {tiketSaya.slice(0, 4).map((t) => (
              <NavLink
                key={t.id}
                to="/tugas"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition"
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                    Tiket #{t.id} · Klaster Area: {t.area_klaster}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tanggal Tugas: {t.tanggal_tugas || '-'}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    t.status_tiket === 'Selesai'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : t.status_tiket === 'In Progress'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t.status_tiket}
                </span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
