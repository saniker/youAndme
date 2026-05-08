import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function WaitingApprovalPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-7 text-center"
      style={{ background: 'linear-gradient(180deg, #fdf6ee 0%, #f5ead8 100%)' }}>
      <div className="text-6xl mb-6">☕</div>

      <h2 className="text-2xl font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#4a2c17' }}>
        승인 대기 중
      </h2>

      <div className="rounded-2xl p-6 mb-6 w-full max-w-xs"
        style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
        <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b4226' }}>
          <strong>{user?.name}</strong>님의 가입 신청이 접수됐습니다.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: '#6b4226' }}>
          운영자 확인 후 승인되면<br />
          서비스를 이용하실 수 있어요 🌸
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <div className="flex items-center gap-2 justify-center py-2 rounded-xl text-xs"
          style={{ background: '#f2e4cc', color: '#7b4f2e' }}>
          ⏳ 보통 1-2일 내에 승인돼요
        </div>
        <button onClick={handleLogout}
          className="py-3 rounded-xl text-sm border"
          style={{ borderColor: '#c9956a', color: '#7b4f2e' }}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
