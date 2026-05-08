import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Spinner } from '../components/Layout';

const TYPE_ICON = { confirmed: '✅', rejected: '😢', reminder: '⏰', likes_open: '💌', match: '💕', info: 'ℹ️', application: '📋' };

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifs();
    api.patch('/events/notifications/read-all').catch(() => {});
  }, []);

  async function fetchNotifs() {
    try {
      const { data } = await api.get('/events/notifications/list');
      setNotifs(data);
    } catch {}
    finally { setLoading(false); }
  }

  function handleClick(n) {
    if (n.event_id) {
      if (n.type === 'likes_open') navigate(`/events/${n.event_id}/likes`);
      else if (n.type === 'match') navigate(`/events/${n.event_id}/result`);
      else navigate(`/events/${n.event_id}`);
    }
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: '#fdf6ee' }}>
      <div className="sticky top-0 z-50 px-5 py-4 border-b flex items-center gap-3"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        <button onClick={() => navigate(-1)} className="text-xl" style={{ color: '#7b4f2e' }}>←</button>
        <span className="font-semibold" style={{ color: '#4a2c17' }}>알림</span>
      </div>

      {loading ? <Spinner /> : notifs.length === 0 ? (
        <div className="text-center py-20" style={{ color: '#a07850' }}>
          <div className="text-5xl mb-3">🔔</div>
          <p className="text-sm">알림이 없어요</p>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-2">
          {notifs.map(n => (
            <button key={n.id} onClick={() => handleClick(n)}
              className="w-full text-left rounded-2xl p-4 transition-all active:scale-95"
              style={{ background: n.is_read ? '#fffdf9' : '#fdf0e4', boxShadow: '0 2px 12px rgba(74,44,23,0.08)', border: `1px solid ${n.is_read ? 'transparent' : '#e8c9a0'}` }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] || 'ℹ️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-0.5" style={{ color: '#4a2c17' }}>{n.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: '#6b4226' }}>{n.body}</div>
                  <div className="text-xs mt-1" style={{ color: '#c9956a' }}>
                    {new Date(n.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: '#c9956a' }} />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
