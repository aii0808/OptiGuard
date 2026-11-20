import { useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  ClipboardList,
  MapPin,
  UserCheck,
  ArrowUpRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../api.js';
import { useTheme } from '../theme.jsx';
import { Tilt3DCard } from '../components/MouseEffect.jsx';

const STATUS_COLORS = {
  Aman: '#10B981',
  Warning: '#F59E0B',
  Critical: '#ED1C24',
};

export default function DashboardPimpinan() {
  const { darkMode } = useTheme();
  const [rekap, setRekap] = useState({ Aman: 0, Warning: 0, Critical: 0 });
  const [statistik, setStatistik] = useState(null);
  const [tiketList, setTiketList] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function muatData() {
      try {
        const [r, s, t, p] = await Promise.all([
          api('/dashboard'),
          api('/dashboard/statistik'),
          api('/tiket'),
          api('/auth/pending-users'),
        ]);
        setRekap(r);
        setStatistik(s);
        setTiketList(t);
        setPendingCount(p.length || 0);
      } catch (err) {
        console.error('Gagal memuat data dashboard:', err);
      }
    }
    muatData();
  }, []);

  const totalOdp = (rekap.Aman || 0) + (rekap.Warning || 0) + (rekap.Critical || 0);

  // Data Pie Chart Status ODP
  const pieData = useMemo(() => [
    { name: 'Aman / Layak', value: rekap.Aman || 0, color: STATUS_COLORS.Aman },
    { name: 'Warning (Waspada)', value: rekap.Warning || 0, color: STATUS_COLORS.Warning },
    { name: 'Critical (Rusak Berat)', value: rekap.Critical || 0, color: STATUS_COLORS.Critical },
  ], [rekap]);

  // Data Bar Chart Komponen Kerusakan
  const barKomponenData = useMemo(() => {
    if (!statistik?.komponen) return [];
    const labels = { tiang: 'Tiang', boks: 'Boks', kabel: 'Kabel', port: 'Port' };
    return Object.entries(statistik.komponen).map(([k, v]) => ({
      name: labels[k] || k,
      'Rusak Ringan': v.ringan || 0,
      'Rusak Berat': v.berat || 0,
    }));
  }, [statistik]);

  // Data Bar Chart Area
  const barAreaData = useMemo(() => {
    if (!statistik?.area) return [];
    return statistik.area.map((a) => ({
      name: a.nama,
      Aman: a.Aman || 0,
      Warning: a.Warning || 0,
      Critical: a.Critical || 0,
    }));
  }, [statistik]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <Tilt3DCard className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white/90">
            <Activity className="w-3.5 h-3.5 text-[#ED1C24]" />
            <span>Monitoring Room STO Payakumbuh</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Dashboard Pemantauan & Preventif ODP
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Sistem pengawasan validasi instalasi fisik (E-Valins) terintegrasi dengan WebGIS Satelit Hybrid dan Bot Telegram secara real-time.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 relative z-10">
          <NavLink
            to="/tiket"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-lg transition active:scale-95 bg-[#ED1C24] hover:bg-red-700 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Buat Tugas Patroli</span>
          </NavLink>
          <NavLink
            to="/webgis"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>Lihat WebGIS Satelit</span>
          </NavLink>
        </div>
      </Tilt3DCard>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total ODP */}
        <Tilt3DCard className="rounded-3xl glass-panel p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total ODP Master</span>
            <div className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{totalOdp}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Terdaftar di Sistem Utama</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-inner">
            <MapPin className="w-5 h-5 text-sky-500" />
          </div>
        </Tilt3DCard>

        {/* ODP Aman */}
        <Tilt3DCard className="rounded-3xl glass-panel p-4 sm:p-5 border border-emerald-500/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Kondisi Aman</span>
            <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{rekap.Aman || 0}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Layak Operasional</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Tilt3DCard>

        {/* ODP Warning */}
        <Tilt3DCard className="rounded-3xl glass-panel p-4 sm:p-5 border border-amber-500/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Warning</span>
            <div className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">{rekap.Warning || 0}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Perlu Perawatan</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 shadow-inner">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Tilt3DCard>

        {/* ODP Critical */}
        <Tilt3DCard className="rounded-3xl glass-panel p-4 sm:p-5 border border-red-500/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Critical</span>
            <div className="text-2xl font-black mt-1 text-red-600 dark:text-red-400">{rekap.Critical || 0}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Butuh Penanganan Segera</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500 shadow-inner">
            <AlertCircle className="w-5 h-5" />
          </div>
        </Tilt3DCard>
      </div>

      {/* Pending Approval Alert if any */}
      {pendingCount > 0 && (
        <NavLink
          to="/approval"
          className="flex items-center justify-between p-4 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 transition hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="font-bold text-xs sm:text-sm">
                Ada {pendingCount} Pendaftaran Teknisi Baru Menunggu Persetujuan
              </div>
              <div className="text-[11px] text-amber-700/80 dark:text-amber-300/70">
                Klik di sini untuk meninjau dan menyetujui akun teknisi agar dapat login.
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-amber-600" />
        </NavLink>
      )}

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Tilt3DCard className="rounded-3xl glass-panel p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Proporsi Kelayakan Fisik ODP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Berdasarkan kalkulasi otomatis checklist patroli lapangan
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
                    borderColor: darkMode ? '#334155' : '#E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: darkMode ? '#F8FAFC' : '#0F172A',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Tilt3DCard>

        {/* Bar Chart: Kerusakan per Komponen */}
        <Tilt3DCard className="rounded-3xl glass-panel p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Distribusi Kerusakan per Komponen
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kondisi Tiang, Boks, Kabel, dan Port dari audit terakhir
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barKomponenData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E2E8F0'} />
                <XAxis dataKey="name" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={11} />
                <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
                    borderColor: darkMode ? '#334155' : '#E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: darkMode ? '#F8FAFC' : '#0F172A',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Rusak Ringan" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rusak Berat" fill="#ED1C24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tilt3DCard>
      </div>

      {/* Bar Chart: Area Distribution */}
      <Tilt3DCard className="rounded-3xl glass-panel p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
          Kondisi ODP Berdasarkan Area Klaster
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Pemantauan sebaran ODP Aman, Warning, dan Critical pada setiap wilayah patroli STO
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barAreaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E2E8F0'} />
              <XAxis dataKey="name" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={11} />
              <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
                  borderColor: darkMode ? '#334155' : '#E2E8F0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: darkMode ? '#F8FAFC' : '#0F172A',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Aman" stackId="a" fill="#10B981" />
              <Bar dataKey="Warning" stackId="a" fill="#F59E0B" />
              <Bar dataKey="Critical" stackId="a" fill="#ED1C24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Tilt3DCard>
    </div>
  );
}
