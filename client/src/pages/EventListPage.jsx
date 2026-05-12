import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getPhotoUrl } from '../api';
import { Spinner, BottomNav } from '../components/Layout';

const REGIONS = ['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '제주'];

const STATUS_MAP = {
  open:     { label: '신청 가능', color: '#00C853', bg: '#E6FAF0' },
  closed:   { label: '신청 마감', color: '#8B95A1', bg: '#F2F4F6' },
  finished: { label: '행사 종료', color: '#8B95A1', bg: '#F2F4F6' },
};
const APP_MAP = {
  pending:   { label: '검토 중',     color: '#3182F6', bg: '#EBF3FF' },
  confirmed: { label: '✅ 참가 확정', color: '#00C853', bg: '#E6FAF0' },
  rejected:  { label: '미선정',      color: '#F04452', bg: '#FFF0F0' },
};

// 카드마다 다른 강조 색상 (썸네일 없을 때 그라데이션 배경으로 사용)
const CARD_COLORS = [
  { from: '#3182F6', to: '#1a5fb4' },
  { from: '#7C3AED', to: '#4C1D95' },
  { from: '#F04452', to: '#9F1239' },
  { from: '#00C853', to: '#065F46' },
  { from: '#F59E0B', to: '#92400E' },
  { from: '#0EA5E9', to: '#0C4A6E' },
];

export default function EventListPage() {
  const navigate = useNavigate();
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
          <button onClick={() => navigate('/notifications')} className="relative"
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="text-xl">🔔</span>
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                style={{ background: '#F04452', fontSize: 9 }}>{unread}</span>
            )}
          </button>
        </div>

        {/* 지역 필터 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
          {REGIONS.map(r => (
            <button key={r} onClick={() => setRegion(r)}
              className="flex-shrink-0 px-4 rounded-full text-xs font-bold transition-all"
              style={{
                background: region === r ? '#3182F6' : '#F2F4F6',
                color: region === r ? '#FFFFFF' : '#8B95A1',
                minHeight: 36, height: 36,
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
        ) : events.map((ev, idx) => (
          <EventCard key={ev.id} event={ev} idx={idx} onClick={() => navigate(`/events/${ev.id}`)} />
        ))}
      </div>

      <BottomNav active="이벤트" navigate={navigate} />
    </div>
  );
}

function EventCard({ event: ev, idx, onClick }) {
  const st = STATUS_MAP[ev.status] || STATUS_MAP.open;
  const appSt = ev.myApplication ? APP_MAP[ev.myApplication.status] : null;
  const badgeSt = appSt || st;
  const mFull = ev.confirmed_m >= ev.capacity_m;
  const fFull = ev.confirmed_f >= ev.capacity_f;
  const color = CARD_COLORS[idx % CARD_COLORS.length];
  const accentColor = color.from;

  return (
    <div onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98] cursor-pointer"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

      {/* 상단 컬러 바 */}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color.from}, ${color.to})` }} />

      {/* 썸네일 */}
      <div className="h-40 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color.from} 0%, ${color.to} 100%)` }}>
        {ev.thumbnail
          ? <img src={getPhotoUrl(ev.thumbnail)} alt="" className="w-full h-full object-cover" />
          : <div className="h-full flex flex-col items-center justify-center gap-2">
              <div className="text-4xl">☕</div>
              <div className="text-white text-sm font-bold opacity-90">{ev.cafe_name}</div>
            </div>
        }
        {/* 오버레이 */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.35))' }} />

        {/* 지역 배지 */}
        <div className="absolute top-3 left-3">
          <span className="text-xs px-2.5 py-1 rounded-full font-bold"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#4A4F5C' }}>📍 {ev.region}</span>
        </div>

        {/* 상태 배지 */}
        <div className="absolute top-3 right-3">
          <span className="text-xs px-2.5 py-1 rounded-full font-bold"
            style={{ background: badgeSt.bg, color: badgeSt.color }}>{badgeSt.label}</span>
        </div>

        {/* 카드 하단 타이틀 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-6"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }}>
          <h3 className="font-black text-white text-base leading-tight">{ev.title}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
            📅 {ev.date} {ev.time} · 🏠 {ev.cafe_name}
          </p>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="px-4 py-3">
        <div className="flex gap-2">
          {[
            { label: '👨 남성', cur: ev.confirmed_m, cap: ev.capacity_m, full: mFull },
            { label: '👩 여성', cur: ev.confirmed_f, cap: ev.capacity_f, full: fFull },
          ].map(({ label, cur, cap, full }) => (
            <div key={label} className="flex-1 rounded-xl p-2.5" style={{ background: '#F2F4F6' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: '#8B95A1' }}>{label}</div>
              <div className="text-sm font-black" style={{ color: full ? '#F04452' : '#191F28' }}>
                {cur} / {cap}
              </div>
              <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: '#E5E8EB' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(100, (cur / cap) * 100)}%`,
                  background: full ? '#F04452' : accentColor,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
