import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuthStore } from '../store';
import { Avatar, Spinner, Toast } from '../components/Layout';

let socket = null;

export default function EventPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [partner, setPartner] = useState(null);
  const [liked, setLiked] = useState(false);
  const [round, setRound] = useState(0);
  const [tableNo, setTableNo] = useState(0);
  const [timer, setTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [roundEnd, setRoundEnd] = useState(false);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  const fetchPartner = useCallback(async (ev) => {
    if (!ev) return;
    try {
      const { data } = await api.get(`/events/${ev.id}/my-partner`);
      setPartner(data.partner);
      setLiked(data.liked);
      setRound(data.round);
      setTableNo(data.tableNo);
      setRoundEnd(false);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user || !token) return navigate('/', { replace: true });

    async function init() {
      try {
        const { data: ev } = await api.get('/events/active');
        if (!ev || ev.status === 'finished') return navigate('/result', { replace: true });
        setEvent(ev);
        if (ev.status === 'active') await fetchPartner(ev);

        // Socket.io 연결
        socket = io({ auth: { token } });
        socket.emit('join-event', { eventId: ev.id, token });

        socket.on('timer-tick', ({ remaining }) => setTimer(remaining));
        socket.on('timer-start', ({ remaining }) => { setTimer(remaining); setRoundEnd(false); });
        socket.on('timer-paused', ({ remaining }) => setTimer(remaining));
        socket.on('round-end', () => setRoundEnd(true));

        // 다음 라운드 시작 시
        socket.on('next-round', async ({ round: r }) => {
          setRound(r);
          await fetchPartner(ev);
          showToast(`🔔 라운드 ${r} 시작!`);
        });

        socket.on('event-finished', () => navigate('/result', { replace: true }));
      } catch {}
      finally { setLoading(false); }
    }

    init();
    return () => { socket?.disconnect(); socket = null; };
  }, []);

  async function handleLike() {
    if (!partner || liked || !event) return;
    try {
      await api.post(`/events/${event.id}/like`, { toUserId: partner.id, roundNo: round });
      setLiked(true);
      showToast('💕 좋아요를 눌렀습니다!');
    } catch {
      showToast('오류가 발생했습니다.');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf6ee' }}><Spinner /></div>;

  const fmtTime = (s) => s == null ? '--:--' : `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const timerPct = timer != null && event ? (timer / (event.round_minutes * 60)) * 100 : 100;
  const timerColor = timer != null ? (timer > 120 ? '#6a9e6a' : timer > 60 ? '#c9956a' : '#c45f5f') : '#6a9e6a';

  return (
    <div className="min-h-screen pb-8" style={{ background: '#fdf6ee' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 py-3 border-b" style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ fontFamily: "'Playfair Display',serif", color: '#4a2c17' }}>YouAndMe</span>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#f2e4cc', color: '#7b4f2e' }}>
              테이블 {tableNo}번
            </span>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#4a2c17', color: 'white' }}>
              {round}/{event?.total_rounds || 10} 라운드
            </span>
          </div>
        </div>

        {/* 타이머 바 */}
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#e8d5b7' }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timerPct}%`, background: timerColor }} />
        </div>
        <div className="text-center mt-1">
          <span className="text-2xl font-bold tabular-nums" style={{ color: timerColor }}>{fmtTime(timer)}</span>
        </div>
      </div>

      <div className="px-5 pt-6">
        {event?.status === 'waiting' && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
            <div className="text-5xl mb-4 animate-bounce">☕</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#4a2c17' }}>이벤트 시작을 기다리고 있어요</h2>
            <p className="text-sm" style={{ color: '#a07850' }}>운영자가 곧 이벤트를 시작할 거예요</p>
          </div>
        )}

        {event?.status === 'active' && partner && (
          <>
            {/* 라운드 종료 배너 */}
            {roundEnd && (
              <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: '#f2e4cc' }}>
                <p className="font-medium" style={{ color: '#4a2c17' }}>⏰ 이번 라운드가 끝났습니다!</p>
                <p className="text-sm mt-1" style={{ color: '#7b4f2e' }}>다음 라운드를 기다려주세요</p>
              </div>
            )}

            {/* 상대 프로필 카드 */}
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#fffdf9', boxShadow: '0 8px 32px rgba(74,44,23,0.15)' }}>
              {/* 상단 그라데이션 */}
              <div className="h-32 flex items-end justify-center pb-4 relative" style={{ background: 'linear-gradient(135deg, #c9956a 0%, #a0704a 100%)' }}>
                <div className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {partner.gender === 'M' ? '👨 남성' : '👩 여성'}
                </div>
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {partner.photo
                    ? <img src={partner.photo} alt={partner.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: '#f2e4cc' }}>
                        {partner.gender === 'M' ? '👨' : '👩'}
                      </div>
                  }
                </div>
              </div>

              <div className="p-5">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold mb-1" style={{ color: '#4a2c17' }}>{partner.name}</h2>
                  <p className="text-sm" style={{ color: '#a07850' }}>{partner.age}세 · {partner.job || '직업 미입력'}</p>
                </div>

                {partner.intro && (
                  <div className="rounded-xl p-4 mb-4" style={{ background: '#fdf6ee' }}>
                    <p className="text-sm leading-relaxed text-center" style={{ color: '#6b4226' }}>
                      "{partner.intro}"
                    </p>
                  </div>
                )}

                {/* 테이블 정보 */}
                <div className="flex justify-center gap-3 text-xs" style={{ color: '#a07850' }}>
                  <span>📍 {partner.table_no}번 테이블</span>
                </div>
              </div>
            </div>

            {/* 좋아요 버튼 */}
            <button
              onClick={handleLike}
              disabled={liked || roundEnd}
              className="w-full py-4 rounded-2xl font-medium text-base transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: liked ? '#f2e4cc' : 'linear-gradient(135deg, #c45f8a 0%, #e07a9a 100%)',
                color: liked ? '#7b4f2e' : 'white',
                boxShadow: liked ? 'none' : '0 4px 16px rgba(196,95,138,0.35)'
              }}>
              {liked ? '💕 좋아요를 눌렀어요!' : '🩷 좋아요'}
            </button>

            <p className="text-center text-xs mt-3" style={{ color: '#a07850' }}>
              서로 좋아요를 누르면 이벤트 종료 후 매칭돼요
            </p>
          </>
        )}

        {event?.status === 'active' && !partner && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#fffdf9' }}>
            <div className="text-4xl mb-3">🔍</div>
            <p style={{ color: '#6b4226' }}>상대를 불러오는 중...</p>
          </div>
        )}
      </div>

      <Toast msg={toast} />
    </div>
  );
}
