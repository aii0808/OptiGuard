import { useEffect, useState, useMemo } from 'react';
import {
  Printer,
  FileText,
  Calendar,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  MapPin,
  User,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../theme.jsx';
import Logo from '../components/Logo.jsx';

const WARNA_STATUS = {
  Aman: 'text-[#10B981] bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
  Normal: 'text-[#10B981] bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
  Warning: 'text-[#F59E0B] bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400',
  Critical: 'text-[#ED1C24] bg-red-100 dark:bg-red-950/60 dark:text-red-400',
};

export default function Laporan() {
  const { user } = useAuth();
  const theme = useTheme();
  const primaryColor = theme?.accent?.primary || theme?.primaryColor || '#ED1C24';
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterArea, setFilterArea] = useState('Semua');
  const [cariOdp, setCariOdp] = useState('');
  const [previewTiketId, setPreviewTiketId] = useState(null);

  useEffect(() => {
    async function muat() {
      try {
        const data = await api('/audit/laporan');
        setLaporan(data || []);
      } catch (err) {
        console.error('Error load laporan:', err);
      } finally {
        setLoading(false);
      }
    }
    muat();
  }, []);

  const areas = useMemo(() => {
    const set = new Set();
    laporan.forEach((r) => { if (r.area_klaster) set.add(r.area_klaster); });
    return ['Semua', ...Array.from(set).sort()];
  }, [laporan]);

  const filtered = useMemo(() => {
    return laporan.filter((r) => {
      const matchArea = filterArea === 'Semua' || r.area_klaster === filterArea;
      const matchOdp = !cariOdp || r.odp?.kode_odp?.toLowerCase().includes(cariOdp.toLowerCase());
      const matchTiket = !previewTiketId || r.tiket_id === previewTiketId;
      return matchArea && matchOdp && matchTiket;
    });
  }, [laporan, filterArea, cariOdp, previewTiketId]);

  function triggerCetak() {
    window.print();
  }

  // Get current date string for document
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Printable Area Container */}
      <div className="print-area">
        {/* Header Resmi Kop Surat (Hanya Tampil Saat Cetak atau Preview Mode) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xl">
                TA
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  PT TELKOM AKSES · STO PAYAKUMBUH
                </h1>
                <p className="text-xs text-slate-600">
                  Sub Regional Sumatera Barat · Jl. Jenderal Sudirman No. 12, Payakumbuh
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Sistem Informasi Validasi Instalasi & Preventive Maintenance ODP (OptiGuard)
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-700">
              <div className="font-bold">BERITA ACARA LAPORAN PATROLI</div>
              <div className="text-[11px]">Tanggal Cetak: {todayStr}</div>
              <div className="text-[10px] font-mono">Dok: BA-VALINS-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>
        </div>

        {/* Action Bar (No Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200 dark:border-slate-800 shadow-sm no-print">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: primaryColor }} />
              <span>Laporan Berita Acara Pekerjaan & Preventive Maintenance</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dokumentasi hasil audit kelayakan fisik ODP siap cetak dengan kop surat, border, dan pengesahan resmi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerCetak}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-lg transition active:scale-95 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Export PDF Berita Acara</span>
            </button>
          </div>
        </div>

        {/* Filter Controls (No Print) */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 no-print">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan Kode ODP..."
              value={cariOdp}
              onChange={(e) => setCariOdp(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 pl-10 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Area Klaster:</span>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none"
            >
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {previewTiketId && (
            <button
              onClick={() => setPreviewTiketId(null)}
              className="text-xs font-bold text-red-500 hover:underline"
            >
              Tampilkan Semua Tiket (Reset Filter)
            </button>
          )}
        </div>

        {/* Report Table / Documents */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-4">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Rincian Hasil Audit Lapangan ({filtered.length} Data)
            </h3>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {loading ? 'Memuat data laporan...' : 'Belum ada riwayat audit yang selesai pada filter ini.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3">No. Tiket / Tanggal</th>
                    <th className="p-3">Kode ODP & Klaster</th>
                    <th className="p-3">Teknisi Pelaksana</th>
                    <th className="p-3">Checklist (Tiang / Boks / Kabel / Port)</th>
                    <th className="p-3">Status Akhir</th>
                    <th className="p-3">Foto Eviden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3 align-top font-medium">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          #{item.tiket_id}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.waktu_audit).toLocaleDateString('id-ID')}
                        </div>
                      </td>

                      <td className="p-3 align-top">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.odp.kode_odp}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.odp.alamat} (Area: {item.area_klaster})
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Port: {item.odp.port_terpakai ?? 0} / {item.odp.kapasitas_port}
                        </div>
                      </td>

                      <td className="p-3 align-top">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.teknisi_nama}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Penugas: {item.pimpinan_nama}
                        </div>
                      </td>

                      <td className="p-3 align-top font-mono text-[11px]">
                        <div>Tiang: {item.kondisi.tiang === 1 ? 'Aman' : item.kondisi.tiang === 2 ? 'Rusak Ringan' : 'Rusak Berat'}</div>
                        <div>Boks: {item.kondisi.boks === 1 ? 'Aman' : item.kondisi.boks === 2 ? 'Rusak Ringan' : 'Rusak Berat'}</div>
                        <div>Kabel: {item.kondisi.kabel === 1 ? 'Rapi' : item.kondisi.kabel === 2 ? 'Kendur' : 'Rusak'}</div>
                        <div>Port: {item.kondisi.port === 1 ? 'Bersih' : item.kondisi.port === 2 ? 'Berdebu' : 'Kotor/Rusak'}</div>
                      </td>

                      <td className="p-3 align-top">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${WARNA_STATUS[item.status_akhir] || 'text-slate-400'}`}>
                          {item.status_akhir}
                        </span>
                      </td>

                      <td className="p-3 align-top">
                        {item.foto_bukti ? (
                          <a href={item.foto_bukti} target="_blank" rel="noreferrer">
                            <img
                              src={item.foto_bukti}
                              alt="Eviden"
                              className="w-14 h-14 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
                            />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Tidak ada foto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Lembar Tanda Tangan Resmi (Tampil Saat Dicetak) */}
        <div className="hidden print:block mt-12 pt-6 border-t border-slate-400 text-xs text-slate-900">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div className="space-y-16">
              <div>
                <p className="font-semibold">Mengetahui & Menyetujui,</p>
                <p className="text-slate-600">Pimpinan / Koordinator STO Payakumbuh</p>
              </div>
              <div>
                <p className="font-bold underline uppercase">( Robby Permana Putra )</p>
                <p className="text-[10px] text-slate-500">NIK. 89201928 / STO Payakumbuh</p>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <p className="font-semibold">Pelaksana Lapangan,</p>
                <p className="text-slate-600">Teknisi Patroli Preventive Maintenance</p>
              </div>
              <div>
                <p className="font-bold underline uppercase">( {user.nama || 'Teknisi Patroli'} )</p>
                <p className="text-[10px] text-slate-500">Petugas Valins Lapangan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
