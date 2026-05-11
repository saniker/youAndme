import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store';
import { Toast } from '../components/Layout';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', gender: '', age: '', job: '', intro: '', email: '', password: '', passwordConfirm: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.gender || !form.age || !form.email || !form.password)
      return showToast('필수 항목을 모두 입력해주세요.');
    if (form.password !== form.passwordConfirm)
      return showToast('비밀번호가 일치하지 않습니다.');
    if (form.password.length < 6)
      return showToast('비밀번호는 6자 이상이어야 합니다.');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name, gender: form.gender, age: form.age,
        job: form.job, intro: form.intro, email: form.email, password: form.password
      });
      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        const { data: photoData } = await api.post('/upload', fd, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        await api.patch('/auth/photo', { photo: photoData.url }, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        data.user.photo = photoData.url;
      }
      setAuth({ ...data.user }, data.token);
      showToast('회원가입 완료! 운영자 승인을 기다려주세요 ☕');
      setTimeout(() => navigate('/pending'), 1500);
    } catch (err) {
      showToast(err.response?.data?.error || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 10, border: 'none',
    background: '#F2F4F6', color: '#191F28', fontFamily: 'inherit', fontSize: 14, outline: 'none'
  };

  return (
    <div className="min-h-screen" style={{ background: '#F2F4F6' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 py-3.5 flex items-center gap-3"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #F2F4F6' }}>
        <button onClick={() => navigate('/')} style={{ color: '#191F28', fontSize: 22 }}>←</button>
        <span className="font-black text-lg" style={{ color: '#191F28' }}>회원가입</span>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-3 pb-8 space-y-2">

        {/* 기본 정보 */}
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-black mb-3" style={{ color: '#191F28' }}>기본 정보</p>

          {/* 사진 + 이름 한 줄 */}
          <div className="flex items-center gap-3 mb-3">
            <label className="cursor-pointer relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: '#EBF3FF', border: '2px solid #3182F6' }}>
                {photoPreview
                  ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  : <span className="text-2xl">📷</span>}
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                style={{ background: '#3182F6' }}>+</div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            <div className="flex-1">
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#191F28' }}>이름 *</label>
              <input style={inp} placeholder="이름을 입력하세요" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
          </div>

          {/* 성별 */}
          <div className="mb-3">
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#191F28' }}>성별 *</label>
            <div className="grid grid-cols-2 gap-2">
              {[['M', '👨 남성'], ['F', '👩 여성']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('gender', v)}
                  className="py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: form.gender === v ? '#3182F6' : '#F2F4F6',
                    color: form.gender === v ? '#FFFFFF' : '#8B95A1',
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* 나이 / 직업 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#191F28' }}>나이 *</label>
              <input style={inp} type="number" placeholder="나이" min={18} max={50}
                value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#191F28' }}>직업</label>
              <input style={inp} placeholder="직업" value={form.job} onChange={e => set('job', e.target.value)} />
            </div>
          </div>

          {/* 자기소개 */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#191F28' }}>자기소개</label>
            <textarea style={{ ...inp, minHeight: 60, resize: 'none' }}
              placeholder="간단한 자기소개 ☕"
              value={form.intro} onChange={e => set('intro', e.target.value)} />
          </div>
        </div>

        {/* 계정 정보 */}
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-black mb-3" style={{ color: '#191F28' }}>계정 정보</p>

          <div className="mb-3">
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#191F28' }}>이메일 *</label>
            <input style={inp} type="email" placeholder="이메일 주소" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#191F28' }}>비밀번호 *</label>
            <input style={inp} type="password" placeholder="6자 이상" value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#191F28' }}>비밀번호 확인 *</label>
            <input style={inp} type="password" placeholder="비밀번호 재입력" value={form.passwordConfirm} onChange={e => set('passwordConfirm', e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-40"
          style={{ background: '#3182F6' }}>
          {loading ? '가입 중...' : '✨ 가입 신청하기'}
        </button>

        <p className="text-center text-sm pb-2" style={{ color: '#8B95A1' }}>
          이미 계정이 있으신가요?{' '}
          <button type="button" onClick={() => navigate('/login')} className="font-bold" style={{ color: '#3182F6' }}>
            로그인
          </button>
        </p>
      </form>

      <Toast msg={toast} />
    </div>
  );
}
