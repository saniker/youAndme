import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store';
import { Spinner } from '../components/Layout';

export default function ResultPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return navigate('/', { replace: true });
    fetchResults();
  }, []);

  async function fetchResults() {
    try {
      const { data: ev } = await api.get('/events/active');
      if (!ev) return;
      const { data } = await api.get(`/events/${ev.id}/my-matches`);
      setMatches(data);
    } catch {}
    finally { setLoading(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf6ee' }}><Spinner /></div>;

  return (
    <div className="min-h-screen" style={{ background: '#fdf6ee' }}>
      <div className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 border-b"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        <span className="font-semibold" style={{ fontFamily: "'Playfair Display',serif", color: '#4a2c17', fontSize: 18 }}>매칭 결과</span>
        <button onClick={() => { logout(); navigate('/'); }}
          className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: '#c9956a', color: '#7b4f2e' }}>
          로그아웃
        </button>
      </div>

      <div className="px-5 pt-8 pb-16">
        {/* 상단 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
            {matches.length > 0 ? '🎉' : '💌'}
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#4a2c17' }}>
            {matches.length > 0 ? `${matches.length}명과 매칭됐어요!` : '아직 매칭이 없어요'}
          </h2>
          <p className="text-sm" style={{ color: '#a07850' }}>
            {matches.length > 0
              ? '서로 좋아요를 눌렀어요 ☕'
              : '아쉽지만 다음 기회를 노려봐요 💪'}
          </p>
        </div>

        {/* 매칭 카드 목록 */}
        {matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((m, i) => (
              <div key={m.id} className="rounded-2xl overflow-hidden"
                style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.12)', animation: `fadeIn 0.4s ease ${i * 0.1}s both` }}>
                <div className="h-3" style={{ background: 'linear-gradient(90deg, #c9956a, #e8b48a)' }} />
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: '#e8d5b7' }}>
                      {m.partner_photo
                        ? <img src={m.partner_photo} alt={m.partner_name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: '#f2e4cc' }}>
                            {m.partner_gender === 'M' ? '👨' : '👩'}
                          </div>
                      }
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base mb-0.5" style={{ color: '#4a2c17' }}>{m.partner_name}</div>
                      <div className="text-sm" style={{ color: '#a07850' }}>
                        {m.partner_age}세 · {m.partner_job || '직업 미입력'}
                      </div>
                    </div>
                    <div className="text-2xl">💕</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
            <div className="text-4xl mb-4">☕</div>
            <p className="text-sm leading-relaxed" style={{ color: '#6b4226' }}>
              오늘 만났던 분들이<br />
              기억에 남길 바라요<br />
              <span style={{ color: '#a07850' }}>다음 이벤트에서 또 만나요!</span>
            </p>
          </div>
        )}

        {/* 운영자가 매칭 결과를 아직 공개하지 않은 경우 */}
        <div className="mt-6 rounded-2xl p-4 text-center" style={{ background: '#f2e4cc' }}>
          <p className="text-xs" style={{ color: '#7b4f2e' }}>
            ☕ 이벤트가 종료되면 운영자가 최종 매칭 결과를 공개해요
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
