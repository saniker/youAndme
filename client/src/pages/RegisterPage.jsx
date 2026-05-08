import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store';
import { Header, Btn, Toast } from '../components/Layout';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', gender: '', age: '', job: '', intro: '', email: '', password: '', passwordConfirm: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

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
      // 1. 회원가입
      const { data } = await api.post('/auth/register', {
        name: form.name, gender: form.gender, age: form.age,
        job: form.job, intro: form.intro, email: form.email, password: form.password
      });

      // 2. 사진 업로드
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

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e8d5b7',
    background: '#fffdf9', color: '#2d1a0e', fontFamily: 'inherit', fontSize: 14, outline: 'none'
  };

  return (
    <div className="min-h-screen" style={{ background: '#fdf6ee' }}>
      <Header title="회원가입" onBack={() => navigate('/')} />

      <form onSubmit={handleSubmit} className="px-5 py-6 pb-24 space-y-1">
        {/* 프로필 사진 */}
        <div className="flex flex-col items-center mb-6">
          <label className="cursor-pointer relative">
            <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #e8d5b7, #f2e4cc)', border: '3px solid #c9956a' }}>
              {photoPreview
                ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                : <span className="text-4xl">📷</span>
              }
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-sm text-white"
              style={{ background: '#7b4f2e' }}>+</div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
          <p className="text-xs mt-2" style={{ color: '#a07850' }}>프로필 사진 (선택)</p>
        </div>

        {/* 기본 정보 */}
        <div className="rounded-2xl p-4 mb-2" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.08)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#a07850', letterSpacing: 1 }}>기본 정보</p>

          <div className="mb-3">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>이름 *</label>
            <input style={inputStyle} placeholder="이름을 입력하세요" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>성별 *</label>
            <div className="grid grid-cols-2 gap-2">
              {[['M', '👨 남성'], ['F', '👩 여성']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('gender', v)}
                  className="py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    border: `2px solid ${form.gender === v ? '#7b4f2e' : '#e8d5b7'}`,
                    background: form.gender === v ? '#f2e4cc' : '#fffdf9',
                    color: form.gender === v ? '#4a2c17' : '#a07850'
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>나이 *</label>
              <input style={inputStyle} type="number" placeholder="나이" min={18} max={50} value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>직업</label>
              <input style={inputStyle} placeholder="직업" value={form.job} onChange={e => set('job', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>자기소개</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'none' }}
              placeholder="간단한 자기소개를 작성해주세요 ☕"
              value={form.intro} onChange={e => set('intro', e.target.value)} />
          </div>
        </div>

        {/* 계정 정보 */}
        <div className="rounded-2xl p-4" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.08)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#a07850', letterSpacing: 1 }}>계정 정보</p>

          <div className="mb-3">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>이메일 *</label>
            <input style={inputStyle} type="email" placeholder="이메일 주소" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>비밀번호 *</label>
            <input style={inputStyle} type="password" placeholder="6자 이상" value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b4226' }}>비밀번호 확인 *</label>
            <input style={inputStyle} type="password" placeholder="비밀번호 재입력" value={form.passwordConfirm} onChange={e => set('passwordConfirm', e.target.value)} />
          </div>
        </div>

        <div className="pt-4">
          <Btn type="submit" disabled={loading}>
            {loading ? '가입 중...' : '✨ 가입 신청하기'}
          </Btn>
        </div>

        <p className="text-center text-xs pt-2" style={{ color: '#a07850' }}>
          이미 계정이 있으신가요?{' '}
          <button type="button" onClick={() => navigate('/login')} className="underline" style={{ color: '#7b4f2e' }}>로그인</button>
        </p>
      </form>

      <Toast msg={toast} />
    </div>
  );
}
