import { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { soundNotifier } from './utils/audio.js';

export const DEFAULT_ACCENT = {
  name: 'Telkom Red',
  primary: '#ED1C24',
  hover: '#C1121F',
  glow: 'rgba(237, 28, 36, 0.4)',
  border: 'border-red-500/30',
};

const ThemeCtx = createContext(null);

export const useTheme = () => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    return {
      darkMode: true,
      toggleDarkMode: () => {},
      primaryColor: '#ED1C24',
      accent: DEFAULT_ACCENT,
      soundEnabled: true,
      toggleSound: () => {},
      triggerDingDong: () => {},
    };
  }
  return ctx;
};

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('og_dark');
    return saved !== null ? saved === 'true' : true;
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('og_sound');
    return saved !== null ? saved === 'true' : true;
  });

  // Enterprise default Telkom Red accent for main application
  const primaryColor = DEFAULT_ACCENT.primary;
  const accent = DEFAULT_ACCENT;

  useEffect(() => {
    localStorage.setItem('og_dark', darkMode);
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('og_sound', soundEnabled);
  }, [soundEnabled]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const toggleSound = () => setSoundEnabled((prev) => !prev);

  const triggerDingDong = () => {
    if (soundEnabled) {
      soundNotifier.playDingDong();
    }
  };

  return (
    <ThemeCtx.Provider
      value={{
        darkMode,
        toggleDarkMode,
        primaryColor,
        accent,
        soundEnabled,
        toggleSound,
        triggerDingDong,
      }}
    >
      <div className={darkMode ? 'dark min-h-screen text-slate-100' : 'light min-h-screen text-slate-900'}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}

// Geometric Sculpted Shape Switch for Dark / Light mode
export function ThemeShapeToggle({ size = 'md' }) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="group relative flex items-center justify-between w-14 h-7 px-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-inner transition-all duration-300 focus:outline-none select-none cursor-pointer"
      title={darkMode ? 'Mode Gelap Aktif (Klik untuk Mode Terang)' : 'Mode Terang Aktif (Klik untuk Mode Gelap)'}
      aria-label="Toggle Dark/Light Mode"
    >
      {/* Sun Shape Icon */}
      <Sun className={`w-3.5 h-3.5 text-amber-500 transition-opacity duration-300 ${darkMode ? 'opacity-30' : 'opacity-100'}`} />

      {/* Moon Shape Icon */}
      <Moon className={`w-3.5 h-3.5 text-indigo-400 transition-opacity duration-300 ${darkMode ? 'opacity-100' : 'opacity-30'}`} />

      {/* Animated Sliding Shape Knob */}
      <span
        className={`absolute top-0.5 bottom-0.5 w-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          darkMode ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#ED1C24] dark:bg-emerald-400 shadow-sm transition-colors" />
      </span>
    </button>
  );
}
