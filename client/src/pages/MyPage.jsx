import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getPhotoUrl } from '../api';
import { useAuthStore } from '../store';
import { Spinner, Avatar, Toast, BottomNav } from '../components/Layout';

const APP_STATUS = {
  pending:   { label: '검토 중', color: '#3182F6', bg: '#EBF3FF' },
  confirmed: { label: '참가 확정', color: '#00C853', bg: '#E6FAF0' },
  rejected:  { label: '미선정', color: '#F04452', bg: '#FFF0F0' },
};
const EVENT_STATUS = { open: '신청 가능', closed: '신청 마감', finished: '행사 종료' };

export default function MyPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }
  useEffect(() => { fetchApps(); }, []);

  async function fetchApps() {
    try { const { data } = await api.get('/events/my/applications'); setApps(data); }
    catch {} finally { setLoading(false); }
  }

  async function refreshUser() {
    try { const { data } = await api.get('/auth/me'); updateUser(data); } catch {}
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F2F4F6' }}>
      {/* 헤더 */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#FFFFFF' }}>
        <p className="text-xl font-black" style={{ color: '#191F28' }}>마이</p>
        <button onClick={() => { logout(); navigate('/'); }}
          className="text-xs font-bold px-3 py-1.5 rounded-xl"
          style={{ background: '#F2F4F6', color: '#8B95A1' }}>로그아웃</button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* 프로필 카드 */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-4">
            <Avatar src={user?.photo} name={user?.name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-base font-black" style={{ color: '#191F28' }}>{user?.name}</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: '#8B95A1' }}>
                {user?.gender === 'M' ? '👨' : '👩'} {user?.age}세 · {user?.job || '직업 미입력'}
              </p>
              <p className="text-xs mt-0.5 truncate" style={{ color: '#8B95A1' }}>{user?.email}</p>
            </div>
            <button onClick={() => setShowEdit(true)}
              className="flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl"
              style={{ background: '#EBF3FF', color: '#3182F6' }}>수정</button>
          </div>
          {user?.intro && (
            <p className="text-sm mt-4 p-3 rounded-xl leading-relaxed" style={{ background: '#F2F4F6', color: '#4A4F5C' }}>
              "{user.intro}"
            </p>
          )}
        </div>

        {/* 신청 내역 */}
        <p className="text-sm font-black px-1 pt-1" style={{ color: '#191F28' }}>내 신청 내역</p>

        {loading ? <Spinner /> : apps.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: '#FFFFFF' }}>
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-semibold" style={{ color: '#191F28' }}>신청한 이벤트가 없어요</p>
            <button onClick={() => navigate('/events')} className="mt-3 text-xs font-bold" style={{ color: '#3182F6' }}>
              이벤트 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {apps.map(app => {
              const st = APP_STATUS[app.status];
              const isFinished = app.event_status === 'finished';
              const isConfirmed = app.status === 'confirmed';
              return (
                <div key={app.id} className="rounded-2xl overflow-hidden"
                  style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div className="h-1 w-full" style={{ background: st.color }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-bold text-sm truncate" style={{ color: '#191F28' }}>{app.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#8B95A1' }}>
                          📅 {app.date} · 📍 {app.region} {app.cafe_name}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-bold flex-shrink-0"
                        style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: '#8B95A1' }}>
                      {EVENT_STATUS[app.event_status]} · 신청일 {new Date(app.created_at).toLocaleDateString('ko-KR')}
                    </p>
                    {isFinished && isConfirmed && (
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/events/${app.event_id}/likes`)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                          style={{ background: '#3182F6' }}>
                          💕 좋아요 입력
                        </button>
                        <button onClick={() => navigate(`/events/${app.event_id}/result`)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                          style={{ background: '#F2F4F6', color: '#191F28' }}>
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

      {showEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSaved={async () => { await refreshUser(); showToast('✅ 정보가 수정됐습니다!'); setShowEdit(false); }}
          showToast={showToast}
        />
      )}

      <BottomNav active="마이" navigate={navigate} />
      <Toast msg={toast} />
    </div>
  );
}

function EditProfileModal({ user, onClose, onSaved, showToast }) {
  const [tab, setTab] = useState('info');
  const [name, setName] = useState(user?.name || '');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const inp = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: 'none', background: '#F2F4F6',
    color: '#191F28', fontFamily: 'inherit', fontSize: 14, outline: 'none'
  };

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function saveInfo() {
    setSaving(true);
    try {
      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        const { data } = await api.post('/upload', fd);
        await api.patch('/auth/photo', { photo: data.url });
      }
      if (name.trim() !== user?.name) {
        await api.patch('/auth/profile', { name });
      }
      if (!photo && name.trim() === user?.name) {
        showToast('변경된 내용이 없어요.');
        return;
      }
      await onSaved();
    } catch (err) {
      console.error('saveInfo error:', err.response?.status, err.response?.data, err.message);
      showToast(err.response?.data?.error || err.message || '수정에 실패했습니다.');
    } finally { setSaving(false); }
  }

  async function savePassword() {
    if (!currentPw || !newPw || !confirmPw) return showToast('모든 항목을 입력해주세요.');
    if (newPw !== confirmPw) return showToast('새 비밀번호가 일치하지 않습니다.');
    if (newPw.length < 6) return showToast('새 비밀번호는 6자 이상이어야 합니다.');
    setSaving(true);
    try {
      await api.patch('/auth/password', { currentPassword: currentPw, newPassword: newPw });
      showToast('✅ 비밀번호가 변경됐습니다!');
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || '비밀번호 변경에 실패했습니다.');
    } finally { setSaving(false); }
  }

  const currentPhoto = photoPreview || getPhotoUrl(user?.photo);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', paddingBottom: 60 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
        style={{ background: '#FFFFFF', maxHeight: 'calc(90vh - 60px)' }}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid #F2F4F6' }}>
          <p className="font-black text-base" style={{ color: '#191F28' }}>회원정보 수정</p>
          <button onClick={onClose} className="text-xl" style={{ color: '#8B95A1' }}>✕</button>
        </div>

        <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid #F2F4F6' }}>
          {[['info', '기본정보'], ['password', '비밀번호']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className="flex-1 py-3 text-sm font-bold relative"
              style={{ color: tab === v ? '#3182F6' : '#8B95A1' }}>
              {l}
              {tab === v && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#3182F6' }} />}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <label className="cursor-pointer relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background: '#EBF3FF', border: '3px solid #3182F6' }}>
                    {currentPhoto
                      ? <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                      : <span className="text-3xl">📷</span>}
                  </div>
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ background: '#3182F6' }}>+</div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
                <p className="text-xs mt-2 font-medium" style={{ color: '#8B95A1' }}>사진 변경</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>이름</label>
                <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="이름 입력" />
              </div>
            </div>
          )}
          {tab === 'password' && (
            <div className="space-y-4">
              {[
                ['현재 비밀번호', currentPw, setCurrentPw, '현재 비밀번호 입력'],
                ['새 비밀번호', newPw, setNewPw, '6자 이상'],
                ['새 비밀번호 확인', confirmPw, setConfirmPw, '새 비밀번호 재입력'],
              ].map(([label, val, setter, ph]) => (
                <div key={label}>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>{label}</label>
                  <input style={inp} type="password" value={val} onChange={e => setter(e.target.value)} placeholder={ph} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #F2F4F6' }}>
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
            style={{ background: '#F2F4F6', color: '#8B95A1' }}>취소</button>
          <button onClick={tab === 'info' ? saveInfo : savePassword} disabled={saving}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: '#3182F6' }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
