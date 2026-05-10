import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getPhotoUrl } from '../api';
import { useAuthStore } from '../store';
import { Spinner, Avatar, Toast } from '../components/Layout';

const APP_STATUS = {
  pending:   { label: '검토 중', color: '#3a5a8a', bg: '#e8eef8' },
  confirmed: { label: '참가 확정 ✅', color: '#4a7a4a', bg: '#e8f4e8' },
  rejected:  { label: '미선정', color: '#9a3f3f', bg: '#fce8e8' },
};
const EVENT_STATUS = {
  open: '신청 가능', closed: '신청 마감', finished: '행사 종료'
};

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
    try {
      const { data } = await api.get('/events/my/applications');
      setApps(data);
    } catch {}
    finally { setLoading(false); }
  }

  function handleLogout() { logout(); navigate('/'); }

  // 프로필 업데이트 후 store 갱신
  async function refreshUser() {
    try {
      const { data } = await api.get('/auth/me');
      updateUser(data);
    } catch {}
  }

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #e8d5b7', background: '#fffdf9',
    color: '#2d1a0e', fontFamily: 'inherit', fontSize: 14, outline: 'none'
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#fdf6ee' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 py-4 border-b flex items-center justify-between"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        <button onClick={() => navigate('/home')} className="text-xl" style={{ color: '#7b4f2e' }}>←</button>
        <span className="font-semibold" style={{ color: '#4a2c17' }}>마이페이지</span>
        <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-full border"
          style={{ borderColor: '#c9956a', color: '#7b4f2e' }}>로그아웃</button>
      </div>

      {/* 프로필 */}
      <div className="px-5 pt-6 pb-4">
        <div className="rounded-2xl p-5 mb-5" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
          <div className="flex items-center gap-4">
            <Avatar src={user?.photo} name={user?.name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-base" style={{ color: '#4a2c17' }}>{user?.name}</div>
              <div className="text-sm" style={{ color: '#a07850' }}>
                {user?.gender === 'M' ? '👨' : '👩'} {user?.age}세 · {user?.job || '직업 미입력'}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: '#c9956a' }}>{user?.email}</div>
            </div>
            <button onClick={() => setShowEdit(true)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border"
              style={{ borderColor: '#c9956a', color: '#7b4f2e', background: '#fffdf9' }}>
              ✏️ 수정
            </button>
          </div>
          {user?.intro && (
            <p className="text-sm mt-3 p-3 rounded-xl leading-relaxed" style={{ background: '#fdf6ee', color: '#6b4226' }}>
              "{user.intro}"
            </p>
          )}
        </div>

        {/* 신청 내역 */}
        <p className="text-sm font-semibold mb-3" style={{ color: '#4a2c17' }}>내 신청 내역</p>

        {loading ? <Spinner /> : apps.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#a07850' }}>
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm">신청한 이벤트가 없어요</p>
            <button onClick={() => navigate('/events')} className="mt-3 text-xs underline" style={{ color: '#7b4f2e' }}>
              이벤트 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(app => {
              const st = APP_STATUS[app.status];
              const isFinished = app.event_status === 'finished';
              const isConfirmed = app.status === 'confirmed';
              return (
                <div key={app.id} className="rounded-2xl overflow-hidden"
                  style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.08)' }}>
                  <div className="h-1" style={{ background: st.color }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="font-semibold text-sm truncate" style={{ color: '#4a2c17' }}>{app.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#a07850' }}>
                          📅 {app.date} · 📍 {app.region} {app.cafe_name}
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                        style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div className="text-xs mb-3" style={{ color: '#c9956a' }}>
                      {EVENT_STATUS[app.event_status]} · 신청일 {new Date(app.created_at).toLocaleDateString('ko-KR')}
                    </div>
                    {isFinished && isConfirmed && (
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/events/${app.event_id}/likes`)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white"
                          style={{ background: 'linear-gradient(135deg, #c45f8a, #e07a9a)' }}>
                          💕 좋아요 입력
                        </button>
                        <button onClick={() => navigate(`/events/${app.event_id}/result`)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-medium border"
                          style={{ borderColor: '#c9956a', color: '#7b4f2e' }}>
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

      {/* 회원정보 수정 모달 */}
      {showEdit && (
        <EditProfileModal
          user={user}
          inp={inp}
          onClose={() => setShowEdit(false)}
          onSaved={async () => { await refreshUser(); showToast('✅ 정보가 수정됐습니다!'); setShowEdit(false); }}
          showToast={showToast}
        />
      )}

      {/* 하단 네비 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        {[
          { icon: '🏠', label: '홈', path: '/home' },
          { icon: '☕', label: '이벤트', path: '/events' },
          { icon: '👤', label: '마이', path: '/my', active: true },
        ].map(n => (
          <button key={n.label} onClick={() => navigate(n.path)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-all"
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

function EditProfileModal({ user, inp, onClose, onSaved, showToast }) {
  const [tab, setTab] = useState('info'); // 'info' | 'password'
  const [name, setName] = useState(user?.name || '');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function saveInfo() {
    setSaving(true);
    try {
      let photoUrl = null;

      // 사진 업로드
      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        const { data } = await api.post('/upload', fd);
        photoUrl = data.url;
        await api.patch('/auth/photo', { photo: photoUrl });
      }

      // 이름 변경
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
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)', paddingBottom: 60 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[430px] rounded-t-3xl flex flex-col" style={{ background: '#fffdf9', maxHeight: 'calc(90vh - 60px)' }}>

        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #e8d5b7' }}>
          <h3 className="font-semibold" style={{ color: '#4a2c17' }}>회원정보 수정</h3>
          <button onClick={onClose} className="text-xl" style={{ color: '#a07850' }}>✕</button>
        </div>

        {/* 탭 */}
        <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid #e8d5b7' }}>
          {[['info','기본정보'], ['password','비밀번호']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className="flex-1 py-3 text-sm font-medium relative"
              style={{ color: tab === v ? '#4a2c17' : '#a07850' }}>
              {l}
              {tab === v && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#4a2c17' }} />}
            </button>
          ))}
        </div>

        {/* 내용 */}
        <div className="overflow-y-auto flex-1 p-5">
          {tab === 'info' && (
            <div className="space-y-4">
              {/* 사진 */}
              <div className="flex flex-col items-center">
                <label className="cursor-pointer relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ border: '3px solid #c9956a', background: '#f2e4cc' }}>
                    {currentPhoto
                      ? <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                      : <span className="text-3xl">📷</span>}
                  </div>
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ background: '#7b4f2e' }}>+</div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
                <p className="text-xs mt-2" style={{ color: '#a07850' }}>사진 변경</p>
              </div>

              {/* 이름 */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>이름</label>
                <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="이름 입력" />
              </div>
            </div>
          )}

          {tab === 'password' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>현재 비밀번호</label>
                <input style={inp} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="현재 비밀번호 입력" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>새 비밀번호</label>
                <input style={inp} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="6자 이상" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>새 비밀번호 확인</label>
                <input style={inp} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="새 비밀번호 재입력" />
              </div>
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #e8d5b7' }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm border"
            style={{ borderColor: '#c9956a', color: '#7b4f2e' }}>취소</button>
          <button onClick={tab === 'info' ? saveInfo : savePassword} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #7b4f2e, #a0704a)' }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
