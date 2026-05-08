import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { Spinner, Toast } from '../components/Layout';

const STATUS_MAP = {
  open:     { label: '신청 가능', color: '#4a7a4a', bg: '#e8f4e8' },
  closed:   { label: '신청 마감', color: '#7b5a2a', bg: '#f2e4cc' },
  finished: { label: '행사 종료', color: '#6b4226', bg: '#f0e8e0' },
};
const APP_MAP = {
  pending:   { label: '검토 중', color: '#3a5a8a', bg: '#e8eef8' },
  confirmed: { label: '✅ 참가 확정', color: '#4a7a4a', bg: '#e8f4e8' },
  rejected:  { label: '미선정', color: '#9a3f3f', bg: '#fce8e8' },
};

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  useEffect(() => { fetchEvent(); }, [id]);

  async function fetchEvent() {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data);
    } catch { navigate('/events'); }
    finally { setLoading(false); }
  }

  async function handleApply() {
    setApplying(true);
    try {
      await api.post(`/events/${id}/apply`);
      showToast('✅ 신청이 완료됐습니다!');
      fetchEvent();
    } catch (err) {
      showToast(err.response?.data?.error || '신청에 실패했습니다.');
    } finally { setApplying(false); }
  }

  async function handleCancel() {
    if (!confirm('신청을 취소하시겠습니까?')) return;
    try {
      await api.delete(`/events/${id}/apply`);
      showToast('신청이 취소됐습니다.');
      fetchEvent();
    } catch (err) {
      showToast(err.response?.data?.error || '취소에 실패했습니다.');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf6ee' }}><Spinner /></div>;
  if (!event) return null;

  const st = STATUS_MAP[event.status];
  const app = event.myApplication;
  const appSt = app ? APP_MAP[app.status] : null;
  const canApply = event.status === 'open' && !app;
  const canCancel = app?.status === 'pending';
  const isFinished = event.status === 'finished';
  const isConfirmed = app?.status === 'confirmed';

  return (
    <div className="min-h-screen pb-40" style={{ background: '#fdf6ee' }}>
      {/* 헤더 이미지 */}
      <div className="relative h-56" style={{ background: 'linear-gradient(135deg, #c9956a 0%, #7b4f2e 100%)' }}>
        {event.thumbnail
          ? <img src={event.thumbnail} alt="" className="w-full h-full object-cover" />
          : <div className="h-full flex flex-col items-center justify-center">
              <div className="text-6xl mb-2">☕</div>
              <div className="text-white font-medium">{event.cafe_name}</div>
            </div>
        }
        <button onClick={() => navigate('/events')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)', color: 'white' }}>
          ←
        </button>
        <div className="absolute top-4 right-4">
          <span className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
      </div>

      <div className="px-5 -mt-5 relative z-10">
        {/* 제목 카드 */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.12)' }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#4a2c17' }}>{event.title}</h1>
          <div className="space-y-1.5 text-sm" style={{ color: '#7b4f2e' }}>
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{event.date} {event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{event.region} · {event.cafe_name}</span>
            </div>
            {event.cafe_address && (
              <div className="flex items-center gap-2">
                <span>🗺</span>
                <span className="text-xs" style={{ color: '#a07850' }}>{event.cafe_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* 내 신청 상태 */}
        {appSt && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: appSt.bg }}>
            <span className="text-2xl">📋</span>
            <div>
              <div className="font-semibold text-sm" style={{ color: appSt.color }}>내 신청 상태: {appSt.label}</div>
              <div className="text-xs mt-0.5" style={{ color: appSt.color + 'aa' }}>
                {app.status === 'pending' && '운영자가 검토 중입니다. 확정 시 알림을 보내드려요.'}
                {app.status === 'confirmed' && '참가가 확정됐습니다! 당일을 기대해주세요 ☕'}
                {app.status === 'rejected' && '이번 이벤트는 아쉽게도 참가가 어렵게 됐습니다.'}
              </div>
            </div>
          </div>
        )}

        {/* 행사 종료 + 확정 참가자 → 좋아요 입력 버튼 */}
        {isFinished && isConfirmed && (
          <button onClick={() => navigate(`/events/${id}/likes`)}
            className="w-full py-4 rounded-2xl font-medium text-white mb-4 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #c45f8a, #e07a9a)', boxShadow: '0 4px 16px rgba(196,95,138,0.35)' }}>
            💕 좋아요 입력하기
          </button>
        )}
        {isFinished && isConfirmed && (
          <button onClick={() => navigate(`/events/${id}/result`)}
            className="w-full py-3.5 rounded-2xl font-medium border mb-4 transition-all"
            style={{ borderColor: '#c9956a', color: '#7b4f2e', background: 'transparent' }}>
            💌 매칭 결과 보기
          </button>
        )}

        {/* 정원 현황 */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.08)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#4a2c17' }}>참가 현황</p>
          <div className="flex gap-3">
            {[['👨', '남성', event.confirmed_m, event.capacity_m], ['👩', '여성', event.confirmed_f, event.capacity_f]].map(([ico, label, cur, cap]) => (
              <div key={label} className="flex-1 rounded-xl p-3 text-center" style={{ background: '#fdf6ee' }}>
                <div className="text-sm mb-1">{ico} {label}</div>
                <div className="text-lg font-bold mb-1" style={{ color: cur >= cap ? '#c45f5f' : '#4a2c17' }}>{cur} / {cap}</div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e8d5b7' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, cur/cap*100)}%`, background: cur >= cap ? '#c45f5f' : '#7b4f2e' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 이벤트 소개 */}
        {event.description && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.08)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#4a2c17' }}>이벤트 소개</p>
            <p className="text-sm leading-relaxed" style={{ color: '#6b4226' }}>{event.description}</p>
          </div>
        )}

        {/* 안내사항 */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#f2e4cc' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#4a2c17' }}>안내사항</p>
          <ul className="text-xs space-y-1" style={{ color: '#7b4f2e' }}>
            <li>• 10명의 이성과 10분씩 대화하는 로테이션 소개팅입니다</li>
            <li>• 신청 후 운영자 검토를 거쳐 참가가 확정됩니다</li>
            <li>• 확정 시 앱 알림과 D-5일 전 리마인더를 보내드려요</li>
            <li>• 행사 종료 후 앱에서 좋아요를 입력하시면 됩니다</li>
          </ul>
        </div>
      </div>

      {/* 신청 버튼 - 네비바 위 */}
      <div className="fixed bottom-[60px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-3 pt-3"
        style={{ background: 'linear-gradient(transparent, #fdf6ee 40%)' }}>
        {canApply && (
          <button onClick={handleApply} disabled={applying}
            className="w-full py-4 rounded-2xl font-medium text-white text-sm transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #7b4f2e, #a0704a)', boxShadow: '0 4px 12px rgba(123,79,46,0.3)' }}>
            {applying ? '신청 중...' : '✨ 참가 신청하기'}
          </button>
        )}
        {canCancel && (
          <button onClick={handleCancel}
            className="w-full py-4 rounded-2xl font-medium text-sm border transition-all"
            style={{ borderColor: '#c45f5f', color: '#c45f5f', background: 'transparent' }}>
            신청 취소
          </button>
        )}
        {event.status === 'closed' && !app && (
          <div className="w-full py-4 rounded-2xl text-center text-sm"
            style={{ background: '#f2e4cc', color: '#7b5a2a' }}>신청이 마감됐습니다</div>
        )}
      </div>

      {/* 하단 네비 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        {[
          { icon: '🏠', label: '홈', path: '/home' },
          { icon: '☕', label: '이벤트', path: '/events', active: true },
          { icon: '👤', label: '마이', path: '/my' },
        ].map(n => (
          <button key={n.label} onClick={() => navigate(n.path)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium"
            style={{ color: n.active ? '#4a2c17' : '#a07850' }}>
            <span className="text-xl">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <Toast msg={toast} />
    </div>
  );
}
