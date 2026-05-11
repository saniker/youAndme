import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

export function AdminNav({ active }) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const items = [
    { key: 'events', icon: '📅', label: '이벤트', path: '/admin/events' },
    { key: 'users',  icon: '👥', label: '회원',   path: '/admin/users' },
    { key: 'logout', icon: '🚪', label: '로그아웃', action: () => { logout(); navigate('/admin'); } },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex border-t z-50"
      style={{ background: '#FFFFFF', borderColor: '#F2F4F6' }}>
      {items.map(item => (
        <button key={item.key}
          onClick={item.action || (() => navigate(item.path))}
          className="flex-1 flex flex-col items-center gap-0.5 relative"
          style={{ color: active === item.key ? '#3182F6' : '#8B95A1', minHeight: 56 }}>
          <span className="text-xl">{item.icon}</span>
          <span className="text-xs font-semibold">{item.label}</span>
          {active === item.key && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
              style={{ background: '#3182F6' }} />
          )}
        </button>
      ))}
    </nav>
  );
}
