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
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: '#F2F4F6' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">☕</div>
          <h2 className="text-2xl font-black mb-1" style={{ color: '#191F28' }}>승인 대기 중</h2>
          <p className="text-sm" style={{ color: '#8B95A1' }}>조금만 기다려주세요</p>
        </div>

        <div className="rounded-2xl p-5 mb-3" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-sm leading-relaxed mb-2" style={{ color: '#191F28' }}>
            <span className="font-bold">{user?.name}</span>님의 가입 신청이 접수됐습니다.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#4A4F5C' }}>
            운영자 확인 후 승인되면 서비스를 이용하실 수 있어요 🌸
          </p>
        </div>

        <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: '#EBF3FF' }}>
          <span className="text-xl">⏳</span>
          <p className="text-sm font-bold" style={{ color: '#3182F6' }}>보통 1-2일 내에 승인돼요</p>
        </div>

        <button onClick={handleLogout}
          className="w-full py-4 rounded-2xl font-bold text-sm"
          style={{ background: '#FFFFFF', color: '#8B95A1' }}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
