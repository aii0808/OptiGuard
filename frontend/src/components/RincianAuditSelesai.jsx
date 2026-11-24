import { CheckCircle2, AlertTriangle, AlertCircle, Camera, Clock } from 'lucide-react';
import { parseFotoBukti } from '../utils/foto.js';
import { formatKondisiTeks } from '../utils/kondisi.js';

export default function RincianAuditSelesai({ audit, kodeOdp, className = '' }) {
  if (!audit) return null;

  const fotoList = parseFotoBukti(audit.foto_bukti);
  const status = audit.status_akhir || 'Aman';

  const badgeStatus = {
    Aman: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    Normal: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    Warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    Critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  }[status] || 'bg-slate-500/10 text-slate-500 border-slate-500/30';

  const komponenList = [
    { key: 'boks', label: 'Boks ODP', val: audit.kondisi_boks },
    { key: 'tiang', label: 'Tiang Fiber', val: audit.kondisi_tiang },
    { key: 'kabel', label: 'Kabel Dropcore', val: audit.kondisi_kabel },
    { key: 'port', label: 'Port Splitter', val: audit.kondisi_port },
  ];

  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 ${className}`}>
      {/* Header Rincian */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Hasil Audit Lapangan {kodeOdp ? `(${kodeOdp})` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${badgeStatus}`}>
            {status}
          </span>
          {audit.waktu_audit && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {new Date(audit.waktu_audit).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })} WIB
            </span>
          )}
        </div>
      </div>

      {/* Grid 4 Poin Checklist Fisik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {komponenList.map((k) => {
          const teks = formatKondisiTeks(k.key, k.val);
          const n = Number(k.val);
          const isAman = n === 1 || teks === 'Tidak Rusak';
          const isWarning = n === 2 || teks === 'Rusak Ringan';

          return (
            <div
              key={k.key}
              className={`p-2.5 rounded-xl border text-center transition ${
                isAman
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                  : isWarning
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                {k.label}
              </div>
              <div className="text-xs font-black mt-1 flex items-center justify-center gap-1">
                {isAman && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                {!isAman && !isWarning && <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span className="truncate">{teks}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Galeri Foto Eviden Lapangan */}
      {fotoList.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#ED1C24]" />
              <span>Foto Eviden Lapangan ({fotoList.length} Foto):</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Klik foto untuk resolusi penuh</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {fotoList.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition"
                title={`Buka Foto Eviden ${idx + 1}`}
              >
                <img
                  src={url}
                  alt={`Eviden ${idx + 1}`}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] font-bold text-center py-0.5 group-hover:bg-[#ED1C24] transition">
                  Foto {idx + 1}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
