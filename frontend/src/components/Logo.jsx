import { useTheme, DEFAULT_ACCENT } from '../theme.jsx';

/**
 * OptiGuard & Telkom Akses Official Branding Logo
 * Can render:
 * - variant="full": Complete Telkom Akses + OptiGuard brand badge (matching the user's reference screenshot)
 * - variant="optiguard": High-tech OptiGuard Shield & Optical Distribution Port symbol
 * - variant="telkom": Telkom Akses STO Payakumbuh badge
 */
export default function Logo({ size = 'md', showSubtitle = true, color, variant = 'optiguard' }) {
  const theme = useTheme();
  const primaryColor = color || theme?.accent?.primary || theme?.primaryColor || DEFAULT_ACCENT.primary;

  const dims = {
    sm: { box: 'w-8 h-8', icon: 'w-5 h-5', title: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', icon: 'w-6 h-6', title: 'text-base', sub: 'text-[10px]' },
    lg: { box: 'w-14 h-14', icon: 'w-9 h-9', title: 'text-xl', sub: 'text-xs' },
  }[size] || { box: 'w-10 h-10', icon: 'w-6 h-6', title: 'text-base', sub: 'text-[10px]' };

  if (variant === 'telkom') {
    return (
      <div className="flex items-center gap-3 select-none">
        {/* Rounded White Badge as shown in reference image */}
        <div className={`${dims.box} rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-md shrink-0 border border-slate-200/60`}>
          {/* Telkom Akses Stylized Spark SVG */}
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            {/* Spark Rays */}
            <circle cx="50" cy="50" r="14" fill="#ED1C24" />
            <line x1="50" y1="12" x2="50" y2="30" stroke="#ED1C24" strokeWidth="6" strokeLinecap="round" />
            <line x1="50" y1="70" x2="50" y2="88" stroke="#ED1C24" strokeWidth="6" strokeLinecap="round" />
            <line x1="12" y1="50" x2="30" y2="50" stroke="#ED1C24" strokeWidth="6" strokeLinecap="round" />
            <line x1="70" y1="50" x2="88" y2="50" stroke="#ED1C24" strokeWidth="6" strokeLinecap="round" />
            <line x1="23" y1="23" x2="36" y2="36" stroke="#ED1C24" strokeWidth="5" strokeLinecap="round" />
            <line x1="64" y1="64" x2="77" y2="77" stroke="#ED1C24" strokeWidth="5" strokeLinecap="round" />
            <line x1="23" y1="77" x2="36" y2="64" stroke="#ED1C24" strokeWidth="5" strokeLinecap="round" />
            <line x1="64" y1="36" x2="77" y2="23" stroke="#ED1C24" strokeWidth="5" strokeLinecap="round" />
            {/* Central Fiber Core Light */}
            <circle cx="50" cy="50" r="6" fill="#FFFFFF" />
          </svg>
        </div>

        <div className="flex flex-col text-left">
          <div className={`font-black tracking-tight ${dims.title} leading-tight`}>
            <span className="text-white dark:text-white">TELKOM </span>
            <span className="text-[#ED1C24]">AKSES</span>
          </div>
          {showSubtitle && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              <span className={`${dims.sub} font-bold tracking-wider uppercase text-slate-400`}>
                STO PAYAKUMBUH
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // High-Tech OptiGuard ODP Shield Logo
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${dims.box} flex items-center justify-center shrink-0`}>
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 rounded-2xl blur-md opacity-40 transition-colors duration-300"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Modern OptiGuard ODP Hexagon Shield SVG */}
        <svg viewBox="0 0 100 100" className="relative w-full h-full drop-shadow-lg" fill="none">
          <defs>
            <linearGradient id={`shieldGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="60%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id={`fiberPulse-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <radialGradient id={`coreGlow-${size}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Outer Protective Armor Hex-Shield */}
          <polygon
            points="50,4 92,25 92,68 50,96 8,68 8,25"
            fill={`url(#shieldGrad-${size})`}
            stroke={primaryColor}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Internal Fiber Optic Chamber */}
          <polygon
            points="50,18 78,32 78,60 50,74 22,60 22,32"
            fill="#090E17"
            stroke="url(#fiberPulse-${size})"
            strokeWidth="2"
            opacity="0.9"
          />

          {/* ODP Splitter Distribution Lines (8-port simulation) */}
          <line x1="50" y1="46" x2="50" y2="24" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="46" x2="72" y2="35" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="46" x2="72" y2="57" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="46" x2="50" y2="68" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="46" x2="28" y2="57" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="46" x2="28" y2="35" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />

          {/* Central Optical Core Light */}
          <circle cx="50" cy="46" r="6.5" fill={`url(#coreGlow-${size})`} />
          <circle cx="50" cy="46" r="3" fill="#FFFFFF" />

          {/* Optical Port Dots */}
          <circle cx="50" cy="24" r="2.5" fill="#38BDF8" />
          <circle cx="72" cy="35" r="2.5" fill="#10B981" />
          <circle cx="72" cy="57" r="2.5" fill="#38BDF8" />
          <circle cx="50" cy="68" r="2.5" fill="#F59E0B" />
          <circle cx="28" cy="57" r="2.5" fill="#10B981" />
          <circle cx="28" cy="35" r="2.5" fill="#38BDF8" />
        </svg>
      </div>

      <div className="flex flex-col text-left">
        <div className={`font-black tracking-tight ${dims.title} leading-none flex items-center`}>
          <span className="text-slate-900 dark:text-white">OPTI</span>
          <span style={{ color: primaryColor }} className="transition-colors duration-300">GUARD</span>
        </div>
        {showSubtitle && (
          <span className={`${dims.sub} font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-400 mt-1`}>
            STO Telkom Akses Payakumbuh
          </span>
        )}
      </div>
    </div>
  );
}
