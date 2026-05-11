import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getPhotoUrl } from '../api';
import { Spinner, Toast, BottomNav } from '../components/Layout';

const STATUS_MAP = {
  open:     { label: '신청 가능', color: '#00C853', bg: '#E6FAF0' },
  closed:   { label: '신청 마감', color: '#8B95A1', bg: '#F2F4F6' },
  finished: { label: '행사 종료', color: '#8B95A1', bg: '#F2F4F6' },
};
const APP_MAP = {
  pending:   { label: '검토 중', color: '#3182F6', bg: '#EBF3FF' },
  confirmed: { label: '✅ 참가 확정', color: '#00C853', bg: '#E6FAF0' },
  rejected:  { label: '미선정', color: '#F04452', bg: '#FFF0F0' },
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
    try { const { data } = await api.get(`/events/${id}`); setEvent(data); }
    catch { navigate('/events'); } finally { setLoading(false); }
  }

  async function handleApply() {
    setApplying(true);
    try { await api.post(`/events/${id}/apply`); showToast('✅ 신청이 완료됐습니다!'); fetchEvent(); }
    catch (err) { showToast(err.response?.data?.error || '신청에 실패했습니다.'); }
    finally { setApplying(false); }
  }

  async function handleCancel() {
    if (!confirm('신청을 취소하시겠습니까?')) return;
    try { await api.delete(`/events/${id}/apply`); showToast('신청이 취소됐습니다.'); fetchEvent(); }
    catch (err) { showToast(err.response?.data?.error || '취소에 실패했습니다.'); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F4F6' }}><Spinner /></div>;
  if (!event) return null;

  const st = STATUS_MAP[event.status];
  const app = event.myApplication;
  const appSt = app ? APP_MAP[app.status] : null;
  const canApply = event.status === 'open' && !app;
  const canCancel = app?.status === 'pending';
  const isFinished = event.status === 'finished';
  const isConfirmed = app?.status === 'confirmed';

  return (
    <div className="min-h-screen pb-40" style={{ background: '#F2F4F6' }}>
      {/* 썸네일 헤더 */}
      <div className="relative h-56" style={{ background: 'linear-gradient(135deg, #3182F6, #1a5fb4)' }}>
        {event.thumbnail
          ? <img src={getPhotoUrl(event.thumbnail)} alt="" className="w-full h-full object-cover" />
          : <div className="h-full flex flex-col items-center justify-center">
              <div className="text-6xl mb-2">☕</div>
              <div className="text-white font-bold">{event.cafe_name}</div>
            </div>
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.1))' }} />
        <button onClick={() => navigate('/events')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center font-bold text-white"
          style={{ background: 'rgba(0,0,0,0.35)' }}>←</button>
        <div className="absolute top-4 right-4">
          <span className="text-xs px-3 py-1.5 rounded-full font-bold"
            style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10 space-y-3">
        {/* 제목 카드 */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h1 className="text-xl font-black mb-3" style={{ color: '#191F28' }}>{event.title}</h1>
          <div className="space-y-2 text-sm">
            {[
              ['📅', `${event.date} ${event.time}`],
              ['📍', `${event.region} · ${event.cafe_name}`],
              ...(event.cafe_address ? [['🗺', event.cafe_address]] : []),
            ].map(([icon, text]) => (
              <div key={icon} className="flex items-center gap-2" style={{ color: '#4A4F5C' }}>
                <span>{icon}</span><span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 신청 상태 */}
        {appSt && (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: appSt.bg }}>
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-bold text-sm" style={{ color: appSt.color }}>내 신청 상태: {appSt.label}</p>
              <p className="text-xs mt-0.5" style={{ color: appSt.color }}>
                {app.status === 'pending' && '운영자가 검토 중입니다. 확정 시 알림을 보내드려요.'}
                {app.status === 'confirmed' && '참가가 확정됐습니다! 당일을 기대해주세요 ☕'}
                {app.status === 'rejected' && '이번 이벤트는 아쉽게도 참가가 어렵게 됐습니다.'}
              </p>
            </div>
          </div>
        )}

        {/* 행사 종료 + 확정 버튼 */}
        {isFinished && isConfirmed && (
          <div className="space-y-2">
            <button onClick={() => navigate(`/events/${id}/likes`)}
              className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-95"
              style={{ background: '#3182F6' }}>💕 좋아요 입력하기</button>
            <button onClick={() => navigate(`/events/${id}/result`)}
              className="w-full py-3.5 rounded-2xl font-bold transition-all"
              style={{ background: '#F2F4F6', color: '#191F28' }}>💌 매칭 결과 보기</button>
          </div>
        )}

        {/* 참가 현황 */}
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-black mb-3" style={{ color: '#191F28' }}>참가 현황</p>
          <div className="flex gap-2">
            {[['👨 남성', event.confirmed_m, event.capacity_m], ['👩 여성', event.confirmed_f, event.capacity_f]].map(([label, cur, cap]) => (
              <div key={label} className="flex-1 rounded-xl p-3" style={{ background: '#F2F4F6' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#8B95A1' }}>{label}</p>
                <p className="text-lg font-black mb-1" style={{ color: cur >= cap ? '#F04452' : '#191F28' }}>{cur} / {cap}</p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E8EB' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, cur / cap * 100)}%`, background: cur >= cap ? '#F04452' : '#3182F6' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 이벤트 소개 */}
        {event.description && (
          <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="text-sm font-black mb-2" style={{ color: '#191F28' }}>이벤트 소개</p>
            <p className="text-sm leading-relaxed" style={{ color: '#4A4F5C' }}>{event.description}</p>
          </div>
        )}

        {/* 안내사항 */}
        <div className="rounded-2xl p-4" style={{ background: '#EBF3FF' }}>
          <p className="text-sm font-black mb-2" style={{ color: '#191F28' }}>안내사항</p>
          <ul className="text-xs space-y-1.5" style={{ color: '#4A4F5C' }}>
            {[
              '10명의 이성과 10분씩 대화하는 로테이션 소개팅입니다',
              '신청 후 운영자 검토를 거쳐 참가가 확정됩니다',
              '확정 시 앱 알림과 D-5일 전 리마인더를 보내드려요',
              '행사 종료 후 앱에서 좋아요를 입력하시면 됩니다',
            ].map(t => <li key={t}>· {t}</li>)}
          </ul>
        </div>
      </div>

      {/* 신청 버튼 */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-3 pt-2"
        style={{ bottom: 60, background: 'linear-gradient(transparent, #F2F4F6 40%)' }}>
        {canApply && (
          <button onClick={handleApply} disabled={applying}
            className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: '#3182F6' }}>
            {applying ? '신청 중...' : '✨ 참가 신청하기'}
          </button>
        )}
        {canCancel && (
          <button onClick={handleCancel}
            className="w-full py-4 rounded-2xl font-bold transition-all"
            style={{ background: '#FFF0F0', color: '#F04452' }}>신청 취소</button>
        )}
        {event.status === 'closed' && !app && (
          <div className="w-full py-4 rounded-2xl text-center font-bold text-sm"
            style={{ background: '#F2F4F6', color: '#8B95A1' }}>신청이 마감됐습니다</div>
        )}
      </div>

      <BottomNav active="이벤트" navigate={navigate} />
      <Toast msg={toast} />
    </div>
  );
}
