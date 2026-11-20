import { useEffect, useState, useCallback } from 'react';
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

  const namaTeknisi = (id) => {
    if (id === 99) return '📢 Open Pool (Siaga Terbuka)';
    return teknisiList.find((t) => t.id === id)?.nama_lengkap || `#${id}`;
  };

  async function handleBuatTugas(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        area_klaster: form.area_klaster,
        teknisi_id: form.teknisi_id === 'pool' ? 99 : Number(form.teknisi_id),
        tanggal_tugas: form.tanggal_tugas || undefined,
      };
      const res = await api('/tiket', { method: 'POST', body });
      showSnackbar(
        `Tiket #${res.tiket.id} (${form.area_klaster}) dibuat! Notifikasi: ${
          res.telegram_terkirim ? 'Terkirim ke Telegram.' : 'Selesai.'
        }`,
        'success'
      );
      setForm({ ...form, area_klaster: '' });
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
            Tentukan area klaster ODP dan tugaskan teknisi langsung atau masukkan ke Open Pool
          </p>
        </div>

        <form onSubmit={handleBuatTugas} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Area Klaster
            </label>
            <select
              required
              value={form.area_klaster}
              onChange={(e) => setForm({ ...form, area_klaster: e.target.value })}
              className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-200"
            >
              <option value="">-- Pilih Wilayah Patroli --</option>
              {areas.map((a) => (
                <option key={a} value={a}>Klaster: {a}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tugaskan Kepada
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
              Jadwal Tanggal Patroli
            </label>
            <input
              type="date"
              value={form.tanggal_tugas}
              onChange={(e) => setForm({ ...form, tanggal_tugas: e.target.value })}
              className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white shadow-xl transition active:scale-95 disabled:opacity-50 bg-[#ED1C24] hover:bg-red-700 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Membuat Tiket & Mengirim Broadcast...' : 'Buat Tugas & Broadcast Telegram'}</span>
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
            <span className="text-xs text-slate-400">Klik tiket untuk rincian audit ODP</span>
          </div>

          {tiketList.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Belum ada tiket patroli yang dibuat.</p>
          ) : (
            <div className="space-y-2">
              {tiketList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => lihatDetailTiket(t.id)}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-left transition cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                      Tiket #{t.id} · Area: {t.area_klaster}
                    </div>
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
              ))}
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
                className="rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAksiBlokir}
                className="rounded-2xl bg-[#ED1C24] hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-md transition"
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
                  Rincian Tiket #{detailTiket.tiket.id} · {detailTiket.tiket.area_klaster}
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
                    <span className="font-bold text-slate-800 dark:text-slate-100">{o.kode_odp}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${WARNA_STATUS[o.status_fisik] || 'text-slate-400'}`}>
                      {o.status_fisik}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">{o.alamat}</div>

                  {o.audit ? (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
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
                    <div className="text-slate-400 italic">Menunggu audit di lapangan oleh teknisi.</div>
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
