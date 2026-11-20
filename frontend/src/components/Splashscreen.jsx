import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Logo from './Logo.jsx';
import { useTheme } from '../theme.jsx';

export default function Splashscreen({ onFinish }) {
  const theme = useTheme();
  const primaryColor = theme?.accent?.primary || theme?.primaryColor || '#ED1C24';
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Menginisialisasi modul sistem...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(50);
      setStatusText('Menghubungkan ke Shared Database Supabase & WebGIS...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setStatusText('Memverifikasi status node & Telegram bot service...');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Sistem siap digunakan.');
    }, 1400);

    const timer4 = setTimeout(() => {
      if (onFinish) onFinish();
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090D16] text-white">
      {/* Optional dismiss button */}
      {onFinish && (
        <button
          onClick={onFinish}
          className="absolute top-6 right-6 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          title="Tutup Splashscreen"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Background Animated Tech Rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full border border-slate-800 animate-ping opacity-20" />
        <div className="w-[340px] h-[340px] rounded-full border border-slate-700/40 animate-pulse opacity-30" />
      </div>

      <div className="relative flex flex-col items-center max-w-md px-6 text-center">
        <div className="mb-6 transform hover:scale-105 transition-transform">
          <Logo size="lg" />
        </div>

        {/* Motto / Slogan OptiGuard Telkom Akses */}
        <div className="space-y-1 mb-6">
          <h2 className="text-sm font-bold tracking-wider text-white">
            STO TELKOM AKSES PAYAKUMBUH
          </h2>
          <p className="text-xs uppercase tracking-widest text-[#ED1C24] font-bold">
            Sistem Validasi Instalasi & Preventive Maintenance ODP
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            &ldquo;Menjaga Keandalan Jaringan Fiber Optik dengan Pengawasan Digital Terintegrasi&rdquo;
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-72 h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: primaryColor,
              boxShadow: `0 0 12px ${primaryColor}`,
            }}
          />
        </div>

        <span className="text-xs font-mono text-slate-400 transition-opacity">
          {statusText}
        </span>
      </div>
    </div>
  );
}
