import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store';
import { Avatar, Tag, Spinner } from '../components/Layout';

const STATUS_INFO = {
  pending: { icon: '⏳', title: '승인 대기 중', desc: '운영자가 프로필을 검토하고 있어요.\n승인되면 이벤트에 참여할 수 있어요.', color: '#3a5a8a', bg: '#e8eef8' },
  approved: { icon: '✅', title: '승인 완료!', desc: '이벤트 배정을 기다려주세요.\n이벤트가 시작되면 알림이 와요!', color: '#4a7a4a', bg: '#e8f4e8' },
  rejected: { icon: '❌', title: '가입 거절', desc: '죄송합니다. 이번 이벤트 참여가\n어렵게 되었습니다.', color: '#9a3f3f', bg: '#fce8e8' },
};

export default function WaitingPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return navigate('/', { replace: true });
    checkStatus();
    const iv = setInterval(checkStatus, 10000);
    return () => clearInterval(iv);
  }, []);

  async function checkStatus() {
    try {
      const { data: me } = await api.get('/auth/me');
      updateUser(me);

      const { data: ev } = await api.get('/events/active');
      setEvent(ev);

      // 이벤트가 활성화되고 참가자로 배정된 경우 이벤트 페이지로
      if (ev?.status === 'active' && me.status === 'approved') {
        const isParticipant = ev.participants?.some(p => p.id === me.id);
        if (isParticipant) navigate('/event', { replace: true });
      }
    } catch {}
    finally { setLoading(false); }
  }

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf6ee' }}>
      <Spinner />
    </div>
  );

  const info = STATUS_INFO[user.status] || STATUS_INFO.pending;

  return (
    <div className="min-h-screen pb-10" style={{ background: '#fdf6ee' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 border-b"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        <span className="font-semibold" style={{ fontFamily: "'Playfair Display',serif", color: '#4a2c17', fontSize: 18 }}>YouAndMe</span>
        <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-full border"
          style={{ borderColor: '#c9956a', color: '#7b4f2e' }}>로그아웃</button>
      </div>

      <div className="px-5 pt-8">
        {/* 상태 카드 */}
        <div className="rounded-2xl p-6 mb-5 text-center" style={{ background: info.bg }}>
          <div className="text-5xl mb-3">{info.icon}</div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: info.color }}>{info.title}</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: info.color + 'cc' }}>{info.desc}</p>
        </div>

        {/* 내 프로필 카드 */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
          <div className="flex items-center gap-4 mb-4">
            <Avatar src={user.photo} name={user.name} size="lg" />
            <div>
              <div className="font-semibold text-base" style={{ color: '#4a2c17' }}>{user.name}</div>
              <div className="text-sm" style={{ color: '#a07850' }}>{user.age}세 · {user.job || '직업 미입력'}</div>
              <Tag color={user.status === 'approved' ? 'green' : user.status === 'rejected' ? 'red' : 'blue'}>
                {user.status === 'pending' ? '대기 중' : user.status === 'approved' ? '승인됨' : '거절됨'}
              </Tag>
            </div>
          </div>
          {user.intro && (
            <p className="text-sm leading-relaxed p-3 rounded-xl" style={{ background: '#fdf6ee', color: '#6b4226' }}>
              "{user.intro}"
            </p>
          )}
        </div>

        {/* 이벤트 정보 */}
        {event && user.status === 'approved' && (
          <div className="rounded-2xl p-5 mb-4" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📅</span>
              <span className="font-semibold text-sm" style={{ color: '#4a2c17' }}>예정 이벤트</span>
            </div>
            <div className="font-medium mb-1" style={{ color: '#4a2c17' }}>{event.title}</div>
            <div className="text-sm" style={{ color: '#a07850' }}>
              📍 {event.venue || '장소 미정'} · 🗓 {event.date}
            </div>
            <div className="text-sm mt-1" style={{ color: '#a07850' }}>
              총 {event.total_rounds}라운드 · 라운드당 {event.round_minutes}분
            </div>
          </div>
        )}

        {/* 안내 */}
        {user.status === 'pending' && (
          <div className="rounded-2xl p-4" style={{ background: '#f2e4cc' }}>
            <p className="text-xs text-center" style={{ color: '#7b4f2e' }}>
              ☕ 보통 1~2시간 내로 승인됩니다<br />
              <span style={{ color: '#a07850' }}>페이지를 새로고침하지 않아도 자동으로 업데이트돼요</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
