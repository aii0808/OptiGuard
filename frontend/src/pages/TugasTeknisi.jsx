import { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Play,
  CheckCircle2,
  Camera,
  ArrowLeft,
  Navigation,
  Bell,
  Check,
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

const OPSI_KONDISI = [
  {
    key: 'boks',
    label: '1. Kondisi Fisik Boks ODP',
    subtitle: 'Periksa fisik boks, engsel, pintu, dan penguncian',
    opsi: [
      [1, 'Aman / Layak'],
      [2, 'Rusak Ringan'],
      [3, 'Rusak Berat'],
    ],
  },
  {
    key: 'tiang',
    label: '2. Kondisi Tiang Fiber Optik',
    subtitle: 'Periksa tiang penopang, kemiringan, dan korosi',
    opsi: [
      [1, 'Aman / Kokoh'],
      [2, 'Rusak Ringan'],
      [3, 'Rusak Berat'],
    ],
  },
  {
    key: 'kabel',
    label: '3. Kondisi Kabel Udara / Dropcore',
    subtitle: 'Periksa bentangan kabel drop core dan kerapian jalur',
    opsi: [
      [1, 'Rapi & Aman'],
      [2, 'Kendur'],
      [3, 'Putus / Rusak'],
    ],
  },
  {
    key: 'port',
    label: '4. Kondisi Port Konektor & Splitter',
    subtitle: 'Periksa kebersihan adapter dan redaman splitter',
    opsi: [
      [1, 'Bersih & Baik'],
      [2, 'Berdebu'],
      [3, 'Kotor / Rusak'],
    ],
  },
];

async function kompresGambar(file, maxSisi = 1280, kualitas = 0.8) {
  try {
    const bmp = await createImageBitmap(file);
    const skala = Math.min(1, maxSisi / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * skala);
    c.height = Math.round(bmp.height * skala);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', kualitas));
    return new File([blob], 'evidence.jpg', { type: 'image/jpeg' });
  } catch (err) {
    return file;
  }
}

function FormChecklistAudit({ tiketId, odp, onSelesai, onBatal }) {
  const { showSnackbar } = useSnackbar();
  const [nilai, setNilai] = useState({ tiang: 0, boks: 0, kabel: 0, port: 0 });
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  const lengkap = Object.values(nilai).every(Boolean) && foto;

  async function handlePilihFoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const k = await kompresGambar(f);
    setFoto(k);
    setPreview(URL.createObjectURL(k));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!lengkap) {
      showSnackbar('Harap lengkapi seluruh 4 poin checklist kondisi fisik dan unggah foto eviden.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('tiket_id', tiketId);
      fd.append('odp_id', odp.id);
      fd.append('tiang', nilai.tiang);
      fd.append('boks', nilai.boks);
      fd.append('kabel', nilai.kabel);
      fd.append('port', nilai.port);
      fd.append('foto', foto);
      if (catatan) fd.append('catatan', catatan);

      const res = await api('/audit', { method: 'POST', form: fd });
      showSnackbar(`Audit selesai! Status kelayakan fisik: ${res.status_akhir}`, 'success');
      onSelesai(res);
    } catch (e2) {
      showSnackbar(e2.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Tilt3DCard className="rounded-3xl glass-panel p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ED1C24]" />
            <span>Form Audit & Cek Kesehatan ODP: {odp.kode_odp}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{odp.alamat}</p>
        </div>
        <button
          type="button"
          onClick={onBatal}
          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          ✕ Batal
        </button>
      </div>

      {/* Panduan Rute & Navigasi Lokasi ODP */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs shadow-inner">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Koordinat GPS Titik ODP</div>
          <div className="font-mono text-white font-bold text-sm mt-0.5">
            {odp.latitude}, {odp.longitude}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Kapasitas Splitter: <b>{odp.port_terpakai ?? 0} / {odp.kapasitas_port || 8} Port</b>
          </div>
        </div>
        <a
          href={`https://www.google.com/maps?q=${odp.latitude},${odp.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md"
        >
          <Navigation className="w-4 h-4" />
          <span>Panduan Rute Google Maps</span>
        </a>
      </div>

      {/* 4 Poin Checklist Kesehatan Fisik ODP */}
      <div className="space-y-4 pt-1">
        {OPSI_KONDISI.map((p) => (
          <div key={p.key} className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {p.label}
              </label>
              <p className="text-[11px] text-slate-400">{p.subtitle}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {p.opsi.map(([val, teks]) => {
                const aktif = nilai[p.key] === val;
                return (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setNilai({ ...nilai, [p.key]: val })}
                    className={`py-2.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      aktif
                        ? val === 1
                          ? 'bg-emerald-500 text-white shadow-md'
                          : val === 2
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-red-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {aktif && <Check className="w-3.5 h-3.5" />}
                    <span>{teks}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Unggah Foto Eviden Lapangan */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          5. Foto Eviden Fisik Lapangan (Wajib)
        </label>
        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition bg-slate-50/50 dark:bg-slate-800/40">
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview Eviden" className="max-h-56 rounded-xl object-contain shadow-md" />
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-3 py-1 rounded-lg">
                Klik untuk ganti foto eviden
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1.5 text-slate-400 py-4">
              <div className="p-3 rounded-full bg-red-500/10 text-[#ED1C24]">
                <Camera className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Ambil Foto Kamera / Pilih dari Galeri
              </span>
              <span className="text-[11px] text-slate-400">Pastikan foto jelas menampilkan boks ODP / susunan splitter</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePilihFoto}
            className="hidden"
          />
        </label>
      </div>

      {/* Catatan Lapangan Opsional */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Catatan Tambahan Teknisi (Opsional)
        </label>
        <textarea
          rows={2}
          placeholder="Contoh: Boks sudah dirapikan, konektor port 4 dibersihkan dari debu..."
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-100"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2">
        <button
          type="button"
          onClick={onBatal}
          className="rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
        >
          Batal
        </button>
        <button
          disabled={!lengkap || loading}
          onClick={handleSubmit}
          className="col-span-2 rounded-2xl py-3 text-xs font-bold text-white shadow-xl transition active:scale-95 disabled:opacity-50 bg-[#ED1C24] hover:bg-red-700 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Menyimpan & Menghitung Grading...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesaikan Audit & Simpan Laporan</span>
            </>
          )}
        </button>
      </div>
    </Tilt3DCard>
  );
}

export default function TugasTeknisi() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [tab, setTab] = useState('saya'); // 'saya' | 'pool'
  const [daftarSaya, setDaftarSaya] = useState([]);
  const [daftarPool, setDaftarPool] = useState([]);
  const [aktifTiket, setAktifTiket] = useState(null);
  const [odpDipilih, setOdpDipilih] = useState(null);
  const [loading, setLoading] = useState(false);

  const muatData = useCallback(async () => {
    try {
      const [saya, pool] = await Promise.all([
        api('/tiket'),
        api('/tiket/open-pool'),
      ]);
      setDaftarSaya(saya || []);
      setDaftarPool(pool || []);
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    muatData();
  }, [muatData]);

  async function bukaTiket(id) {
    try {
      const res = await api(`/tiket/${id}/odp`);
      setAktifTiket(res);
      setOdpDipilih(null);
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }

  async function klaimOpenPool(id) {
    if (!window.confirm(`Klaim tiket #${id} untuk Anda kerjakan?`)) return;
    setLoading(true);
    try {
      const res = await api(`/tiket/${id}/klaim`, { method: 'POST' });
      showSnackbar(res.message, 'success');
      await muatData();
      setTab('saya');
      await bukaTiket(id);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleMulaiTiket(id) {
    try {
      await api(`/tiket/${id}/mulai`, { method: 'POST' });
      showSnackbar('Tiket dimulai! Silakan lakukan inspeksi pada setiap titik ODP.', 'success');
      await bukaTiket(id);
      await muatData();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }

  async function handleSelesaiAudit(res) {
    setOdpDipilih(null);
    await bukaTiket(aktifTiket.tiket.id);
    await muatData();
  }

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      {!aktifTiket && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setTab('saya')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'saya'
                ? 'bg-[#ED1C24] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Tugas Patroli Saya ({daftarSaya.length})</span>
          </button>

          <button
            onClick={() => setTab('pool')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'pool'
                ? 'bg-[#ED1C24] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Open Pool Siaga ({daftarPool.length})</span>
          </button>
        </div>
      )}

      {/* 1. List View: Tugas Saya */}
      {!aktifTiket && tab === 'saya' && (
        <div className="rounded-3xl glass-panel p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Daftar Tugas Yang Ditugaskan Kepada Anda
          </h3>

          {daftarSaya.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <p>Belum ada tugas yang ditugaskan ke Anda.</p>
              <button
                onClick={() => setTab('pool')}
                className="font-bold text-blue-500 hover:underline cursor-pointer"
              >
                Cek tugas yang tersedia di Open Pool →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {daftarSaya.map((t) => (
                <button
                  key={t.id}
                  onClick={() => bukaTiket(t.id)}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-left transition cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                      Tiket #{t.id} · Klaster: {t.area_name || t.area_klaster}
                    </div>
                    {Array.isArray(t.rute) && t.rute.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                        <Navigation className="w-3 h-3 text-[#ED1C24]" />
                        <span className="text-slate-300">{t.rute.join(' ➔ ')}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Jadwal Tanggal: {t.tanggal_tugas || '-'}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      t.status_tiket === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : t.status_tiket === 'In Progress'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t.status_tiket}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. List View: Open Pool */}
      {!aktifTiket && tab === 'pool' && (
        <div className="rounded-3xl glass-panel p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Antrean Tugas Open Pool Siaga
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tiket ini dibuat secara terbuka. Anda dapat mengklaimnya untuk segera dikerjakan.
            </p>
          </div>

          {daftarPool.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              Tidak ada tiket di Open Pool saat ini.
            </p>
          ) : (
            <div className="space-y-2.5">
              {daftarPool.map((t) => (
                <Tilt3DCard
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60"
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                      Tiket #{t.id} · Klaster: {t.area_name || t.area_klaster}
                    </div>
                    {Array.isArray(t.rute) && t.rute.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                        <Navigation className="w-3 h-3 text-[#ED1C24]" />
                        <span className="text-slate-300">{t.rute.join(' ➔ ')}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Jadwal: {t.tanggal_tugas || '-'} · Siaga Terbuka
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    onClick={() => klaimOpenPool(t.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50 bg-[#ED1C24] hover:bg-red-700 cursor-pointer"
                  >
                    Ambil / Klaim Tugas Ini
                  </button>
                </Tilt3DCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Detail View Tiket & Daftar ODP */}
      {aktifTiket && !odpDipilih && (() => {
        const totalOdp = aktifTiket.odp?.length || 0;
        const auditedCount = aktifTiket.odp?.filter((o) => !!o.audit).length || 0;
        const isTiketSelesai = aktifTiket.tiket.status_tiket === 'Selesai' || (totalOdp > 0 && auditedCount >= totalOdp);

        return (
          <div className="rounded-3xl glass-panel p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setAktifTiket(null);
                  setOdpDipilih(null);
                  muatData();
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar Tugas</span>
              </button>

              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                isTiketSelesai
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                Status: {isTiketSelesai ? 'Selesai' : aktifTiket.tiket.status_tiket}
              </span>
            </div>

            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                Tiket #{aktifTiket.tiket.id} · Klaster {aktifTiket.area_name || aktifTiket.tiket.area_name || aktifTiket.tiket.area_klaster}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Periksa kondisi tiang, boks, kabel, dan port splitter pada setiap titik ODP di bawah sesuai rute tugas.
              </p>
            </div>

            {/* Banner Sukses Jika Semua ODP Selesai */}
            {isTiketSelesai && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 space-y-1.5 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Tugas Tiket Patroli Telah Rampung 100%!</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seluruh {totalOdp} titik ODP telah berhasil divalidasi dan bukti foto tersimpan aman. Tiket ini telah ditandai Selesai dan dilaporkan otomatis ke grup Telegram STO.
                </p>
              </div>
            )}

            {/* Progres Validasi Bar */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <span>Progres Validasi ODP</span>
                <span>{auditedCount} dari {totalOdp} Selesai ({Math.round((auditedCount / (totalOdp || 1)) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-emerald-500"
                  style={{ width: `${Math.round((auditedCount / (totalOdp || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Rute Inspection Banner */}
            {Array.isArray(aktifTiket.rute) && aktifTiket.rute.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#ED1C24]" />
                    <span>Rute Pengerjaan Sesuai Penugasan:</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Ikuti sesuai urutan langkah</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                  {aktifTiket.rute.map((kode, idx) => (
                    <div key={kode} className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-white border border-slate-700 flex items-center gap-1.5 shadow-sm">
                        <span className="w-4 h-4 rounded-full bg-[#ED1C24] text-white text-[9px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <b className="text-white text-[11px]">{kode}</b>
                      </span>
                      {idx < aktifTiket.rute.length - 1 && <span className="text-red-500 font-bold">➔</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List of ODPs to audit */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Daftar Titik ODP Target ({aktifTiket.odp.length})
              </h4>

              {aktifTiket.odp.map((o) => {
                const sudahAudit = !!o.audit;
                const bisaAudit = !sudahAudit && !isTiketSelesai;

                return (
                  <Tilt3DCard
                    key={o.id}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#ED1C24] text-white text-[10px] font-black flex items-center justify-center">
                          {o.urutan_rute || '•'}
                        </span>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{o.kode_odp}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        WARNA_STATUS[o.audit?.status_akhir || o.status_fisik] || 'text-slate-400 border-slate-300'
                      }`}>
                        {o.audit?.status_akhir ? `Audit: ${o.audit.status_akhir}` : (o.status_fisik || 'Belum Diaudit')}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 font-medium">{o.alamat}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <a
                        href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Panduan Rute Maps</span>
                      </a>

                      {sudahAudit ? (
                        <div className="flex items-center gap-2">
                          {o.audit?.foto_bukti && (
                            <a
                              href={o.audit.foto_bukti}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-blue-500 hover:underline"
                            >
                              Lihat Eviden
                            </a>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Sudah Diaudit</span>
                          </span>
                        </div>
                      ) : (
                        bisaAudit && (
                          <button
                            onClick={() => setOdpDipilih(o)}
                            className="flex items-center gap-1.5 rounded-xl text-white px-4 py-2 text-xs font-bold shadow-md transition active:scale-95 bg-[#ED1C24] hover:bg-red-700 cursor-pointer"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Cek Kesehatan & Audit ODP</span>
                          </button>
                        )
                      )}
                    </div>
                  </Tilt3DCard>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 4. Form Checklist Active View */}
      {aktifTiket && odpDipilih && (
        <FormChecklistAudit
          tiketId={aktifTiket.tiket.id}
          odp={odpDipilih}
          onSelesai={handleSelesaiAudit}
          onBatal={() => setOdpDipilih(null)}
        />
      )}
    </div>
  );
}
