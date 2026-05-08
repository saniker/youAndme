import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store';
import { Header, Btn, Toast } from '../components/Layout';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) return showToast('이메일과 비밀번호를 입력해주세요.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.token);
      if (data.user.email === 'admin@youandme.kr') {
        navigate('/admin', { replace: true });
      } else if (data.user.status === 'pending') {
        navigate('/pending', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      showToast(err.response?.data?.error || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #e8d5b7',
    background: '#fffdf9', color: '#2d1a0e', fontFamily: 'inherit', fontSize: 15, outline: 'none'
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fdf6ee' }}>
      <Header title="로그인" onBack={() => navigate('/')} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-5xl mb-4">☕</div>
        <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#4a2c17' }}>
          반갑습니다
        </h2>
        <p className="text-sm mb-10" style={{ color: '#a07850' }}>너랑나랑에 오신 걸 환영해요</p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="rounded-2xl p-5 mb-4" style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2" style={{ color: '#6b4226' }}>이메일</label>
              <input style={inputStyle} type="email" placeholder="이메일 주소 입력"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#6b4226' }}>비밀번호</label>
              <input style={inputStyle} type="password" placeholder="비밀번호 입력"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>

          <Btn type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '☕ 로그인'}
          </Btn>

          <p className="text-center text-xs mt-4" style={{ color: '#a07850' }}>
            계정이 없으신가요?{' '}
            <button type="button" onClick={() => navigate('/register')} className="underline" style={{ color: '#7b4f2e' }}>
              회원가입
            </button>
          </p>
        </form>
      </div>

      <Toast msg={toast} />
    </div>
  );
}
