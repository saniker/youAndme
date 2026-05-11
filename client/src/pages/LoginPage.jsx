import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store';
import { Toast } from '../components/Layout';

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
      if (data.user.email === 'admin@youandme.kr') navigate('/admin', { replace: true });
      else if (data.user.status === 'pending') navigate('/pending', { replace: true });
      else navigate('/home', { replace: true });
    } catch (err) {
      showToast(err.response?.data?.error || '로그인에 실패했습니다.');
    } finally { setLoading(false); }
  }

  const inp = {
    width: '100%', padding: '14px 16px', borderRadius: 12, border: 'none',
    background: '#F2F4F6', color: '#191F28', fontFamily: 'inherit', fontSize: 15, outline: 'none'
  };

  return (
    <div className="flex flex-col items-center justify-center px-5"
      style={{ height: '100dvh', background: '#191F28' }}>
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">☕</div>
          <h1 className="text-2xl font-black text-white mb-1">너랑나랑</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>반갑습니다, 로그인해주세요</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 입력 카드 */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-white">이메일</label>
              <input style={inp} type="email" placeholder="이메일 주소 입력"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-white">비밀번호</label>
              <input style={inp} type="password" placeholder="비밀번호 입력"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: '#3182F6' }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          계정이 없으신가요?{' '}
          <button type="button" onClick={() => navigate('/register')}
            className="font-bold" style={{ color: '#3182F6' }}>
            회원가입
          </button>
        </p>

        <button onClick={() => navigate('/')} className="mt-4 w-full text-center text-xs"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          ← 처음으로
        </button>
      </div>

      <Toast msg={toast} />
    </div>
  );
}
