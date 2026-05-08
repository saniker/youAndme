import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getPhotoUrl } from '../api';
import { useAuthStore } from '../store';
import { Spinner, Avatar } from '../components/Layout';

const REGIONS = ['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '제주'];

const STATUS_MAP = {
  open:     { label: '신청 가능', color: '#4a7a4a', bg: '#e8f4e8' },
  closed:   { label: '신청 마감', color: '#7b5a2a', bg: '#f2e4cc' },
  finished: { label: '행사 종료', color: '#6b4226', bg: '#f0e8e0' },
};

export default function EventListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [region, setRegion] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetchEvents();
    fetchUnread();
  }, [region]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const params = region !== '전체' ? `?region=${region}` : '';
      const { data } = await api.get(`/events${params}`);
      setEvents(data);
    } catch {}
    finally { setLoading(false); }
  }

  async function fetchUnread() {
    try {
      const { data } = await api.get('/events/notifications/list');
      setUnread(data.filter(n => !n.is_read).length);
    } catch {}
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#fdf6ee' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 pt-5 pb-3 border-b"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display',serif", color: '#4a2c17' }}>
              ☕ 너랑나랑
            </h1>
            <p className="text-xs" style={{ color: '#a07850' }}>{user?.name}님, 안녕하세요</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/notifications')} className="relative p-2">
              <span className="text-xl">🔔</span>
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center"
                  style={{ background: '#c45f5f', fontSize: 9 }}>{unread}</span>
              )}
            </button>
            <button onClick={() => navigate('/my')}
              className="w-8 h-8 rounded-full overflow-hidden border-2 flex items-center justify-center"
              style={{ borderColor: '#c9956a' }}>
              {user?.photo
                ? <img src={getPhotoUrl(user.photo)} alt="" className="w-full h-full object-cover" />
                : <span style={{ fontSize: 16 }}>{user?.gender === 'M' ? '👨' : '👩'}</span>}
            </button>
          </div>
        </div>

        {/* 지역 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {REGIONS.map(r => (
            <button key={r} onClick={() => setRegion(r)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: region === r ? '#4a2c17' : '#fffdf9',
                color: region === r ? 'white' : '#7b4f2e',
                border: `1px solid ${region === r ? '#4a2c17' : '#e8d5b7'}`
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 이벤트 목록 */}
      <div className="px-4 pt-4 space-y-4">
        {loading ? <Spinner /> : events.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#a07850' }}>
            <div className="text-5xl mb-3">☕</div>
            <p className="text-sm">해당 지역의 이벤트가 없어요</p>
            <p className="text-xs mt-1" style={{ color: '#c9956a' }}>다른 지역을 선택해보세요</p>
          </div>
        ) : events.map(ev => (
          <EventCard key={ev.id} event={ev} onClick={() => navigate(`/events/${ev.id}`)} />
        ))}
      </div>

      {/* 하단 네비 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        {[
          { icon: '🏠', label: '홈', path: '/home' },
          { icon: '☕', label: '이벤트', path: '/events', active: true },
          { icon: '👤', label: '마이', path: '/my' },
        ].map(n => (
          <button key={n.label} onClick={() => navigate(n.path)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-all"
            style={{ color: n.active ? '#4a2c17' : '#a07850' }}>
            <span className="text-xl">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function EventCard({ event: ev, onClick }) {
  const st = STATUS_MAP[ev.status] || STATUS_MAP.open;
  const mFull = ev.confirmed_m >= ev.capacity_m;
  const fFull = ev.confirmed_f >= ev.capacity_f;

  return (
    <button onClick={onClick} className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-95"
      style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>

      {/* 썸네일 */}
      <div className="h-40 flex items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #c9956a 0%, #7b4f2e 100%)' }}>
        {ev.thumbnail
          ? <img src={getPhotoUrl(ev.thumbnail)} alt="" className="w-full h-full object-cover" />
          : <div className="text-center">
              <div className="text-5xl mb-1">☕</div>
              <div className="text-white text-sm font-medium opacity-80">{ev.cafe_name}</div>
            </div>
        }
        <div className="absolute top-3 right-3">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
        {ev.region && (
          <div className="absolute top-3 left-3">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium text-white"
              style={{ background: 'rgba(0,0,0,0.35)' }}>📍 {ev.region}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-base mb-1" style={{ color: '#4a2c17' }}>{ev.title}</h3>
        <p className="text-xs mb-3" style={{ color: '#a07850' }}>
          📅 {ev.date} {ev.time} &nbsp;·&nbsp; 🏠 {ev.cafe_name}
        </p>

        {/* 정원 현황 */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: '#fdf6ee' }}>
            <div className="text-xs font-medium mb-0.5" style={{ color: '#6b4226' }}>👨 남성</div>
            <div className="text-sm font-bold" style={{ color: mFull ? '#c45f5f' : '#4a2c17' }}>
              {ev.confirmed_m} / {ev.capacity_m}
            </div>
            <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: '#e8d5b7' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (ev.confirmed_m/ev.capacity_m)*100)}%`, background: mFull ? '#c45f5f' : '#7b4f2e' }} />
            </div>
          </div>
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: '#fdf6ee' }}>
            <div className="text-xs font-medium mb-0.5" style={{ color: '#6b4226' }}>👩 여성</div>
            <div className="text-sm font-bold" style={{ color: fFull ? '#c45f5f' : '#4a2c17' }}>
              {ev.confirmed_f} / {ev.capacity_f}
            </div>
            <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: '#e8d5b7' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (ev.confirmed_f/ev.capacity_f)*100)}%`, background: fFull ? '#c45f5f' : '#c9956a' }} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
