import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && !user.isAdmin) navigate('/home', { replace: true });
  }, [user, navigate]);

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#FFFFFF', overflow: 'hidden' }}>

      {/* 히어로 영역 */}
      <div className="relative flex-1 overflow-hidden">
        {/* 배경 이미지 */}
        <img
          src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80"
          alt="couple in cafe"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.75) 100%)' }} />

        {/* 로고 */}
        <div className="absolute top-12 left-6">
          <div className="text-3xl mb-1">☕</div>
          <p className="text-white font-black text-2xl" style={{ letterSpacing: '-0.5px' }}>너랑나랑</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>로테이션 소개팅 플랫폼</p>
        </div>

        {/* 하단 텍스트 */}
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-white font-black mb-1"
            style={{ fontSize: 26, lineHeight: 1.25, letterSpacing: '-0.5px' }}>
            설레는 만남이<br />기다리고 있어요 💌
          </h2>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
            남녀 각 10명 · 10분씩 대화 · 상호 매칭 알림
          </p>
        </div>
      </div>

      {/* 특징 3개 */}
      <div className="px-4 pt-4 pb-1">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '👥', title: '10 vs 10', desc: '남녀 각 10명' },
            { icon: '⏱', title: '10분 대화', desc: '차례로 대화' },
            { icon: '💕', title: '상호 매칭', desc: '연결 알림' },
          ].map(f => (
            <div key={f.title} className="rounded-2xl py-3 px-2 text-center"
              style={{ background: '#F2F4F6' }}>
              <div className="text-xl mb-1">{f.icon}</div>
              <p className="text-xs font-black" style={{ color: '#191F28' }}>{f.title}</p>
              <p className="text-xs mt-0.5" style={{ color: '#8B95A1' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pt-3 pb-7 space-y-2.5">
        <button onClick={() => navigate('/register')}
          className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
          style={{ background: '#3182F6' }}>
          회원가입
        </button>
        <button onClick={() => navigate('/login')}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
          style={{ background: '#F2F4F6', color: '#191F28' }}>
          로그인
        </button>
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs" style={{ color: '#C4C9D1' }}>
            © {new Date().getFullYear()} youAndme
          </p>
          <button onClick={() => navigate('/admin')} className="text-xs font-semibold" style={{ color: '#C4C9D1' }}>
            운영자 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
