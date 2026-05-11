import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuthStore } from '../../store';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: 'admin@youandme.kr', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      if (!data.user.email.includes('admin')) throw new Error('관리자 계정이 아닙니다.');
      setAuth(data.user, data.token);
      navigate('/admin/users', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || '로그인 실패');
    } finally { setLoading(false); }
  }

  const inp = {
    width: '100%', padding: '14px 16px', borderRadius: 12, border: 'none',
    background: '#F2F4F6', color: '#191F28', fontFamily: 'inherit', fontSize: 15, outline: 'none'
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: '#191F28' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🛠</div>
          <h1 className="text-2xl font-black text-white mb-1">운영자 로그인</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>너랑나랑 운영자 전용</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-white">이메일</label>
              <input style={inp} type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-white">비밀번호</label>
              <input style={inp} type="password" placeholder="비밀번호 입력"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 mb-4 text-sm font-bold"
              style={{ background: '#FFF0F0', color: '#F04452' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 disabled:opacity-40"
            style={{ background: '#3182F6', color: '#FFFFFF' }}>
            {loading ? '로그인 중...' : '🛠 운영자 로그인'}
          </button>
        </form>

        <button onClick={() => navigate('/')} className="mt-5 w-full text-center text-sm"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          ← 일반 사용자 페이지
        </button>
      </div>
    </div>
  );
}
