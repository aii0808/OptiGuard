// Clean Card Wrapper (mouse tilt & ambient glow removed per user request)
export function AmbientMouseGlow() {
  return null;
}

export function Tilt3DCard({ children, className = '', ...props }) {
  return (
    <div className={`relative transition-all duration-200 ${className}`} {...props}>
      {children}
    </div>
  );
}
