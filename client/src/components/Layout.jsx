export function Header({ title, onBack, right }) {
  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 px-5 py-4"
      style={{ background: '#FFFFFF', borderBottom: '1px solid #F2F4F6' }}>
      {onBack && (
        <button onClick={onBack} style={{ color: '#191F28', fontSize: 22, lineHeight: 1 }}>←</button>
      )}
      <span className="font-bold text-base flex-1" style={{ color: '#191F28' }}>{title}</span>
      {right}
    </div>
  );
}

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-white text-sm z-[100] pointer-events-none whitespace-nowrap"
      style={{ background: 'rgba(25,31,40,0.9)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
      {msg}
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', className = '', disabled, type = 'button' }) {
  const styles = {
    primary:  { background: '#3182F6', color: '#fff' },
    secondary:{ background: '#F2F4F6', color: '#191F28' },
    outline:  { background: '#fff', color: '#3182F6', border: '1.5px solid #3182F6' },
    danger:   { background: '#F04452', color: '#fff' },
    success:  { background: '#00C853', color: '#fff' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={styles[variant]}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', onClick }) {
  return (
    <div onClick={onClick}
      className={`rounded-2xl p-5 ${className} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all' : ''}`}
      style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {children}
    </div>
  );
}

export function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'w-9 h-9 text-base', md: 'w-12 h-12 text-xl', lg: 'w-20 h-20 text-3xl', xl: 'w-28 h-28 text-4xl' };
  const fullSrc = src ? (src.startsWith('http') ? src : `${import.meta.env.VITE_API_URL || ''}${src}`) : null;
  if (fullSrc) return (
    <img src={fullSrc} alt={name}
      className={`${sizes[size]} rounded-full object-cover`}
      style={{ border: '2px solid #E5E8EB' }} />
  );
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold`}
      style={{ background: '#E8F0FF', color: '#3182F6' }}>
      {name?.[0] || '?'}
    </div>
  );
}

export function Tag({ children, color = 'blue' }) {
  const colors = {
    blue:  { background: '#EBF3FF', color: '#3182F6' },
    green: { background: '#E6FAF0', color: '#00C853' },
    red:   { background: '#FFF0F0', color: '#F04452' },
    gray:  { background: '#F2F4F6', color: '#8B95A1' },
    brown: { background: '#FFF3E0', color: '#E65100' },
  };
  return (
    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold" style={colors[color] || colors.gray}>
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-7 h-7 rounded-full border-[3px] animate-spin"
        style={{ borderColor: '#E5E8EB', borderTopColor: '#3182F6' }} />
    </div>
  );
}

export function BottomNav({ active, navigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t"
      style={{ background: '#FFFFFF', borderColor: '#F2F4F6', maxWidth: 430, margin: '0 auto', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      {[
        { icon: '🏠', label: '홈', path: '/home' },
        { icon: '☕', label: '이벤트', path: '/events' },
        { icon: '👤', label: '마이', path: '/my' },
      ].map(n => (
        <button key={n.label} onClick={() => navigate(n.path)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition-all"
          style={{ color: active === n.label ? '#3182F6' : '#8B95A1' }}>
          <span className="text-xl">{n.icon}</span>
          <span>{n.label}</span>
        </button>
      ))}
    </nav>
  );
}
