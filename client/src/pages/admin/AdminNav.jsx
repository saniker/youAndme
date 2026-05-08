import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

export function AdminNav({ active }) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const items = [
    { key: 'events', icon: '📅', label: '이벤트', path: '/admin/events' },
    { key: 'users', icon: '👥', label: '회원', path: '/admin/users' },
    { key: 'logout', icon: '🚪', label: '로그아웃', action: () => { logout(); navigate('/admin'); } },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex border-t"
      style={{ background: '#4a2c17', borderColor: '#3a1c07', zIndex: 100 }}>
      {items.map(item => (
        <button key={item.key}
          onClick={item.action || (() => navigate(item.path))}
          className="flex-1 flex flex-col items-center py-3 gap-0.5"
          style={{ color: active === item.key ? '#e8d5b7' : 'rgba(255,255,255,0.45)' }}>
          <span className="text-xl">{item.icon}</span>
          <span className="text-xs">{item.label}</span>
          {active === item.key && <div className="w-1 h-1 rounded-full" style={{ background: '#c9956a' }} />}
        </button>
      ))}
    </div>
  );
}
