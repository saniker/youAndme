import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store';
import { Spinner, Avatar } from '../components/Layout';

const APP_STATUS = {
  pending:   { label: '검토 중', color: '#3a5a8a', bg: '#e8eef8' },
  confirmed: { label: '참가 확정 ✅', color: '#4a7a4a', bg: '#e8f4e8' },
  rejected:  { label: '미선정', color: '#9a3f3f', bg: '#fce8e8' },
};
const EVENT_STATUS = {
  open: '신청 가능', closed: '신청 마감', finished: '행사 종료'
};

export default function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchApps(); }, []);

  async function fetchApps() {
    try {
      const { data } = await api.get('/events/my/applications');
      setApps(data);
    } catch {}
    finally { setLoading(false); }
  }

  function handleLogout() { logout(); navigate('/'); }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#fdf6ee' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 py-4 border-b flex items-center justify-between"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        <button onClick={() => navigate('/home')} className="text-xl" style={{ color: '#7b4f2e' }}>←</button>
        <span className="font-semibold" style={{ color: '#4a2c17' }}>마이페이지</span>
        <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-full border"
          style={{ borderColor: '#c9956a', color: '#7b4f2e' }}>로그아웃</button>
      </div>

      {/* 프로필 */}
      <div className="px-5 pt-6 pb-4">
        <div className="rounded-2xl p-5 mb-5" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
          <div className="flex items-center gap-4">
            <Avatar src={user?.photo} name={user?.name} size="lg" />
            <div>
              <div className="font-bold text-base" style={{ color: '#4a2c17' }}>{user?.name}</div>
              <div className="text-sm" style={{ color: '#a07850' }}>
                {user?.gender === 'M' ? '👨' : '👩'} {user?.age}세 · {user?.job || '직업 미입력'}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#c9956a' }}>{user?.email}</div>
            </div>
          </div>
          {user?.intro && (
            <p className="text-sm mt-3 p-3 rounded-xl leading-relaxed" style={{ background: '#fdf6ee', color: '#6b4226' }}>
              "{user.intro}"
            </p>
          )}
        </div>

        {/* 신청 내역 */}
        <p className="text-sm font-semibold mb-3" style={{ color: '#4a2c17' }}>내 신청 내역</p>

        {loading ? <Spinner /> : apps.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#a07850' }}>
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm">신청한 이벤트가 없어요</p>
            <button onClick={() => navigate('/events')} className="mt-3 text-xs underline" style={{ color: '#7b4f2e' }}>
              이벤트 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(app => {
              const st = APP_STATUS[app.status];
              const isFinished = app.event_status === 'finished';
              const isConfirmed = app.status === 'confirmed';
              return (
                <div key={app.id} className="rounded-2xl overflow-hidden"
                  style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.08)' }}>
                  <div className="h-1" style={{ background: st.color }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="font-semibold text-sm truncate" style={{ color: '#4a2c17' }}>{app.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#a07850' }}>
                          📅 {app.date} · 📍 {app.region} {app.cafe_name}
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                        style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>

                    <div className="text-xs mb-3" style={{ color: '#c9956a' }}>
                      {EVENT_STATUS[app.event_status]} · 신청일 {new Date(app.created_at).toLocaleDateString('ko-KR')}
                    </div>

                    {isFinished && isConfirmed && (
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/events/${app.event_id}/likes`)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white"
                          style={{ background: 'linear-gradient(135deg, #c45f8a, #e07a9a)' }}>
                          💕 좋아요 입력
                        </button>
                        <button onClick={() => navigate(`/events/${app.event_id}/result`)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-medium border"
                          style={{ borderColor: '#c9956a', color: '#7b4f2e' }}>
                          💌 결과 보기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 네비 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        {[
          { icon: '🏠', label: '홈', path: '/home' },
          { icon: '☕', label: '이벤트', path: '/events' },
          { icon: '👤', label: '마이', path: '/my', active: true },
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
