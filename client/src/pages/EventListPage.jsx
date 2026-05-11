import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getPhotoUrl } from '../api';
import { useAuthStore } from '../store';
import { Spinner, BottomNav } from '../components/Layout';

const REGIONS = ['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '제주'];
const STATUS_MAP = {
  open:     { label: '신청 가능', color: '#00C853', bg: '#E6FAF0' },
  closed:   { label: '신청 마감', color: '#8B95A1', bg: '#F2F4F6' },
  finished: { label: '행사 종료', color: '#8B95A1', bg: '#F2F4F6' },
};
const APP_MAP = {
  pending:   { label: '검토 중', color: '#3182F6', bg: '#EBF3FF' },
  confirmed: { label: '✅ 참가 확정', color: '#00C853', bg: '#E6FAF0' },
  rejected:  { label: '미선정', color: '#F04452', bg: '#FFF0F0' },
};

export default function EventListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [region, setRegion] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => { fetchEvents(); fetchUnread(); }, [region]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const params = region !== '전체' ? `?region=${region}` : '';
      const { data } = await api.get(`/events${params}`);
      setEvents(data);
    } catch {} finally { setLoading(false); }
  }

  async function fetchUnread() {
    try {
      const { data } = await api.get('/events/notifications/list');
      setUnread(data.filter(n => !n.is_read).length);
    } catch {}
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F2F4F6' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 pt-5 pb-3"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #F2F4F6' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xl font-black" style={{ color: '#191F28' }}>이벤트</p>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate('/notifications')} className="relative p-2">
              <span className="text-xl">🔔</span>
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ background: '#F04452', fontSize: 9 }}>{unread}</span>
              )}
            </button>
          </div>
        </div>

        {/* 지역 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {REGIONS.map(r => (
            <button key={r} onClick={() => setRegion(r)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: region === r ? '#3182F6' : '#F2F4F6',
                color: region === r ? '#FFFFFF' : '#8B95A1',
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? <Spinner /> : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">☕</div>
            <p className="text-sm font-semibold" style={{ color: '#191F28' }}>해당 지역의 이벤트가 없어요</p>
            <p className="text-xs mt-1" style={{ color: '#8B95A1' }}>다른 지역을 선택해보세요</p>
          </div>
        ) : events.map(ev => (
          <EventCard key={ev.id} event={ev} onClick={() => navigate(`/events/${ev.id}`)} />
        ))}
      </div>

      <BottomNav active="이벤트" navigate={navigate} />
    </div>
  );
}

function EventCard({ event: ev, onClick }) {
  const st = STATUS_MAP[ev.status] || STATUS_MAP.open;
  const appSt = ev.myApplication ? APP_MAP[ev.myApplication.status] : null;
  const mFull = ev.confirmed_m >= ev.capacity_m;
  const fFull = ev.confirmed_f >= ev.capacity_f;

  return (
    <button onClick={onClick} className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
      style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* 썸네일 */}
      <div className="h-44 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3182F6 0%, #1a5fb4 100%)' }}>
        {ev.thumbnail
          ? <img src={getPhotoUrl(ev.thumbnail)} alt="" className="w-full h-full object-cover" />
          : <div className="h-full flex flex-col items-center justify-center">
              <div className="text-5xl mb-1">☕</div>
              <div className="text-white text-sm font-bold opacity-80">{ev.cafe_name}</div>
            </div>
        }
        <div className="absolute top-3 left-3">
          <span className="text-xs px-2.5 py-1 rounded-full font-bold"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#8B95A1' }}>📍 {ev.region}</span>
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {appSt && (
            <span className="text-xs px-2.5 py-1 rounded-full font-bold"
              style={{ background: appSt.bg, color: appSt.color }}>{appSt.label}</span>
          )}
          {!appSt && (
            <span className="text-xs px-2.5 py-1 rounded-full font-bold"
              style={{ background: st.bg, color: st.color }}>{st.label}</span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-black text-base mb-1" style={{ color: '#191F28' }}>{ev.title}</h3>
        <p className="text-xs mb-3 font-medium" style={{ color: '#8B95A1' }}>
          📅 {ev.date} {ev.time} · 🏠 {ev.cafe_name}
        </p>
        <div className="flex gap-2">
          {[['👨 남성', ev.confirmed_m, ev.capacity_m, mFull], ['👩 여성', ev.confirmed_f, ev.capacity_f, fFull]].map(([label, cur, cap, full]) => (
            <div key={label} className="flex-1 rounded-xl p-2.5" style={{ background: '#F2F4F6' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: '#8B95A1' }}>{label}</div>
              <div className="text-sm font-black" style={{ color: full ? '#F04452' : '#191F28' }}>{cur} / {cap}</div>
              <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: '#E5E8EB' }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.min(100, (cur / cap) * 100)}%`,
                  background: full ? '#F04452' : '#3182F6'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
