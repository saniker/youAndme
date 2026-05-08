import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { Spinner, Avatar } from '../components/Layout';

export default function MatchResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchResult(); }, [id]);

  async function fetchResult() {
    try {
      const { data: d } = await api.get(`/events/${id}/my-matches`);
      setData(d);
    } catch {}
    finally { setLoading(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf6ee' }}><Spinner /></div>;

  const matches = data?.matches || [];
  const eventStatus = data?.eventStatus;

  return (
    <div className="min-h-screen pb-16" style={{ background: '#fdf6ee' }}>
      <div className="sticky top-0 z-50 px-5 py-4 border-b flex items-center gap-3"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        <button onClick={() => navigate(-1)} className="text-xl" style={{ color: '#7b4f2e' }}>←</button>
        <span className="font-semibold" style={{ color: '#4a2c17' }}>매칭 결과</span>
      </div>

      <div className="px-5 pt-8 pb-10">
        {/* 상단 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
            {matches.length > 0 ? '🎉' : '💌'}
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#4a2c17' }}>
            {eventStatus !== 'finished'
              ? '아직 결과가 공개되지 않았어요'
              : matches.length > 0
                ? `${matches.length}명과 매칭됐어요!`
                : '아쉽지만 매칭이 없어요'}
          </h2>
          <p className="text-sm" style={{ color: '#a07850' }}>
            {eventStatus !== 'finished'
              ? '행사 종료 후 결과가 공개됩니다'
              : matches.length > 0
                ? '서로 마음이 통했어요 ☕'
                : '다음 이벤트에서 꼭 좋은 인연 만나세요!'}
          </p>
        </div>

        {/* 매칭 카드 */}
        {matches.length > 0 && (
          <div className="space-y-4">
            {matches.map((m, i) => (
              <div key={i} className="rounded-2xl overflow-hidden"
                style={{ background: '#fffdf9', boxShadow: '0 8px 32px rgba(74,44,23,0.12)', animation: `fadeIn 0.4s ease ${i*0.1}s both` }}>
                <div className="h-2" style={{ background: 'linear-gradient(90deg, #c9956a, #e8b48a)' }} />
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar src={m.partner_photo} name={m.partner_name} size="lg" />
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-0.5" style={{ color: '#4a2c17' }}>{m.partner_name}</div>
                      <div className="text-sm" style={{ color: '#a07850' }}>
                        {m.partner_age}세 · {m.partner_job || '직업 미입력'}
                      </div>
                    </div>
                    <span className="text-3xl">💕</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 행사 진행 중 안내 */}
        {eventStatus !== 'finished' && (
          <div className="rounded-2xl p-5 text-center" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
            <div className="text-3xl mb-3">☕</div>
            <p className="text-sm leading-relaxed" style={{ color: '#6b4226' }}>
              행사가 종료되면<br />
              좋아요 입력 알림을 보내드려요
            </p>
          </div>
        )}

        <button onClick={() => navigate('/events')}
          className="w-full mt-6 py-4 rounded-2xl font-medium text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #7b4f2e, #a0704a)' }}>
          다른 이벤트 둘러보기
        </button>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
