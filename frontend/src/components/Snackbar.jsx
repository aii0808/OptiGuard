import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useTheme } from '../theme.jsx';

const SnackbarCtx = createContext(null);
export const useSnackbar = () => useContext(SnackbarCtx);

export function SnackbarProvider({ children }) {
  const [snackbars, setSnackbars] = useState([]);
  const { triggerDingDong } = useTheme();

  const showSnackbar = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    if (type === 'success' || type === 'info') {
      triggerDingDong();
    }

    setSnackbars((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setSnackbars((prev) => prev.filter((s) => s.id !== id));
    }, duration);
  }, [triggerDingDong]);

  const removeSnackbar = (id) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <SnackbarCtx.Provider value={{ showSnackbar }}>
      {children}

      {/* Floating Modern Snackbars Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none no-print">
        {snackbars.map((snack) => {
          const config = {
            success: {
              border: 'border-emerald-500/50',
              bgIcon: 'bg-emerald-500 text-white',
              icon: CheckCircle2,
              bar: 'bg-emerald-500',
            },
            error: {
              border: 'border-red-500/50',
              bgIcon: 'bg-red-500 text-white',
              icon: AlertCircle,
              bar: 'bg-red-500',
            },
            warning: {
              border: 'border-amber-500/50',
              bgIcon: 'bg-amber-500 text-slate-950',
              icon: AlertTriangle,
              bar: 'bg-amber-500',
            },
            info: {
              border: 'border-sky-500/50',
              bgIcon: 'bg-sky-500 text-white',
              icon: Info,
              bar: 'bg-sky-500',
            },
          }[snack.type] || {
            border: 'border-slate-500/50',
            bgIcon: 'bg-slate-500 text-white',
            icon: Info,
            bar: 'bg-slate-500',
          };

          const IconComponent = config.icon;

          return (
            <div
              key={snack.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border ${config.border} shadow-2xl text-slate-800 dark:text-slate-100 transform transition-all duration-300 animate-in slide-in-from-bottom-5`}
            >
              <div className={`p-1.5 rounded-xl ${config.bgIcon} shrink-0 mt-0.5 shadow-sm`}>
                <IconComponent className="w-4 h-4" />
              </div>

              <div className="flex-1 text-xs font-semibold leading-snug pt-0.5">
                {snack.message}
              </div>

              <button
                onClick={() => removeSnackbar(snack.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </SnackbarCtx.Provider>
  );
}
