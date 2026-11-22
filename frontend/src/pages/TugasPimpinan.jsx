import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Send,
  PlusCircle,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronRight,
  X,
  ExternalLink,
  Navigation,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../theme.jsx';
import { useSnackbar } from '../components/Snackbar.jsx';
import { Tilt3DCard } from '../components/MouseEffect.jsx';

const WARNA_STATUS = {
  Aman: 'text-[#10B981] bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
  Normal: 'text-[#10B981] bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
  Warning: 'text-[#F59E0B] bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400',
  Critical: 'text-[#ED1C24] bg-red-100 dark:bg-red-950/60 dark:text-red-400',
};

const WARNA_TIKET = {
  Pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'In Progress': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400',
  Selesai: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400',
};

export default function TugasPimpinan() {
  const { user } = useAuth();
  const { triggerDingDong } = useTheme();
  const { showSnackbar } = useSnackbar();
  const [areas, setAreas] = useState([]);
  const [teknisiList, setTeknisiList] = useState([]);
  const [tiketList, setTiketList] = useState([]);
  const [odpList, setOdpList] = useState([]);
  const [activeTab, setActiveTab] = useState('tiket'); // 'tiket' | 'odp'

  const [form, setForm] = useState({
    area_klaster: '',
    teknisi_id: 'pool',
    tanggal_tugas: new Date().toISOString().split('T')[0],
  });

  // Selected ODP IDs in designated route sequence
  const [selectedOdpIds, setSelectedOdpIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [detailTiket, setDetailTiket] = useState(null);
  const [dialogBlokir, setDialogBlokir] = useState(null);
  const [alasanBlokir, setAlasanBlokir] = useState('');

  const muatData = useCallback(async () => {
    try {
      const [a, t, tk, od] = await Promise.all([
        api('/tiket/area'),
        api('/tiket/teknisi'),
        api('/tiket'),
        api('/dashboard/odp'),
      ]);
      setAreas(a);
      setTeknisiList(t);
      setTiketList(tk);
      setOdpList(od);
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    muatData();
  }, [muatData]);

  // When area_klaster changes, update available ODPs and auto-select all initially
  const availableOdpsInArea = useMemo(() => {
    if (!form.area_klaster) return [];
    return odpList.filter((o) => o.area === form.area_klaster);
  }, [odpList, form.area_klaster]);

  useEffect(() => {
    if (form.area_klaster && availableOdpsInArea.length > 0) {
      setSelectedOdpIds(availableOdpsInArea.map((o) => o.id));
    } else {
      setSelectedOdpIds([]);
    }
  }, [form.area_klaster, availableOdpsInArea]);

  const namaTeknisi = (id) => {
    if (id === 99) return '📢 Open Pool (Siaga Terbuka)';
    return teknisiList.find((t) => t.id === id)?.nama_lengkap || `#${id}`;
  };

  // Toggle ODP in selection list
  function toggleOdpSelection(id) {
    setSelectedOdpIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }

  // Move ODP position in the route sequence (up = -1, down = 1)
  function moveOdpRoute(index, direction) {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= selectedOdpIds.length) return;
    const updated = [...selectedOdpIds];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setSelectedOdpIds(updated);
  }

  // Optimize route sequence using nearest neighbor TSP
  function optimizeRouteSequence() {
    if (selectedOdpIds.length <= 2) {
      showSnackbar('Jumlah ODP minimal 3 titik untuk optimasi rute.', 'info');
      return;
    }
    const odpMap = new Map(odpList.map((o) => [o.id, o]));
    const unvisited = [...selectedOdpIds];
    const optimized = [unvisited.shift()]; // Start with the first chosen ODP

    while (unvisited.length > 0) {
      const current = odpMap.get(optimized[optimized.length - 1]);
      let nearestIdx = 0;
      let minDistance = Infinity;

      unvisited.forEach((id, idx) => {
        const candidate = odpMap.get(id);
        if (
          current &&
          candidate &&
          typeof current.latitude === 'number' &&
          typeof candidate.latitude === 'number'
        ) {
          const d = Math.hypot(
            candidate.latitude - current.latitude,
            candidate.longitude - current.longitude
          );
          if (d < minDistance) {
            minDistance = d;
            nearestIdx = idx;
          }
        }
      });

      optimized.push(unvisited.splice(nearestIdx, 1)[0]);
    }

    setSelectedOdpIds(optimized);
    showSnackbar('Rute berhasil diurutkan otomatis berdasarkan jarak terdekat!', 'success');
  }

  async function handleBuatTugas(e) {
    e.preventDefault();
    if (!form.area_klaster) {
      showSnackbar('Silakan pilih area klaster terlebih dahulu', 'warning');
      return;
    }
    if (selectedOdpIds.length === 0) {
      showSnackbar('Pilih minimal 1 titik ODP untuk ditugaskan', 'warning');
      return;
    }

    setLoading(true);
    try {
      const odpMap = new Map(odpList.map((o) => [o.id, o]));
      const ruteCodes = selectedOdpIds.map((id) => odpMap.get(id)?.kode_odp || `#${id}`);

      const body = {
        area_klaster: form.area_klaster,
        teknisi_id: form.teknisi_id === 'pool' ? 99 : Number(form.teknisi_id),
        tanggal_tugas: form.tanggal_tugas || undefined,
        odp_ids: selectedOdpIds,
        rute: ruteCodes,
      };

      const res = await api('/tiket', { method: 'POST', body });
      showSnackbar(
        `Tiket #${res.tiket.id} (${form.area_klaster} - ${selectedOdpIds.length} ODP) berhasil dibuat! Notifikasi: ${
          res.telegram_terkirim ? 'Terkirim ke Telegram.' : 'Selesai.'
        }`,
        'success'
      );
      setForm({ ...form, area_klaster: '' });
      setSelectedOdpIds([]);
      await muatData();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function lihatDetailTiket(id) {
    try {
      const detail = await api(`/tiket/${id}/odp`);
      setDetailTiket(detail);
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }

  async function handleAksiBlokir() {
    if (!dialogBlokir) return;
    try {
      if (dialogBlokir.jenis === 'blokir') {
        await api(`/dashboard/odp/${dialogBlokir.odp.id}/blokir`, {
          method: 'POST',
          body: { alasan: alasanBlokir },
        });
        showSnackbar(`ODP ${dialogBlokir.odp.kode_odp} berhasil diblokir di WebGIS.`, 'warning');
      } else {
        await api(`/dashboard/odp/${dialogBlokir.odp.id}/buka-blokir`, {
          method: 'POST',
        });
        showSnackbar(`Blokir ODP ${dialogBlokir.odp.kode_odp} telah dibuka.`, 'success');
      }
      setDialogBlokir(null);
      setAlasanBlokir('');
      await muatData();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }

  const odpLookup = useMemo(() => new Map(odpList.map((o) => [o.id, o])), [odpList]);

  return (
    <div className="space-y-6">
      {/* Header & Dispatching Form */}
      <Tilt3DCard className="rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#ED1C24]" />
            <span>Dispatching & Pembuatan Tiket Patroli Baru</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih wilayah klaster, tentukan titik-titik ODP yang wajib diperiksa, dan atur rute pengerjaannya.
          </p>
        </div>

        <form onSubmit={handleBuatTugas} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Pilih Wilayah / Klaster
              </label>
              <select
                required
                value={form.area_klaster}
                onChange={(e) => setForm({ ...form, area_klaster: e.target.value })}
                className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Pilih Wilayah Patroli --</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    Wilayah: {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Tugaskan Kepada
              </label>
              <select
                required
                value={form.teknisi_id}
                onChange={(e) => setForm({ ...form, teknisi_id: e.target.value })}
                className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-200"
              >
                <option value="pool">📢 Open Pool (Siaga Terbuka - Siapapun Bisa Ambil)</option>
                {teknisiList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id === 99 ? '📢 ' : '👷 '} {t.nama_lengkap}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                3. Jadwal Tanggal Patroli
              </label>
              <input
                type="date"
                value={form.tanggal_tugas}
                onChange={(e) => setForm({ ...form, tanggal_tugas: e.target.value })}
                className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* ODP Multi-Selection & Route Sequence Section */}
          {form.area_klaster && (
            <div className="rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#ED1C24]" />
                    <span>Pilih Titik ODP yang Wajib Diperiksa & Urutan Rute</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Centang ODP yang ditugaskan dan sesuaikan urutan langkah pengerjaan teknisi.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedOdpIds(availableOdpsInArea.map((o) => o.id))}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Pilih Semua ({availableOdpsInArea.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOdpIds([])}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Kosongkan</span>
                  </button>

                  <button
                    type="button"
                    onClick={optimizeRouteSequence}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition cursor-pointer flex items-center gap-1"
                    title="Urutkan otomatis rute terdekat secara geografis"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Rute Otomatis Terdekat</span>
                  </button>
                </div>
              </div>

              {/* Grid of ODP selectable cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                {availableOdpsInArea.map((o) => {
                  const isSelected = selectedOdpIds.includes(o.id);
                  const routeIndex = selectedOdpIds.indexOf(o.id);

                  return (
                    <div
                      key={o.id}
                      onClick={() => toggleOdpSelection(o.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-red-500/10 border-red-500/80 shadow-sm'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                              isSelected
                                ? 'bg-[#ED1C24] text-white shadow-sm'
                                : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                            }`}
                          >
                            {isSelected ? routeIndex + 1 : '○'}
                          </span>
                          <span className="font-black text-xs text-slate-800 dark:text-slate-100 truncate">
                            {o.kode_odp}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate pl-6">
                          {o.alamat}
                        </p>
                        <div className="text-[10px] pl-6 flex items-center gap-2">
                          <span className="text-slate-600 dark:text-slate-300">
                            Port: <b>{o.port_terpakai ?? 0}/{o.kapasitas_port}</b>
                          </span>
                          <span className={`font-bold ${WARNA_STATUS[o.status_fisik] || 'text-slate-400'}`}>
                            {o.status_fisik}
                          </span>
                        </div>
                      </div>

                      {/* Reorder buttons if selected */}
                      {isSelected && (
                        <div
                          className="flex flex-col gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={routeIndex === 0}
                            onClick={() => moveOdpRoute(routeIndex, -1)}
                            className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 text-slate-700 dark:text-slate-200"
                            title="Pindah urutan lebih awal"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={routeIndex === selectedOdpIds.length - 1}
                            onClick={() => moveOdpRoute(routeIndex, 1)}
                            className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 text-slate-700 dark:text-slate-200"
                            title="Pindah urutan lebih akhir"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Visualized Sequential Inspection Route */}
              {selectedOdpIds.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <Navigation className="w-3.5 h-3.5 text-[#ED1C24]" />
                      <span>Rute Pengerjaan Terjadwal ({selectedOdpIds.length} Titik ODP):</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      Urutan Langkah 1 s/d {selectedOdpIds.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                    {selectedOdpIds.map((id, idx) => {
                      const odp = odpLookup.get(id);
                      return (
                        <div key={id} className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-white border border-slate-700 flex items-center gap-1.5 shadow-sm">
                            <span className="w-4 h-4 rounded-full bg-[#ED1C24] text-white text-[9px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <b className="text-white text-[11px]">{odp?.kode_odp || `ODP #${id}`}</b>
                          </span>
                          {idx < selectedOdpIds.length - 1 && (
                            <span className="text-red-500 font-black text-sm">➔</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white shadow-xl transition active:scale-95 disabled:opacity-50 bg-[#ED1C24] hover:bg-red-700 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {loading
                  ? 'Membuat Tiket & Mengirim Broadcast...'
                  : `Buat Tugas & Broadcast Rute ke Telegram (${selectedOdpIds.length} ODP)`}
              </span>
            </button>
          </div>
        </form>
      </Tilt3DCard>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tiket')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'tiket'
              ? 'bg-[#ED1C24] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Daftar Tiket Patroli ({tiketList.length})
        </button>
        <button
          onClick={() => setActiveTab('odp')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'odp'
              ? 'bg-[#ED1C24] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Pemantauan & Audit Port ODP ({odpList.length})
        </button>
      </div>

      {/* Tab 1: Daftar Tiket Patroli */}
      {activeTab === 'tiket' && (
        <div className="rounded-3xl glass-panel p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Riwayat Seluruh Tiket Patroli
            </h3>
            <span className="text-xs text-slate-400">Klik tiket untuk rincian rute & audit ODP</span>
          </div>

          {tiketList.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada tiket patroli yang dibuat.
            </p>
          ) : (
            <div className="space-y-2">
              {tiketList.map((t) => {
                const areaName = t.area_name || t.area_klaster;
                return (
                  <button
                    key={t.id}
                    onClick={() => lihatDetailTiket(t.id)}
                    className="flex w-full items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-left transition cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>Tiket #{t.id} · Area: {areaName}</span>
                      </div>

                      {/* Display Rute if specified */}
                      {Array.isArray(t.rute) && t.rute.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Navigation className="w-3 h-3 text-[#ED1C24]" />
                          <span className="font-mono text-slate-300">
                            {t.rute.join(' ➔ ')}
                          </span>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Teknisi: <b className="text-slate-700 dark:text-slate-200">{namaTeknisi(t.teknisi_id)}</b> · Tanggal: {t.tanggal_tugas || '-'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${WARNA_TIKET[t.status_tiket]}`}>
                        {t.status_tiket}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pemantauan ODP */}
      {activeTab === 'odp' && (
        <div className="rounded-3xl glass-panel p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Pengawasan Fisik & Audit Port ODP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Jika foto lapangan menunjukkan port penuh/rusak sedangkan WebGIS masih tersedia, Pimpinan dapat segera memblokir ODP.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {odpList.map((o) => (
              <Tilt3DCard
                key={o.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{o.kode_odp}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${WARNA_STATUS[o.status_fisik] || 'text-slate-400'}`}>
                    {o.status_fisik}
                  </span>
                </div>

                <div className="text-slate-500 dark:text-slate-400 leading-snug">{o.alamat}</div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                  <span>Klaster: <b>{o.area || '-'}</b></span>
                  <span>Port: <b>{o.port_terpakai ?? 0} / {o.kapasitas_port}</b></span>
                  <span>WebGIS: <b>{o.status}</b></span>
                </div>

                {/* Audit Terakhir */}
                {o.audit_terakhir ? (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div className="text-[11px] space-y-0.5">
                      <div>Audit: <b>{new Date(o.audit_terakhir.waktu_audit).toLocaleDateString('id-ID')}</b></div>
                      <div className="text-slate-400">
                        Tiang {o.audit_terakhir.kondisi_tiang} · Boks {o.audit_terakhir.kondisi_boks} · Kabel {o.audit_terakhir.kondisi_kabel} · Port {o.audit_terakhir.kondisi_port}
                      </div>
                    </div>
                    {o.audit_terakhir.foto_bukti && (
                      <a href={o.audit_terakhir.foto_bukti} target="_blank" rel="noreferrer" className="shrink-0">
                        <img src={o.audit_terakhir.foto_bukti} alt="Eviden" className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-600 shadow-sm" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">Belum ada riwayat audit fisik.</div>
                )}

                {/* Blokir Action */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50">
                  {o.diblokir ? (
                    <div className="text-red-600 font-semibold text-[11px] flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>DIBLOKIR: {o.alasan_blokir || 'Port penuh'}</span>
                    </div>
                  ) : (
                    <span className="text-emerald-600 font-semibold text-[11px]">Status Aktif</span>
                  )}

                  {o.diblokir ? (
                    <button
                      onClick={() => setDialogBlokir({ jenis: 'buka', odp: o })}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Buka Blokir</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setDialogBlokir({ jenis: 'blokir', odp: o })}
                      className="px-3 py-1.5 rounded-xl bg-[#ED1C24] hover:bg-red-700 text-white font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Blokir ODP</span>
                    </button>
                  )}
                </div>
              </Tilt3DCard>
            ))}
          </div>
        </div>
      )}

      {/* Modal Dialog Blokir ODP */}
      {dialogBlokir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl glass-panel p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>{dialogBlokir.jenis === 'blokir' ? 'Blokir ODP' : 'Buka Blokir ODP'} {dialogBlokir.odp.kode_odp}</span>
            </h3>

            {dialogBlokir.jenis === 'blokir' ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Status ODP di WebGIS akan diubah menjadi <b>Penuh</b> agar teknisi pasang baru tidak diarahkan ke titik ini.
                </p>
                <textarea
                  rows={3}
                  value={alasanBlokir}
                  onChange={(e) => setAlasanBlokir(e.target.value)}
                  placeholder="Alasan pemblokiran (misal: Port rusak / penuh sesuai eviden foto lapangan)..."
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin membuka pemblokiran ODP ini? Status WebGIS akan dikembalikan ke status sebelumnya.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDialogBlokir(null)}
                className="rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAksiBlokir}
                className="rounded-2xl bg-[#ED1C24] hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Detail Tiket */}
      {detailTiket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl glass-panel p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  Rincian Tiket #{detailTiket.tiket.id} · {detailTiket.area_name || detailTiket.tiket.area_klaster}
                </h3>
                <p className="text-xs text-slate-400">
                  Status: <b>{detailTiket.tiket.status_tiket}</b> · Teknisi: <b>{namaTeknisi(detailTiket.tiket.teknisi_id)}</b>
                </p>
              </div>
              <button
                onClick={() => setDetailTiket(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Display Rute Sequence in detail modal */}
            {Array.isArray(detailTiket.rute) && detailTiket.rute.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#ED1C24]" />
                  <span>Rute Pengerjaan Sesuai Penugasan:</span>
                </div>
                <div className="text-xs font-mono text-slate-200 font-bold">
                  {detailTiket.rute.join(' ➔ ')}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Daftar Titik ODP Dalam Tiket ({detailTiket.odp.length})
              </h4>
              {detailTiket.odp.map((o) => (
                <div
                  key={o.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#ED1C24] text-white text-[10px] font-black flex items-center justify-center">
                        {o.urutan_rute || '•'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{o.kode_odp}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${WARNA_STATUS[o.status_fisik] || 'text-slate-400'}`}>
                      {o.status_fisik}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 pl-7">{o.alamat}</div>

                  {o.audit ? (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between pl-7">
                      <div>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Sudah Diaudit (Hasil: {o.audit.status_akhir})
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tiang {o.audit.kondisi_tiang} · Boks {o.audit.kondisi_boks} · Kabel {o.audit.kondisi_kabel} · Port {o.audit.kondisi_port}
                        </div>
                      </div>
                      {o.audit.foto_bukti && (
                        <a href={o.audit.foto_bukti} target="_blank" rel="noreferrer">
                          <img src={o.audit.foto_bukti} alt="Eviden" className="w-12 h-12 rounded-xl object-cover border" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic pl-7">Menunggu audit di lapangan oleh teknisi.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
