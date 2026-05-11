import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store';
import { Header, Toast } from '../components/Layout';

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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
      <Header title="로그인" onBack={() => navigate('/')} />

      <div className="flex-1 px-6 pt-8 pb-24">
        <h2 className="text-2xl font-black mb-1" style={{ color: '#191F28' }}>반갑습니다</h2>
        <p className="text-sm mb-8" style={{ color: '#8B95A1' }}>너랑나랑에 오신 걸 환영해요</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>이메일</label>
            <input
              type="email" placeholder="이메일 주소 입력"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-4 rounded-2xl text-sm outline-none transition-all"
              style={{ background: '#F2F4F6', color: '#191F28', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>비밀번호</label>
            <input
              type="password" placeholder="비밀번호 입력"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-4 rounded-2xl text-sm outline-none transition-all"
              style={{ background: '#F2F4F6', color: '#191F28', fontFamily: 'inherit' }}
            />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#3182F6' }}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <p className="text-center text-sm" style={{ color: '#8B95A1' }}>
            계정이 없으신가요?{' '}
            <button type="button" onClick={() => navigate('/register')} className="font-bold" style={{ color: '#3182F6' }}>
              회원가입
            </button>
          </p>
        </form>
      </div>

      <Toast msg={toast} />
    </div>
  );
}
