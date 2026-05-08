import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { Spinner, Toast, Avatar } from '../components/Layout';

export default function LikesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  useEffect(() => { fetchParticipants(); }, [id]);

  async function fetchParticipants() {
    try {
      const { data } = await api.get(`/events/${id}/participants`);
      setParticipants(data.participants);
      setSelected(data.likedIds);
      if (data.likedIds.length > 0) setSubmitted(true);
    } catch (err) {
      showToast(err.response?.data?.error || '불러오기 실패');
    } finally { setLoading(false); }
  }

  function toggle(uid) {
    if (submitted) return;
    setSelected(prev => prev.includes(uid) ? prev.filter(i => i !== uid) : [...prev, uid]);
  }

  async function handleSubmit() {
    if (selected.length === 0) return showToast('최소 1명을 선택해주세요.');
    if (!confirm(`${selected.length}명에게 좋아요를 보내시겠습니까?\n제출 후에는 수정할 수 없습니다.`)) return;
    setSubmitting(true);
    try {
      await api.post(`/events/${id}/likes`, { userIds: selected });
      setSubmitted(true);
      showToast('💕 좋아요가 전달됐습니다!');
      setTimeout(() => navigate(`/events/${id}/result`), 1800);
    } catch (err) {
      showToast(err.response?.data?.error || '제출 실패');
    } finally { setSubmitting(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf6ee' }}><Spinner /></div>;

  return (
    <div className="min-h-screen pb-32" style={{ background: '#fdf6ee' }}>
      <div className="sticky top-0 z-50 px-5 py-4 border-b flex items-center gap-3"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        <button onClick={() => navigate(-1)} className="text-xl" style={{ color: '#7b4f2e' }}>←</button>
        <div className="flex-1">
          <div className="font-semibold text-sm" style={{ color: '#4a2c17' }}>좋아요 입력</div>
          <div className="text-xs" style={{ color: '#a07850' }}>마음에 드셨던 분을 선택해주세요</div>
        </div>
        {!submitted && (
          <span className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: '#f2e4cc', color: '#7b4f2e' }}>{selected.length}명 선택</span>
        )}
      </div>

      <div className="px-5 pt-5">
        {submitted && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: '#fce4f0' }}>
            <span className="text-2xl">💕</span>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#9a3f6a' }}>좋아요를 이미 제출했어요!</div>
              <div className="text-xs mt-0.5" style={{ color: '#9a3f6a' }}>결과는 아래에서 확인하세요</div>
            </div>
          </div>
        )}

        {participants.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#a07850' }}>
            <div className="text-4xl mb-3">😢</div>
            <p className="text-sm">상대 참가자 정보를 불러올 수 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map(p => {
              const isSelected = selected.includes(p.id);
              return (
                <button key={p.id} onClick={() => toggle(p.id)} disabled={submitted}
                  className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-95"
                  style={{
                    background: '#fffdf9',
                    boxShadow: isSelected ? '0 4px 20px rgba(196,95,138,0.2)' : '0 4px 20px rgba(74,44,23,0.08)',
                    border: `2px solid ${isSelected ? '#e07a9a' : 'transparent'}`
                  }}>
                  <div className="p-4 flex items-center gap-4">
                    <Avatar src={p.photo} name={p.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold" style={{ color: '#4a2c17' }}>{p.name}</div>
                      <div className="text-xs" style={{ color: '#a07850' }}>
                        {p.age}세 · {p.job || '직업 미입력'}
                      </div>
                      {p.intro && (
                        <div className="text-xs mt-1 truncate" style={{ color: '#6b4226' }}>"{p.intro}"</div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: isSelected ? '#e07a9a' : '#f2e4cc' }}>
                      <span className="text-base">{isSelected ? '💕' : '🩶'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      {!submitted && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-6 pt-3"
          style={{ background: 'linear-gradient(transparent, #fdf6ee 40%)' }}>
          <button onClick={handleSubmit} disabled={submitting || selected.length === 0}
            className="w-full py-4 rounded-2xl font-medium text-white text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #c45f8a, #e07a9a)', boxShadow: '0 4px 16px rgba(196,95,138,0.35)' }}>
            {submitting ? '제출 중...' : `💕 ${selected.length}명에게 좋아요 보내기`}
          </button>
          <p className="text-center text-xs mt-2" style={{ color: '#a07850' }}>제출 후에는 수정할 수 없어요</p>
        </div>
      )}

      {submitted && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-6 pt-3"
          style={{ background: 'linear-gradient(transparent, #fdf6ee 40%)' }}>
          <button onClick={() => navigate(`/events/${id}/result`)}
            className="w-full py-4 rounded-2xl font-medium text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #7b4f2e, #a0704a)' }}>
            💌 매칭 결과 보기
          </button>
        </div>
      )}

      <Toast msg={toast} />
    </div>
  );
}
