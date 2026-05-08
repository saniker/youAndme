import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { AdminNav } from './AdminNav';
import { Spinner, Toast, Avatar, Tag } from '../../components/Layout';

const inp = { width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e8d5b7', background:'#fffdf9', color:'#2d1a0e', fontFamily:'inherit', fontSize:14, outline:'none' };

export default function AdminEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('pending');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  useEffect(() => { fetchEvent(); }, [id]);

  async function fetchEvent() {
    try {
      const { data } = await api.get(`/admin/events/${id}`);
      setEvent(data);
      setEditForm({
        title: data.title, region: data.region, cafeName: data.cafe_name,
        cafeAddress: data.cafe_address, date: data.date, time: data.time,
        capacityM: data.capacity_m, capacityF: data.capacity_f, description: data.description
      });
    } catch { navigate('/admin/events'); }
    finally { setLoading(false); }
  }

  async function handleSaveEdit() {
    if (!editForm.title || !editForm.region || !editForm.cafeName || !editForm.date)
      return showToast('필수 항목을 모두 입력해주세요.');
    setSaving(true);
    try {
      await api.patch(`/admin/events/${id}`, editForm);
      showToast('✅ 수정됐습니다!');
      setShowEdit(false);
      fetchEvent();
    } catch (err) {
      showToast(err.response?.data?.error || '수정 실패');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm(`"${event.title}" 이벤트를 삭제하시겠습니까?\n신청 내역, 좋아요, 매칭 결과가 모두 삭제됩니다.`)) return;
    try {
      await api.delete(`/admin/events/${id}`);
      showToast('삭제됐습니다.');
      setTimeout(() => navigate('/admin/events'), 800);
    } catch (err) {
      showToast(err.response?.data?.error || '삭제 실패');
    }
  }

  async function updateAppStatus(appId, status) {
    try {
      await api.patch(`/admin/applications/${appId}`, { status });
      showToast({ confirmed: '✅ 확정', rejected: '❌ 거절', pending: '대기로 변경' }[status]);
      fetchEvent();
    } catch { showToast('오류 발생'); }
  }

  async function updateEventStatus(status) {
    const msg = { closed: '신청을 마감하시겠습니까?', open: '신청을 다시 열겠습니까?', finished: '행사를 종료하시겠습니까?\n참가자들에게 좋아요 입력 알림이 발송됩니다.' };
    if (!confirm(msg[status])) return;
    try {
      if (status === 'finished') { await api.post(`/admin/events/${id}/finish`); showToast('✅ 행사 종료! 알림 발송 완료'); }
      else { await api.patch(`/admin/events/${id}`, { status }); showToast('✅ 상태 변경됨'); }
      fetchEvent();
    } catch { showToast('오류 발생'); }
  }

  async function computeMatches() {
    if (!confirm('매칭 결과를 집계하시겠습니까?')) return;
    try {
      const { data } = await api.post(`/admin/events/${id}/compute-matches`);
      showToast(`💕 ${data.count}쌍 매칭 완료!`);
      navigate(`/admin/results/${id}`);
    } catch { showToast('집계 실패'); }
  }

  if (loading || !event) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf6ee' }}><Spinner /></div>;

  const apps = event.applications || [];
  const filtered = tab === 'all' ? apps : apps.filter(a => a.app_status === tab);
  const confirmedM = apps.filter(a => a.gender === 'M' && a.app_status === 'confirmed').length;
  const confirmedF = apps.filter(a => a.gender === 'F' && a.app_status === 'confirmed').length;
  const APP_COLOR = { pending: 'blue', confirmed: 'green', rejected: 'red' };
  const APP_LABEL = { pending: '검토 중', confirmed: '확정', rejected: '거절' };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#fdf6ee' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 py-4 flex items-center gap-3" style={{ background: '#4a2c17' }}>
        <button onClick={() => navigate('/admin/events')} className="text-white text-xl">←</button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{event.title}</div>
          <div className="text-xs text-white opacity-60">{event.date} · {event.cafe_name}</div>
        </div>
        {/* 수정/삭제 버튼 */}
        <button onClick={() => setShowEdit(true)}
          className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: '#c9956a', color: 'white' }}>✏️ 수정</button>
        <button onClick={handleDelete}
          className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: 'rgba(196,95,95,0.85)', color: 'white' }}>🗑 삭제</button>
      </div>

      <div className="px-4 pt-4">
        {/* 이벤트 상태 카드 */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#4a2c17' }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[['👨', '남성', confirmedM, event.capacity_m], ['👩', '여성', confirmedF, event.capacity_f]].map(([ico, label, cur, cap]) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="text-xs text-white opacity-70 mb-1">{ico} {label} 확정</div>
                <div className="text-xl font-bold text-white">{cur} <span className="text-sm opacity-60">/ {cap}</span></div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {event.status === 'open' && (
              <button onClick={() => updateEventStatus('closed')}
                className="px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: '#f2e4cc', color: '#7b4f2e' }}>🔒 신청 마감</button>
            )}
            {event.status === 'closed' && <>
              <button onClick={() => updateEventStatus('open')}
                className="px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: '#e8f4e8', color: '#4a7a4a' }}>🔓 신청 재개</button>
              <button onClick={() => updateEventStatus('finished')}
                className="px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: '#c45f5f', color: 'white' }}>🏁 행사 종료</button>
            </>}
            {event.status === 'finished' && (
              <button onClick={computeMatches}
                className="px-3 py-2 rounded-xl text-xs font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #c45f8a, #e07a9a)' }}>💕 매칭 집계</button>
            )}
            <button onClick={() => navigate(`/admin/results/${id}`)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-white"
              style={{ background: '#7b4f2e' }}>💌 결과 보기</button>
          </div>
        </div>

        {/* 신청자 탭 */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {[['pending','대기'],['confirmed','확정'],['rejected','거절'],['all','전체']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium"
              style={{ background: tab===v?'#4a2c17':'#fffdf9', color: tab===v?'white':'#7b4f2e', border:`1px solid ${tab===v?'#4a2c17':'#e8d5b7'}` }}>
              {l} {v!=='all' ? apps.filter(a=>a.app_status===v).length : apps.length}
            </button>
          ))}
        </div>

        {/* 신청자 목록 */}
        <div className="space-y-3">
          {filtered.length === 0 && <div className="text-center py-10" style={{ color: '#a07850' }}><p className="text-sm">신청자가 없어요</p></div>}
          {filtered.map(a => (
            <div key={a.app_id} className="rounded-2xl overflow-hidden"
              style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.08)' }}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={a.photo} name={a.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm" style={{ color: '#4a2c17' }}>{a.name}</span>
                      <Tag color={APP_COLOR[a.app_status]}>{APP_LABEL[a.app_status]}</Tag>
                    </div>
                    <div className="text-xs" style={{ color: '#a07850' }}>
                      {a.gender==='M'?'👨':'👩'} {a.age}세 · {a.job||'직업 미입력'}
                    </div>
                  </div>
                </div>
                {a.intro && <p className="text-xs p-2.5 rounded-xl mb-3" style={{ background:'#fdf6ee', color:'#6b4226' }}>"{a.intro}"</p>}
                {a.app_status==='pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateAppStatus(a.app_id,'confirmed')} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white" style={{ background:'#6a9e6a' }}>✅ 확정</button>
                    <button onClick={() => updateAppStatus(a.app_id,'rejected')} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white" style={{ background:'#c45f5f' }}>❌ 거절</button>
                  </div>
                )}
                {a.app_status==='confirmed' && (
                  <button onClick={() => updateAppStatus(a.app_id,'rejected')} className="w-full py-2.5 rounded-xl text-xs border" style={{ borderColor:'#c45f5f', color:'#c45f5f' }}>확정 취소</button>
                )}
                {a.app_status==='rejected' && (
                  <button onClick={() => updateAppStatus(a.app_id,'confirmed')} className="w-full py-2.5 rounded-xl text-xs border" style={{ borderColor:'#6a9e6a', color:'#6a9e6a' }}>다시 확정</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 수정 모달 */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="w-full max-w-[430px] mx-auto rounded-t-3xl" style={{ background: '#fffdf9', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="px-5 pt-5 pb-3 sticky top-0 flex items-center justify-between" style={{ background: '#fffdf9', borderBottom: '1px solid #e8d5b7' }}>
              <h3 className="font-semibold" style={{ color: '#4a2c17' }}>이벤트 수정</h3>
              <button onClick={() => setShowEdit(false)} className="text-xl" style={{ color: '#a07850' }}>✕</button>
            </div>
            <div className="p-5 space-y-3">
              {[
                ['이벤트 이름 *', 'title', '이벤트 이름'],
                ['지역 *', 'region', '예: 서울, 부산'],
                ['카페 이름 *', 'cafeName', '카페명'],
                ['카페 주소', 'cafeAddress', '상세 주소 (선택)'],
              ].map(([label, key, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>{label}</label>
                  <input style={inp} placeholder={ph} value={editForm[key] || ''}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>날짜 *</label>
                  <input style={inp} type="date" value={editForm.date || ''}
                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>시간</label>
                  <input style={inp} type="time" value={editForm.time || ''}
                    onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>남성 정원</label>
                  <input style={inp} type="number" min={1} max={20} value={editForm.capacityM || ''}
                    onChange={e => setEditForm(f => ({ ...f, capacityM: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>여성 정원</label>
                  <input style={inp} type="number" min={1} max={20} value={editForm.capacityF || ''}
                    onChange={e => setEditForm(f => ({ ...f, capacityF: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>이벤트 소개</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'none' }} placeholder="이벤트 설명"
                  value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-2 pb-4">
                <button onClick={() => setShowEdit(false)}
                  className="flex-1 py-3 rounded-xl text-sm border" style={{ borderColor: '#c9956a', color: '#7b4f2e' }}>취소</button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #7b4f2e, #a0704a)' }}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminNav active="events" />
      <Toast msg={toast} />
    </div>
  );
}
