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

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #e8d5b7',
    background: '#fffdf9', color: '#2d1a0e', fontFamily: 'inherit', fontSize: 15, outline: 'none'
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(180deg, #4a2c17 0%, #7b4f2e 100%)' }}>
      <div className="text-5xl mb-4">🛠</div>
      <h1 className="text-2xl font-semibold text-white mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>운영자 로그인</h1>
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>너랑나랑 운영자 전용</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2 text-white">이메일</label>
            <input style={inputStyle} type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2 text-white">비밀번호</label>
            <input style={inputStyle} type="password" placeholder="비밀번호 입력"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: '#fce8e8', color: '#9a3f3f' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-2xl font-medium text-sm transition-all active:scale-95"
          style={{ background: '#fffdf9', color: '#4a2c17' }}>
          {loading ? '로그인 중...' : '🛠 운영자 로그인'}
        </button>
      </form>

      <button onClick={() => navigate('/')} className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
        ← 일반 사용자 페이지
      </button>
    </div>
  );
}
