export function PageLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: '#fdf6ee' }}>
      {children}
    </div>
  );
}

export function Header({ title, onBack, right }) {
  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 px-5 py-4 border-b"
      style={{ background: '#fffdf9', borderColor: '#e8d5b7', boxShadow: '0 2px 8px rgba(74,44,23,0.07)' }}>
      {onBack && (
        <button onClick={onBack} className="text-2xl leading-none" style={{ color: '#7b4f2e' }}>←</button>
      )}
      <span className="font-medium text-base" style={{ color: '#4a2c17' }}>{title}</span>
      <div className="flex-1" />
      {right}
    </div>
  );
}

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white text-sm z-50 pointer-events-none"
      style={{ background: '#4a2c17', boxShadow: '0 8px 32px rgba(74,44,23,0.25)' }}>
      {msg}
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', className = '', disabled, type = 'button' }) {
  const styles = {
    primary: 'text-white font-medium',
    outline: 'font-medium border',
    danger: 'text-white font-medium',
    success: 'text-white font-medium',
  };
  const bgs = {
    primary: { background: 'linear-gradient(135deg, #7b4f2e 0%, #a0704a 100%)', boxShadow: '0 4px 12px rgba(123,79,46,0.3)' },
    outline: { border: '1.5px solid #c9956a', color: '#7b4f2e', background: 'transparent' },
    danger: { background: '#c45f5f' },
    success: { background: '#6a9e6a' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      style={bgs[variant]}>
      {children}
    </button>
  );
}

export function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b4226' }}>{label}</label>}
      <input
        {...props}
        className="w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all"
        style={{ background: '#fffdf9', border: '1.5px solid #e8d5b7', color: '#2d1a0e', fontFamily: 'inherit' }}
        onFocus={e => e.target.style.borderColor = '#c9956a'}
        onBlur={e => e.target.style.borderColor = '#e8d5b7'}
      />
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b4226' }}>{label}</label>}
      <select
        {...props}
        className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
        style={{ background: '#fffdf9', border: '1.5px solid #e8d5b7', color: '#2d1a0e', fontFamily: 'inherit' }}>
        {children}
      </select>
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)', border: '1px solid rgba(201,149,106,0.15)' }}>
      {children}
    </div>
  );
}

export function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'w-10 h-10 text-lg', md: 'w-14 h-14 text-2xl', lg: 'w-24 h-24 text-4xl', xl: 'w-32 h-32 text-5xl' };
  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover border-2`} style={{ borderColor: '#e8d5b7' }} />;
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center`}
      style={{ background: 'linear-gradient(135deg, #e8d5b7 0%, #f2e4cc 100%)', color: '#c9956a' }}>
      {name?.[0] || '?'}
    </div>
  );
}

export function Tag({ children, color = 'brown' }) {
  const colors = {
    brown: { background: '#f2e4cc', color: '#7b4f2e' },
    green: { background: '#e8f4e8', color: '#4a7a4a' },
    red: { background: '#fce8e8', color: '#9a3f3f' },
    blue: { background: '#e8eef8', color: '#3a5a8a' },
  };
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium" style={colors[color]}>
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: '#e8d5b7', borderTopColor: '#7b4f2e' }} />
    </div>
  );
}
