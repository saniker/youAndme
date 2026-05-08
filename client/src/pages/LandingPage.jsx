import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && !user.isAdmin) navigate('/events', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-7 text-center"
      style={{ background: 'linear-gradient(180deg, #fdf6ee 0%, #f5ead8 100%)' }}>

      {/* 배경 장식 */}
      <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden pointer-events-none">
        <div className="absolute top-8 left-8 text-6xl opacity-10">☕</div>
        <div className="absolute top-16 right-12 text-4xl opacity-10">🌸</div>
        <div className="absolute top-32 left-1/4 text-3xl opacity-10">✨</div>
      </div>

      {/* 로고 */}
      <div className="text-7xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
        ☕
      </div>
      <h1 className="text-5xl mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#4a2c17', letterSpacing: '2px' }}>
        너랑나랑
      </h1>
      <p className="text-xs tracking-widest mb-10" style={{ color: '#a07850' }}>ROTATION DATING</p>

      {/* 특징 카드 */}
      <div className="flex gap-3 mb-10 w-full max-w-xs">
        {[
          { icon: '👥', label: '10 vs 10' },
          { icon: '⏱', label: '10분 대화' },
          { icon: '💌', label: '매칭 결과' },
        ].map(f => (
          <div key={f.label} className="flex-1 rounded-2xl p-4 text-center"
            style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
            <div className="text-2xl mb-1">{f.icon}</div>
            <div className="text-xs font-medium" style={{ color: '#6b4226' }}>{f.label}</div>
          </div>
        ))}
      </div>

      {/* 설명 */}
      <p className="text-sm leading-relaxed mb-10" style={{ color: '#6b4226', maxWidth: 280 }}>
        카페에서 만나는 <strong style={{ color: '#7b4f2e' }}>설레는 첫 만남</strong><br />
        10명의 이성과 차례로 대화하고<br />
        마음이 맞는 상대를 찾아보세요
      </p>

      {/* 버튼 */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={() => navigate('/login')}
          className="w-full py-4 rounded-2xl text-white font-medium text-sm transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #7b4f2e 0%, #a0704a 100%)', boxShadow: '0 4px 12px rgba(123,79,46,0.3)' }}>
          ☕ 로그인
        </button>
        <div className="flex items-center gap-3 text-xs" style={{ color: '#a07850' }}>
          <div className="flex-1 h-px" style={{ background: '#e8d5b7' }} />
          처음 오셨나요?
          <div className="flex-1 h-px" style={{ background: '#e8d5b7' }} />
        </div>
        <button onClick={() => navigate('/register')}
          className="w-full py-4 rounded-2xl font-medium text-sm transition-all active:scale-95 border"
          style={{ borderColor: '#c9956a', color: '#7b4f2e', background: 'transparent' }}>
          ✨ 회원가입
        </button>
      </div>

      <div className="mt-8 text-xs" style={{ color: '#a07850' }}>
        운영자이신가요?{' '}
        <button onClick={() => navigate('/admin')} className="underline" style={{ color: '#7b4f2e' }}>
          운영자 페이지
        </button>
      </div>

      <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
    </div>
  );
}
