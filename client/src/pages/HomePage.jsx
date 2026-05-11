import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Avatar, BottomNav } from '../components/Layout';
import api from '../api';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    api.get('/events/notifications/list')
      .then(({ data }) => setUnread(data.filter(n => !n.is_read).length))
      .catch(() => {});

    Promise.all([
      api.get('/events'),
      api.get('/events/my/applications'),
    ]).then(([evRes, appRes]) => {
      const appliedIds = new Set(appRes.data.map(a => a.event_id));
      const count = evRes.data.filter(e => e.status === 'open' && !appliedIds.has(e.id)).length;
      setOpenCount(count);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F2F4F6' }}>
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-5" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-3" onClick={() => navigate('/my')}>
            <Avatar src={user?.photo} name={user?.name} size="md" />
            <div>
              <p className="text-xs font-medium" style={{ color: '#8B95A1' }}>안녕하세요 👋</p>
              <p className="text-lg font-black" style={{ color: '#191F28' }}>{user?.name}님</p>
            </div>
          </button>
          <button onClick={() => navigate('/notifications')} className="relative p-2">
            <span className="text-2xl">🔔</span>
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                style={{ background: '#F04452', fontSize: 9 }}>{unread}</span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* 메인 CTA */}
        <div className="rounded-3xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="relative h-52 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80"
              alt="couple"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))' }} />
            <div className="absolute bottom-4 left-4">
              {openCount > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full mb-2 inline-block"
                  style={{ background: '#3182F6', color: '#fff' }}>
                  신청 가능 {openCount}개
                </span>
              )}
              <p className="text-white text-xl font-black" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                로테이션 소개팅
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                설레는 만남이 기다려요 ☕
              </p>
            </div>
          </div>
          <div className="p-4">
            <button onClick={() => navigate('/events')}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
              style={{ background: '#3182F6' }}>
              매칭 신청하기
            </button>
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '📋', label: '내 신청/결과', path: '/my' },
            { icon: '☕', label: '이벤트 찾기', path: '/events' },
            { icon: '🔔', label: '알림', path: '/notifications' },
          ].map(m => (
            <button key={m.label} onClick={() => navigate(m.path)}
              className="rounded-2xl py-4 flex flex-col items-center gap-2 transition-all active:scale-95"
              style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <span className="text-2xl">{m.icon}</span>
              <span className="text-xs font-semibold" style={{ color: '#191F28' }}>{m.label}</span>
            </button>
          ))}
        </div>

        {/* 서비스 안내 */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-black mb-4" style={{ color: '#191F28' }}>너랑나랑은?</p>
          <div className="space-y-3">
            {[
              { icon: '👥', title: '10 vs 10', desc: '남녀 각 10명이 모여 진행해요' },
              { icon: '⏱', title: '10분 대화', desc: '한 상대와 10분씩 차례로 대화해요' },
              { icon: '💌', title: '상호 매칭', desc: '서로 좋아한 분끼리 연결해드려요' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: '#EBF3FF' }}>{f.icon}</div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#191F28' }}>{f.title}</p>
                  <p className="text-xs" style={{ color: '#8B95A1' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 카피라이트 */}
        <div className="text-center py-3">
          <p className="text-xs" style={{ color: '#C4C9D1' }}>© {new Date().getFullYear()} youAndme. All rights reserved.</p>
        </div>
      </div>

      <BottomNav active="홈" navigate={navigate} />
    </div>
  );
}
