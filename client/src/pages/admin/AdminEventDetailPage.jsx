import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { AdminNav } from './AdminNav';
import { Spinner, Toast, Avatar } from '../../components/Layout';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '제주'];

const inp = {
  width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none',
  background: '#F2F4F6', color: '#191F28', fontFamily: 'inherit', fontSize: 14, outline: 'none'
};

const APP_STYLE = {
  pending:   { label: '검토 중', color: '#3182F6', bg: '#EBF3FF' },
  confirmed: { label: '확정',   color: '#00C853', bg: '#E6FAF0' },
  rejected:  { label: '거절',   color: '#F04452', bg: '#FFF0F0' },
};

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
    } catch (err) { showToast(err.response?.data?.error || '삭제 실패'); }
  }

  async function updateAppStatus(appId, status) {
    try {
      await api.patch(`/admin/applications/${appId}`, { status });
      showToast({ confirmed: '✅ 확정', rejected: '❌ 거절', pending: '대기로 변경' }[status]);
      fetchEvent();
    } catch { showToast('오류 발생'); }
  }

  async function updateEventStatus(status) {
    const msg = {
      closed: '신청을 마감하시겠습니까?',
      open: '신청을 다시 열겠습니까?',
      finished: '행사를 종료하시겠습니까?\n참가자들에게 좋아요 입력 알림이 발송됩니다.'
    };
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

  if (loading || !event) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F4F6' }}>
      <Spinner />
    </div>
  );

  const apps = event.applications || [];
  const filtered = tab === 'all' ? apps : apps.filter(a => a.app_status === tab);
  const confirmedM = apps.filter(a => a.gender === 'M' && a.app_status === 'confirmed').length;
  const confirmedF = apps.filter(a => a.gender === 'F' && a.app_status === 'confirmed').length;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F2F4F6' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 py-4 flex items-center gap-3"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #F2F4F6' }}>
        <button onClick={() => navigate('/admin/events')} style={{ color: '#191F28', fontSize: 22 }}>←</button>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm truncate" style={{ color: '#191F28' }}>{event.title}</div>
          <div className="text-xs" style={{ color: '#8B95A1' }}>{event.date} · {event.cafe_name}</div>
        </div>
        <button onClick={() => setShowEdit(true)}
          className="text-xs px-3 py-1.5 rounded-full font-bold"
          style={{ background: '#EBF3FF', color: '#3182F6' }}>✏️ 수정</button>
        <button onClick={handleDelete}
          className="text-xs px-3 py-1.5 rounded-full font-bold"
          style={{ background: '#FFF0F0', color: '#F04452' }}>🗑 삭제</button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* 참가 현황 카드 */}
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-black mb-3" style={{ color: '#191F28' }}>참가 현황</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[['👨', '남성', confirmedM, event.capacity_m], ['👩', '여성', confirmedF, event.capacity_f]].map(([ico, label, cur, cap]) => (
              <div key={label} className="rounded-xl p-3" style={{ background: '#F2F4F6' }}>
                <div className="text-xs font-semibold mb-1" style={{ color: '#8B95A1' }}>{ico} {label} 확정</div>
                <div className="text-xl font-black" style={{ color: cur >= cap ? '#F04452' : '#191F28' }}>
                  {cur} <span className="text-sm font-medium" style={{ color: '#8B95A1' }}>/ {cap}</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: '#E5E8EB' }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${Math.min(100, cur / cap * 100)}%`, background: cur >= cap ? '#F04452' : '#3182F6' }} />
                </div>
              </div>
            ))}
          </div>

          {/* 상태 변경 버튼들 */}
          <div className="flex gap-2 flex-wrap">
            {event.status === 'open' && (
              <button onClick={() => updateEventStatus('closed')}
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: '#F2F4F6', color: '#4A4F5C' }}>🔒 신청 마감</button>
            )}
            {event.status === 'closed' && <>
              <button onClick={() => updateEventStatus('open')}
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: '#E6FAF0', color: '#00C853' }}>🔓 신청 재개</button>
              <button onClick={() => updateEventStatus('finished')}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: '#F04452' }}>🏁 행사 종료</button>
            </>}
            {event.status === 'finished' && (
              <button onClick={computeMatches}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: '#3182F6' }}>💕 매칭 집계</button>
            )}
            <button onClick={() => navigate(`/admin/results/${id}`)}
              className="px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#EBF3FF', color: '#3182F6' }}>💌 결과 보기</button>
          </div>
        </div>

        {/* 신청자 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[['pending','대기'],['confirmed','확정'],['rejected','거절'],['all','전체']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: tab === v ? '#191F28' : '#FFFFFF',
                color: tab === v ? 'white' : '#4A4F5C',
                border: `1px solid ${tab === v ? '#191F28' : '#E5E8EB'}`
              }}>
              {l} {v !== 'all' ? apps.filter(a => a.app_status === v).length : apps.length}
            </button>
          ))}
        </div>

        {/* 신청자 목록 */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm font-semibold" style={{ color: '#191F28' }}>신청자가 없어요</p>
            </div>
          )}
          {filtered.map(a => {
            const appSt = APP_STYLE[a.app_status] || APP_STYLE.pending;
            return (
              <div key={a.app_id} className="rounded-2xl overflow-hidden"
                style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar src={a.photo} name={a.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-sm" style={{ color: '#191F28' }}>{a.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: appSt.bg, color: appSt.color }}>{appSt.label}</span>
                      </div>
                      <div className="text-xs" style={{ color: '#8B95A1' }}>
                        {a.gender === 'M' ? '👨' : '👩'} {a.age}세 · {a.job || '직업 미입력'}
                      </div>
                    </div>
                  </div>
                  {a.intro && (
                    <p className="text-xs p-2.5 rounded-xl mb-3" style={{ background: '#F2F4F6', color: '#4A4F5C' }}>
                      "{a.intro}"
                    </p>
                  )}
                  {a.app_status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateAppStatus(a.app_id, 'confirmed')}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                        style={{ background: '#00C853' }}>✅ 확정</button>
                      <button onClick={() => updateAppStatus(a.app_id, 'rejected')}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                        style={{ background: '#F04452' }}>❌ 거절</button>
                    </div>
                  )}
                  {a.app_status === 'confirmed' && (
                    <button onClick={() => updateAppStatus(a.app_id, 'rejected')}
                      className="w-full py-2.5 rounded-xl text-xs font-bold border"
                      style={{ borderColor: '#F04452', color: '#F04452' }}>확정 취소</button>
                  )}
                  {a.app_status === 'rejected' && (
                    <button onClick={() => updateAppStatus(a.app_id, 'confirmed')}
                      className="w-full py-2.5 rounded-xl text-xs font-bold border"
                      style={{ borderColor: '#00C853', color: '#00C853' }}>다시 확정</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 수정 모달 */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', paddingBottom: 60 }}
          onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col"
            style={{ background: '#FFFFFF', maxHeight: 'calc(90vh - 60px)' }}>
            <div className="px-5 pt-5 pb-3 flex-shrink-0 flex items-center justify-between"
              style={{ borderBottom: '1px solid #F2F4F6' }}>
              <h3 className="font-black" style={{ color: '#191F28' }}>이벤트 수정</h3>
              <button onClick={() => setShowEdit(false)} className="text-xl" style={{ color: '#8B95A1' }}>✕</button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {[
                ['이벤트 이름 *', 'title', '이벤트 이름'],
                ['카페 이름 *', 'cafeName', '카페명'],
                ['카페 주소', 'cafeAddress', '상세 주소 (선택)'],
              ].map(([label, key, ph]) => (
                <div key={key}>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>{label}</label>
                  <input style={inp} placeholder={ph} value={editForm[key] || ''}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>지역 *</label>
                <select style={inp} value={editForm.region || ''} onChange={e => setEditForm(f => ({ ...f, region: e.target.value }))}>
                  <option value="">지역 선택</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>날짜 *</label>
                  <input style={inp} type="date" value={editForm.date || ''}
                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>시간</label>
                  <input style={inp} type="time" value={editForm.time || ''}
                    onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>남성 정원</label>
                  <input style={inp} type="number" min={1} max={20} value={editForm.capacityM || ''}
                    onChange={e => setEditForm(f => ({ ...f, capacityM: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>여성 정원</label>
                  <input style={inp} type="number" min={1} max={20} value={editForm.capacityF || ''}
                    onChange={e => setEditForm(f => ({ ...f, capacityF: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>이벤트 소개</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'none' }} placeholder="이벤트 설명"
                  value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #F2F4F6' }}>
              <button onClick={() => setShowEdit(false)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: '#F2F4F6', color: '#8B95A1' }}>취소</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#3182F6' }}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminNav active="events" />
      <Toast msg={toast} />
    </div>
  );
}
