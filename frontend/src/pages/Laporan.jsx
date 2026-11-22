import { useEffect, useState, useMemo } from 'react';
import {
  Printer,
  FileText,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  MapPin,
  User,
  ShieldCheck,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../theme.jsx';

const WARNA_STATUS = {
  Aman: 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
  Normal: 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
  Warning: 'text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
  Critical: 'text-red-700 bg-red-100 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700',
};

/**
 * Format physical inspection components to natural descriptive technical Indonesian
 * (Never display raw numbers 1, 2, 3!)
 */
export function formatKondisiTeks(komponen, nilai) {
  const n = Number(nilai);
  if (komponen === 'tiang') {
    if (n === 1) return 'Aman / Kokoh';
    if (n === 2) return 'Miring / Keropos Ringan';
    if (n === 3) return 'Keropos Parah / Patah';
    return typeof nilai === 'string' && nilai ? nilai : 'Aman / Kokoh';
  }
  if (komponen === 'boks') {
    if (n === 1) return 'Aman / Terkunci Rapat';
    if (n === 2) return 'Kunci Rusak / Pengait Lepas';
    if (n === 3) return 'Pintu Terbuka / Boks Pecah';
    return typeof nilai === 'string' && nilai ? nilai : 'Aman / Terkunci Rapat';
  }
  if (komponen === 'kabel') {
    if (n === 1) return 'Rapi & Terpasang Aman';
    if (n === 2) return 'Kendur / Menjuntai';
    if (n === 3) return 'Terkelupas / Putus';
    return typeof nilai === 'string' && nilai ? nilai : 'Rapi & Aman';
  }
  if (komponen === 'port') {
    if (n === 1) return 'Bersih & Normal';
    if (n === 2) return 'Berdebu / Perlu Cleaning';
    if (n === 3) return 'Kotor / Rusak / Loss Tinggi';
    return typeof nilai === 'string' && nilai ? nilai : 'Bersih & Normal';
  }
  return String(nilai || '-');
}

export default function Laporan() {
  const { user } = useAuth();
  const theme = useTheme();
  const primaryColor = theme?.accent?.primary || theme?.primaryColor || '#ED1C24';
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTiketId, setSelectedTiketId] = useState('all');
  const [filterArea, setFilterArea] = useState('Semua');
  const [cariOdp, setCariOdp] = useState('');

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

  // Group audits by ticket to allow selecting individual finished tickets
  const daftarTiketSelesai = useMemo(() => {
    const map = new Map();
    laporan.forEach((r) => {
      if (!map.has(r.tiket_id)) {
        map.set(r.tiket_id, {
          tiket_id: r.tiket_id,
          area_klaster: r.area_klaster,
          rute: r.rute,
          tanggal_tugas: r.tanggal_tugas,
          status_tiket: r.status_tiket,
          teknisi_nama: r.teknisi_nama,
          pimpinan_nama: r.pimpinan_nama,
          items: [],
        });
      }
      map.get(r.tiket_id).items.push(r);
    });
    return Array.from(map.values()).sort((a, b) => b.tiket_id - a.tiket_id);
  }, [laporan]);

  // If initial load and tickets exist, default selected ticket to the latest one
  useEffect(() => {
    if (daftarTiketSelesai.length > 0 && selectedTiketId === 'all') {
      setSelectedTiketId(String(daftarTiketSelesai[0].tiket_id));
    }
  }, [daftarTiketSelesai]);

  const activeTiketInfo = useMemo(() => {
    if (selectedTiketId === 'all') return null;
    return daftarTiketSelesai.find((t) => String(t.tiket_id) === String(selectedTiketId)) || null;
  }, [daftarTiketSelesai, selectedTiketId]);

  const areas = useMemo(() => {
    const set = new Set();
    laporan.forEach((r) => { if (r.area_klaster) set.add(r.area_klaster); });
    return ['Semua', ...Array.from(set).sort()];
  }, [laporan]);

  const filtered = useMemo(() => {
    return laporan.filter((r) => {
      const matchTiket = selectedTiketId === 'all' || String(r.tiket_id) === String(selectedTiketId);
      const matchArea = filterArea === 'Semua' || r.area_klaster === filterArea;
      const matchOdp = !cariOdp || r.odp?.kode_odp?.toLowerCase().includes(cariOdp.toLowerCase());
      return matchTiket && matchArea && matchOdp;
    });
  }, [laporan, selectedTiketId, filterArea, cariOdp]);

  function triggerCetak() {
    const judulAsli = document.title;
    // Kosongkan judul dokumen sementara agar browser tidak mencetak judul di sudut kiri atas kertas
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = judulAsli;
    }, 1200);
  }

  // Indonesian formal date
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Printable Area Wrapper */}
      <div className="print-area">
        {/* Kop Surat Resmi PT Telkom Akses (Hanya Tampil Saat Dicetak) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#ED1C24] text-white flex items-center justify-center font-black text-xl rounded-lg border border-red-700">
                TA
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-slate-950 uppercase leading-tight">
                  PT TELKOM AKSES · STO PAYAKUMBUH
                </h1>
                <p className="text-[11px] font-semibold text-slate-700 leading-tight">
                  KANTOR DAERAH TELEKOMUNIKASI (DATEL) PAYAKUMBUH — WITEL SUMATERA BARAT
                </p>
                <p className="text-[9px] text-slate-600">
                  Jl. Jenderal Sudirman No. 12, Benteng, Kec. Payakumbuh Barat, Kota Payakumbuh | Telp: (0752) 92000
                </p>
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-800 leading-tight">
              <div className="font-extrabold text-[11px] uppercase tracking-wider text-slate-950">
                BERITA ACARA AUDIT (BAPP)
              </div>
              <div>Tanggal Cetak: <b>{todayStr}</b></div>
              <div className="font-mono text-[9px] text-slate-600">
                No: BA.VALINS/TA-PYK/{activeTiketInfo ? activeTiketInfo.tiket_id : 'REKAP'}/{new Date().getFullYear()}
              </div>
            </div>
          </div>
          <div className="mt-2 h-0.5 bg-slate-900 w-full" />
        </div>

        {/* Action Bar (No Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200 dark:border-slate-800 shadow-sm no-print">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#ED1C24]" />
              <span>Cetak Berita Acara & Laporan Pekerjaan Lapangan</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih tiket penugasan selesai untuk mencetak Berita Acara resmi 1 halaman A4 lengkap dengan kop instansi dan tanda tangan
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={triggerCetak}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-lg shadow-red-600/20 transition active:scale-95 cursor-pointer bg-[#ED1C24] hover:bg-red-700"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF Berita Acara (1 Halaman A4)</span>
            </button>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-tight">
              💡 <b>Tips:</b> Hapus centang <i>"Header dan footer"</i> di dialog cetak browser agar URL & tanggal browser tidak tercetak di tepi kertas.
            </span>
          </div>
        </div>

        {/* Filter Controls (No Print) */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 no-print mt-4">
          {/* Ticket Selector Dropdown */}
          <div className="flex items-center gap-2 min-w-[260px] flex-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
              Pilih Tiket Berita Acara:
            </span>
            <select
              value={selectedTiketId}
              onChange={(e) => setSelectedTiketId(e.target.value)}
              className="flex-1 rounded-xl border border-red-500/50 bg-red-50/50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">-- Semua Laporan Audit Lapangan (Rekap Global) --</option>
              {daftarTiketSelesai.map((t) => (
                <option key={t.tiket_id} value={String(t.tiket_id)}>
                  Tiket #{t.tiket_id} — Klaster {t.area_klaster} ({t.items.length} ODP) — Teknisi: {t.teknisi_nama}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode ODP..."
              value={cariOdp}
              onChange={(e) => setCariOdp(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
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
        </div>

        {/* Informasi Berita Acara Tiket Terpilih (Tampil di Print dan di Web) */}
        {activeTiketInfo && (
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 space-y-1.5 print:bg-white print:border-slate-800 print:p-2.5 print:text-[10px]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-2">
              <div>
                <span className="text-slate-500 print:text-slate-700 block text-[10px] uppercase font-bold">
                  Nomor Tiket
                </span>
                <span className="font-extrabold text-sm text-[#ED1C24] print:text-slate-950 font-mono">
                  #{activeTiketInfo.tiket_id}
                </span>
              </div>
              <div>
                <span className="text-slate-500 print:text-slate-700 block text-[10px] uppercase font-bold">
                  Wilayah Klaster
                </span>
                <span className="font-bold text-slate-900 dark:text-white print:text-slate-950">
                  {activeTiketInfo.area_klaster}
                </span>
              </div>
              <div>
                <span className="text-slate-500 print:text-slate-700 block text-[10px] uppercase font-bold">
                  Teknisi Pelaksana
                </span>
                <span className="font-bold text-slate-900 dark:text-white print:text-slate-950">
                  {activeTiketInfo.teknisi_nama}
                </span>
              </div>
              <div>
                <span className="text-slate-500 print:text-slate-700 block text-[10px] uppercase font-bold">
                  Pimpinan / Penugas
                </span>
                <span className="font-bold text-slate-900 dark:text-white print:text-slate-950">
                  {activeTiketInfo.pimpinan_nama}
                </span>
              </div>
            </div>

            {activeTiketInfo.rute && (
              <div className="pt-1 border-t border-slate-200 dark:border-slate-700 print:border-slate-300">
                <span className="text-[10px] font-bold text-slate-500 print:text-slate-700 mr-2">
                  Urutan Rute Kerja:
                </span>
                <span className="font-mono text-[11px] print:text-[9.5px] font-semibold text-slate-800 dark:text-slate-200 print:text-slate-950">
                  {activeTiketInfo.rute}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tabel Rincian Hasil Audit Lapangan (Full Descriptive, Pure White Print with Black Borders) */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-4 print:bg-white print:border-none print:rounded-none print:shadow-none print:mt-2">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Rincian Kondisi Fisik Lapangan ({filtered.length} Titik ODP)
            </h3>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 print:text-black">
              {loading ? 'Memuat data laporan...' : 'Belum ada riwayat audit yang selesai pada tiket ini.'}
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse print:text-[9.5px] print:bg-white print:border print:border-black print:text-black">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider print:bg-slate-100 print:text-black print:border-b print:border-black">
                    <th className="p-2.5 print:p-1.5 w-10 print:border print:border-black print:bg-slate-100 print:text-black">No</th>
                    <th className="p-2.5 print:p-1.5 print:border print:border-black print:bg-slate-100 print:text-black">Kode ODP & Lokasi</th>
                    <th className="p-2.5 print:p-1.5 print:border print:border-black print:bg-slate-100 print:text-black">Utilisasi Port</th>
                    <th className="p-2.5 print:p-1.5 print:border print:border-black print:bg-slate-100 print:text-black">Kondisi Fisik Lapangan</th>
                    <th className="p-2.5 print:p-1.5 print:border print:border-black print:bg-slate-100 print:text-black">Status Kelayakan</th>
                    <th className="p-2.5 print:p-1.5 text-center print:border print:border-black print:bg-slate-100 print:text-black">Foto Eviden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-none">
                  {filtered.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition print:break-inside-avoid print:bg-white print:text-black">
                      <td className="p-2.5 print:p-1.5 font-bold text-slate-500 print:text-black align-top print:border print:border-black print:bg-white">
                        {idx + 1}
                      </td>

                      <td className="p-2.5 print:p-1.5 align-top print:border print:border-black print:bg-white">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 print:text-black">
                          {item.odp.kode_odp}
                        </div>
                        <div className="text-[11px] print:text-[9px] text-slate-600 dark:text-slate-400 print:text-black leading-tight">
                          {item.odp.alamat}
                        </div>
                        <div className="text-[10px] print:text-[8.5px] text-slate-500 print:text-black font-semibold mt-0.5">
                          Klaster: {item.area_klaster}
                        </div>
                      </td>

                      <td className="p-2.5 print:p-1.5 align-top print:border print:border-black print:bg-white">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                          {item.odp.port_terpakai ?? 0} / {item.odp.kapasitas_port || 8} Port
                        </div>
                        <div className="text-[10px] print:text-[8.5px] text-slate-500 print:text-black">
                          Sisa: {Math.max(0, (item.odp.kapasitas_port || 8) - (item.odp.port_terpakai ?? 0))} Kosong
                        </div>
                      </td>

                      {/* Deskripsi Fisik Jelas - Tidak Menggunakan Angka 1, 2, 3! */}
                      <td className="p-2.5 print:p-1.5 align-top space-y-0.5 text-[11px] print:text-[9px] print:border print:border-black print:bg-white print:text-black">
                        <div>
                          <span className="text-slate-500 print:text-black font-semibold">Tiang:</span>{' '}
                          <b className="text-slate-900 dark:text-slate-100 print:text-black">
                            {formatKondisiTeks('tiang', item.kondisi.tiang)}
                          </b>
                        </div>
                        <div>
                          <span className="text-slate-500 print:text-black font-semibold">Boks ODP:</span>{' '}
                          <b className="text-slate-900 dark:text-slate-100 print:text-black">
                            {formatKondisiTeks('boks', item.kondisi.boks)}
                          </b>
                        </div>
                        <div>
                          <span className="text-slate-500 print:text-black font-semibold">Kabel:</span>{' '}
                          <b className="text-slate-900 dark:text-slate-100 print:text-black">
                            {formatKondisiTeks('kabel', item.kondisi.kabel)}
                          </b>
                        </div>
                        <div>
                          <span className="text-slate-500 print:text-black font-semibold">Port Splitter:</span>{' '}
                          <b className="text-slate-900 dark:text-slate-100 print:text-black">
                            {formatKondisiTeks('port', item.kondisi.port)}
                          </b>
                        </div>
                      </td>

                      <td className="p-2.5 print:p-1.5 align-top print:border print:border-black print:bg-white">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] print:text-[9px] font-black border uppercase tracking-wider ${
                            WARNA_STATUS[item.status_akhir] || 'text-slate-700 bg-slate-100 border-slate-300'
                          } print:bg-white print:text-black print:border-black`}
                        >
                          {item.status_akhir}
                        </span>
                        <div className="text-[9px] text-slate-500 print:text-black mt-1">
                          {new Date(item.waktu_audit).toLocaleDateString('id-ID')}
                        </div>
                      </td>

                      <td className="p-2.5 print:p-1.5 align-top text-center print:border print:border-black print:bg-white">
                        {item.foto_bukti ? (
                          <div className="inline-block">
                            <img
                              src={item.foto_bukti}
                              alt="Eviden Lapangan"
                              className="w-14 h-14 print:w-12 print:h-12 rounded-lg object-cover border border-slate-300 print:border-black shadow-sm mx-auto"
                            />
                            <span className="block text-[8px] text-slate-500 print:text-black mt-0.5">
                              Eviden Fisik
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 print:text-black text-[10px] italic">Tidak ada foto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pernyataan Penutup Dokumen Resmi */}
        <div className="hidden print:block mt-3 text-[9.5px] text-slate-700 leading-relaxed italic">
          Demikian Berita Acara Pemeriksaan Pekerjaan & Validasi Instalasi ODP ini dibuat dengan sebenar-benarnya sesuai dengan kondisi fisik riil di lapangan untuk dipergunakan sebagaimana mestinya.
        </div>

        {/* Lembar Tanda Tangan Resmi (1 Halaman A4) */}
        <div className="hidden print:block mt-8 pt-4 border-t border-slate-800 text-[10px] text-slate-950">
          <div className="grid grid-cols-2 gap-10 text-center">
            {/* Pelaksana Lapangan */}
            <div className="space-y-12">
              <div>
                <p className="font-semibold text-slate-800">Pelaksana Lapangan,</p>
                <p className="text-[9px] text-slate-600">Teknisi Patroli Preventive Maintenance</p>
              </div>
              <div>
                <p className="font-extrabold underline uppercase">
                  ( {activeTiketInfo ? activeTiketInfo.teknisi_nama : (user.nama || 'Teknisi Patroli')} )
                </p>
                <p className="text-[9px] text-slate-600">Petugas Valins STO Payakumbuh</p>
              </div>
            </div>

            {/* Pimpinan STO */}
            <div className="space-y-12">
              <div>
                <p className="font-semibold text-slate-800">Mengetahui & Menyetujui,</p>
                <p className="text-[9px] text-slate-600">Pimpinan / Koordinator STO Payakumbuh</p>
              </div>
              <div>
                <p className="font-extrabold underline uppercase">
                  ( {activeTiketInfo ? activeTiketInfo.pimpinan_nama : 'Robby Permana Putra'} )
                </p>
                <p className="text-[9px] text-slate-600">NIK. 89201928 / STO Payakumbuh</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}