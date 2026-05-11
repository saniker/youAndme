import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Spinner, BottomNav } from '../components/Layout';

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
    try { const { data } = await api.get('/events/notifications/list'); setNotifs(data); }
    catch {} finally { setLoading(false); }
  }

  function handleClick(n) {
    if (n.event_id) {
      if (n.type === 'likes_open') navigate(`/events/${n.event_id}/likes`);
      else if (n.type === 'match') navigate(`/events/${n.event_id}/result`);
      else navigate(`/events/${n.event_id}`);
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F2F4F6' }}>
      <div className="sticky top-0 z-50 px-5 py-4 flex items-center gap-3"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #F2F4F6' }}>
        <button onClick={() => navigate(-1)} style={{ color: '#191F28', fontSize: 22 }}>←</button>
        <span className="font-black text-lg" style={{ color: '#191F28' }}>알림</span>
      </div>

      {loading ? <Spinner /> : notifs.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-3">🔔</div>
          <p className="text-sm font-semibold" style={{ color: '#191F28' }}>알림이 없어요</p>
          <p className="text-xs mt-1" style={{ color: '#8B95A1' }}>새로운 소식이 오면 알려드릴게요</p>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-2">
          {notifs.map(n => (
            <button key={n.id} onClick={() => handleClick(n)}
              className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
              style={{
                background: n.is_read ? '#FFFFFF' : '#EBF3FF',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: n.is_read ? 'none' : '1px solid #BFDBFF'
              }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] || 'ℹ️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm mb-0.5" style={{ color: '#191F28' }}>{n.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#4A4F5C' }}>{n.body}</p>
                  <p className="text-xs mt-1" style={{ color: '#8B95A1' }}>
                    {new Date(n.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#3182F6' }} />}
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomNav active="" navigate={navigate} />
    </div>
  );
}
