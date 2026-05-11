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
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
      {/* 상단 영역 */}
      <div className="flex-1 flex flex-col justify-center px-6 pt-16 pb-8">
        {/* 로고 */}
        <div className="mb-10">
          <div className="text-5xl mb-4">☕</div>
          <h1 className="text-4xl font-black mb-2" style={{ color: '#191F28', letterSpacing: '-1px' }}>
            너랑나랑
          </h1>
          <p className="text-base" style={{ color: '#8B95A1' }}>
            설레는 만남, 로테이션 소개팅
          </p>
        </div>

        {/* 특징 */}
        <div className="space-y-3 mb-12">
          {[
            { icon: '👥', title: '10 vs 10 매칭', desc: '남녀 각 10명이 모여 진행해요' },
            { icon: '⏱', title: '10분 대화', desc: '한 상대와 10분씩 차례로 대화해요' },
            { icon: '💌', title: '상호 매칭 알림', desc: '서로 좋아한 분끼리 연결해드려요' },
          ].map(f => (
            <div key={f.title} className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: '#F8F9FA' }}>
              <div className="text-2xl w-10 text-center">{f.icon}</div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#191F28' }}>{f.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#8B95A1' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-10 space-y-3">
        <button onClick={() => navigate('/login')}
          className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
          style={{ background: '#3182F6' }}>
          로그인
        </button>
        <button onClick={() => navigate('/register')}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
          style={{ background: '#F2F4F6', color: '#191F28' }}>
          회원가입
        </button>
        <p className="text-center text-xs" style={{ color: '#8B95A1' }}>
          운영자이신가요?{' '}
          <button onClick={() => navigate('/admin')} className="font-semibold" style={{ color: '#3182F6' }}>
            운영자 로그인
          </button>
        </p>

        <div className="pt-4 text-center">
          <p className="text-xs" style={{ color: '#C4C9D1' }}>© {new Date().getFullYear()} youAndme. All rights reserved.</p>
          <p className="text-xs mt-0.5" style={{ color: '#C4C9D1' }}>너랑나랑 · 로테이션 소개팅 플랫폼</p>
        </div>
      </div>
    </div>
  );
}
