import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../api';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    fetchUnread();
    fetchUpcoming();
  }, []);

  async function fetchUnread() {
    try {
      const { data } = await api.get('/events/notifications/list');
      setUnread(data.filter(n => !n.is_read).length);
    } catch {}
  }

  async function fetchUpcoming() {
    try {
      const { data } = await api.get('/events');
      setUpcomingCount(data.filter(e => e.status === 'open').length);
    } catch {}
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '안녕하세요' : '좋은 저녁이에요';

  return (
    <div className="min-h-screen pb-24" style={{ background: '#fdf6ee' }}>

      {/* 헤더 */}
      <div className="px-5 pt-10 pb-6" style={{ background: 'linear-gradient(160deg, #4a2c17 0%, #7b4f2e 100%)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{greeting} 👋</p>
            <h1 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
              {user?.name}님
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/notifications')} className="relative p-2">
              <span className="text-2xl">🔔</span>
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#e05c5c', fontSize: 9 }}>{unread}</span>
              )}
            </button>
            <button onClick={() => navigate('/my')}
              className="w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center"
              style={{ borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)' }}>
              {user?.photo
                ? <img src={user.photo} alt="" className="w-full h-full object-cover" />
                : <span style={{ fontSize: 20 }}>{user?.gender === 'M' ? '👨' : '👩'}</span>}
            </button>
          </div>
        </div>

        {/* 오픈 이벤트 배지 */}
        {upcomingCount > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#6fcf6f' }} />
            신청 가능한 이벤트 {upcomingCount}개
          </div>
        )}
      </div>

      <div className="px-5 -mt-4">
        {/* 메인 CTA 카드 */}
        <div className="rounded-3xl overflow-hidden mb-4"
          style={{ background: '#fffdf9', boxShadow: '0 8px 32px rgba(74,44,23,0.15)' }}>
          <div className="h-48 flex items-center justify-center relative overflow-hidden">
            {/* 배경 이미지 */}
            <img
              src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80"
              alt="couple"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* 어두운 오버레이 */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(74,44,23,0.65) 0%, rgba(30,10,5,0.75) 100%)' }} />
            {/* 텍스트 */}
            <div className="text-center relative z-10 px-4">
              <p className="text-white text-sm mb-2 tracking-wide" style={{ opacity: 0.9 }}>✨ 설레는 만남이 기다려요</p>
              <p className="text-white text-2xl font-semibold" style={{ fontFamily: "'Playfair Display',serif", textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                로테이션 소개팅
              </p>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm mb-4" style={{ color: '#7b4f2e' }}>
              10명의 이성과 차례로 대화하고<br />
              마음이 맞는 상대를 찾아보세요 💌
            </p>
            <button
              onClick={() => navigate('/events')}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7b4f2e 0%, #a0704a 100%)', boxShadow: '0 4px 16px rgba(123,79,46,0.35)' }}>
              ☕ 매칭 신청하기
            </button>
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: '📋', label: '내 신청', path: '/events/my' },
            { icon: '💌', label: '매칭 결과', path: '/events/result' },
            { icon: '👤', label: '내 프로필', path: '/my' },
          ].map(m => (
            <button key={m.label} onClick={() => navigate(m.path)}
              className="rounded-2xl py-4 flex flex-col items-center gap-2 transition-all active:scale-95"
              style={{ background: '#fffdf9', boxShadow: '0 4px 16px rgba(74,44,23,0.08)' }}>
              <span className="text-2xl">{m.icon}</span>
              <span className="text-xs font-medium" style={{ color: '#6b4226' }}>{m.label}</span>
            </button>
          ))}
        </div>

        {/* 서비스 소개 */}
        <div className="rounded-2xl p-5" style={{ background: '#fffdf9', boxShadow: '0 4px 16px rgba(74,44,23,0.08)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#4a2c17' }}>✨ 너랑나랑은?</h3>
          <div className="space-y-2.5">
            {[
              { icon: '👥', title: '10 vs 10', desc: '남녀 각 10명이 모여 진행해요' },
              { icon: '⏱', title: '10분 대화', desc: '한 상대와 10분씩 차례로 대화해요' },
              { icon: '💌', title: '상호 매칭', desc: '서로 좋아한 분끼리 연결해드려요' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: '#fdf6ee' }}>{f.icon}</div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#4a2c17' }}>{f.title}</p>
                  <p className="text-xs" style={{ color: '#a07850' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 네비 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7', maxWidth: 430, margin: '0 auto' }}>
        {[
          { icon: '🏠', label: '홈', path: '/home', active: true },
          { icon: '☕', label: '이벤트', path: '/events' },
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
