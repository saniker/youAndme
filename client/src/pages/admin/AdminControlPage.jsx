import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../api';
import { useAuthStore } from '../../store';
import { AdminNav } from './AdminNav';
import { Spinner, Toast, Avatar } from '../../components/Layout';

let socket = null;

export default function AdminControlPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [timer, setTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  useEffect(() => {
    if (!user) return navigate('/admin', { replace: true });
    fetchEvents();

    socket = io({ auth: { token } });
    socket.emit('join-admin', { token });
    socket.on('timer-tick', ({ remaining }) => setTimer(remaining));
    socket.on('round-end', () => showToast('⏰ 라운드 종료!'));

    return () => { socket?.disconnect(); socket = null; };
  }, []);

  useEffect(() => {
    // 이벤트 페이지에서 넘어온 경우 자동 선택
    if (location.state?.eventId && events.length > 0) {
      const ev = events.find(e => e.id === location.state.eventId);
      if (ev) selectEvent(ev);
    }
  }, [events, location.state]);

  async function fetchEvents() {
    try {
      const { data } = await api.get('/admin/events');
      setEvents(data.filter(e => e.status !== 'finished'));
    } catch {}
    finally { setLoading(false); }
  }

  async function selectEvent(ev) {
    setSelectedEvent(ev);
    try {
      const { data } = await api.get(`/admin/events/${ev.id}`);
      setParticipants(data.participants || []);
      setSelectedEvent(data);
    } catch {}
  }

  async function startRound() {
    if (!selectedEvent) return;
    try {
      // 다음 라운드 설정
      const { data } = await api.post(`/admin/events/${selectedEvent.id}/next-round`);
      // 타이머 시작
      await api.post(`/admin/events/${selectedEvent.id}/start-timer`, {
        seconds: selectedEvent.round_minutes * 60
      });
      socket?.emit('next-round', { eventId: selectedEvent.id, round: data.round });
      showToast(`🔔 라운드 ${data.round} 시작!`);
      setSelectedEvent(prev => ({ ...prev, current_round: data.round, status: 'active' }));
    } catch { showToast('오류 발생'); }
  }

  async function pauseTimer() {
    if (!selectedEvent) return;
    await api.post(`/admin/events/${selectedEvent.id}/pause-timer`);
    showToast('⏸ 타이머 일시정지');
  }

  async function resumeTimer() {
    if (!selectedEvent || timer == null) return;
    await api.post(`/admin/events/${selectedEvent.id}/start-timer`, { seconds: timer });
    showToast('▶ 타이머 재개');
  }

  async function finishEvent() {
    if (!selectedEvent) return;
    if (!window.confirm('이벤트를 종료하시겠습니까?')) return;
    await api.patch(`/admin/events/${selectedEvent.id}/status`, { status: 'finished' });
    await api.post(`/admin/events/${selectedEvent.id}/compute-matches`);
    socket?.emit('event-finished', { eventId: selectedEvent.id });
    showToast('✅ 이벤트 종료 및 매칭 집계 완료!');
    navigate('/admin/results', { state: { eventId: selectedEvent.id } });
  }

  const fmtTime = (s) => s == null ? '--:--' : `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const timerColor = timer != null ? (timer > 120 ? '#6a9e6a' : timer > 60 ? '#c9956a' : '#c45f5f') : '#4a2c17';
  const males = participants.filter(p => p.gender === 'M');
  const females = participants.filter(p => p.gender === 'F');

  return (
    <div className="min-h-screen pb-24" style={{ background: '#fdf6ee' }}>
      <div className="sticky top-0 z-50 px-5 py-4 border-b"
        style={{ background: '#4a2c17' }}>
        <span className="font-semibold text-white" style={{ fontFamily: "'Playfair Display',serif", fontSize: 18 }}>이벤트 진행</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="px-5 pt-4">
          {/* 이벤트 선택 */}
          {!selectedEvent && (
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: '#4a2c17' }}>진행할 이벤트 선택</p>
              {events.length === 0 ? (
                <div className="text-center py-16" style={{ color: '#a07850' }}>
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-sm">진행 가능한 이벤트가 없어요</p>
                </div>
              ) : events.map(ev => (
                <button key={ev.id} onClick={() => selectEvent(ev)}
                  className="w-full text-left rounded-2xl p-4 mb-3 transition-all active:scale-95"
                  style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
                  <div className="font-semibold mb-1" style={{ color: '#4a2c17' }}>{ev.title}</div>
                  <div className="text-xs" style={{ color: '#a07850' }}>{ev.date} · {ev.venue}</div>
                </button>
              ))}
            </div>
          )}

          {selectedEvent && (
            <>
              {/* 이벤트 정보 */}
              <div className="rounded-2xl p-4 mb-4" style={{ background: '#4a2c17' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{selectedEvent.title}</span>
                  <button onClick={() => setSelectedEvent(null)} className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>변경</button>
                </div>
                <div className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedEvent.date} · {selectedEvent.venue}</div>

                {/* 라운드 진행 바 */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-white">라운드</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(selectedEvent.current_round / selectedEvent.total_rounds) * 100}%`, background: '#c9956a' }} />
                  </div>
                  <span className="text-xs text-white">{selectedEvent.current_round}/{selectedEvent.total_rounds}</span>
                </div>

                {/* 타이머 */}
                <div className="text-center">
                  <span className="text-4xl font-bold tabular-nums" style={{ color: timerColor === '#4a2c17' ? 'white' : timerColor }}>
                    {fmtTime(timer)}
                  </span>
                </div>
              </div>

              {/* 컨트롤 버튼 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={startRound}
                  className="py-4 rounded-2xl font-medium text-sm text-white transition-all active:scale-95"
                  style={{ background: '#6a9e6a' }}>
                  {selectedEvent.current_round === 0 ? '▶ 이벤트 시작' : `▶ 라운드 ${selectedEvent.current_round + 1} 시작`}
                </button>
                <button onClick={pauseTimer}
                  className="py-4 rounded-2xl font-medium text-sm text-white transition-all active:scale-95"
                  style={{ background: '#c9956a' }}>
                  ⏸ 일시정지
                </button>
                <button onClick={resumeTimer}
                  className="py-4 rounded-2xl font-medium text-sm text-white transition-all active:scale-95"
                  style={{ background: '#7b4f2e' }}>
                  ▶ 재개
                </button>
                <button onClick={finishEvent}
                  className="py-4 rounded-2xl font-medium text-sm text-white transition-all active:scale-95"
                  style={{ background: '#c45f5f' }}>
                  🏁 이벤트 종료
                </button>
              </div>

              {/* 참가자 현황 */}
              {participants.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: '#4a2c17' }}>
                    참가자 현황 ({participants.length}명)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs mb-2" style={{ color: '#a07850' }}>👨 남성 ({males.length}명)</p>
                      <div className="space-y-1.5">
                        {males.map(p => (
                          <div key={p.id} className="flex items-center gap-2">
                            <span className="text-xs w-5 text-center font-medium" style={{ color: '#c9956a' }}>{p.table_no}</span>
                            <Avatar src={p.photo} name={p.name} size="sm" />
                            <span className="text-xs font-medium" style={{ color: '#4a2c17' }}>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs mb-2" style={{ color: '#a07850' }}>👩 여성 ({females.length}명)</p>
                      <div className="space-y-1.5">
                        {females.map(p => (
                          <div key={p.id} className="flex items-center gap-2">
                            <span className="text-xs w-5 text-center font-medium" style={{ color: '#c9956a' }}>{p.table_no}</span>
                            <Avatar src={p.photo} name={p.name} size="sm" />
                            <span className="text-xs font-medium" style={{ color: '#4a2c17' }}>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <AdminNav active="control" />
      <Toast msg={toast} />
    </div>
  );
}
