import { useEffect, useState } from 'react';
import api from '../../api';
import { AdminNav } from './AdminNav';
import { Spinner, Avatar, Tag, Toast } from '../../components/Layout';

const STATUS_COLOR = { pending: 'blue', approved: 'green', rejected: 'red' };
const STATUS_LABEL = { pending: '대기', approved: '승인', rejected: '거절' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [toast, setToast] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try { const { data } = await api.get('/admin/users'); setUsers(data); }
    catch {} finally { setLoading(false); }
  }

  async function updateStatus(userId, status) {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      showToast({ approved: '✅ 승인됐습니다!', rejected: '❌ 거절됐습니다.', pending: '대기로 변경됐습니다.' }[status]);
      fetchUsers();
    } catch { showToast('오류가 발생했습니다.'); }
  }

  const filtered = tab === 'all' ? users : users.filter(u => u.status === tab);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#fdf6ee' }}>
      <div className="sticky top-0 z-50 px-5 py-4 flex items-center justify-between" style={{ background: '#4a2c17' }}>
        <span className="font-semibold text-white text-lg" style={{ fontFamily: "'Playfair Display',serif" }}>회원 관리</span>
        <span className="text-xs text-white opacity-60">{users.length}명</span>
      </div>

      {/* 탭 */}
      <div className="px-4 pt-4 flex gap-2 overflow-x-auto pb-1">
        {[['pending','대기'], ['approved','승인'], ['rejected','거절'], ['all','전체']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium"
            style={{ background: tab===v?'#4a2c17':'#fffdf9', color: tab===v?'white':'#7b4f2e', border:`1px solid ${tab===v?'#4a2c17':'#e8d5b7'}` }}>
            {l} {v !== 'all' ? users.filter(u => u.status === v).length : users.length}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="px-4 pt-3 space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-10" style={{ color: '#a07850' }}>
              <p className="text-sm">해당하는 회원이 없어요</p>
            </div>
          )}
          {filtered.map(u => (
            <div key={u.id} className="rounded-2xl overflow-hidden"
              style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.08)' }}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={u.photo} name={u.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm" style={{ color: '#4a2c17' }}>{u.name}</span>
                      <Tag color={STATUS_COLOR[u.status]}>{STATUS_LABEL[u.status]}</Tag>
                    </div>
                    <div className="text-xs" style={{ color: '#a07850' }}>
                      {u.gender === 'M' ? '👨' : '👩'} {u.age}세 · {u.job || '직업 미입력'}
                    </div>
                    <div className="text-xs truncate" style={{ color: '#c9956a' }}>{u.email}</div>
                  </div>
                  <div className="text-xs text-right" style={{ color: '#a07850' }}>
                    {new Date(u.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                {u.intro && (
                  <p className="text-xs p-2.5 rounded-xl mb-3" style={{ background: '#fdf6ee', color: '#6b4226' }}>
                    "{u.intro}"
                  </p>
                )}
                {u.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(u.id, 'approved')}
                      className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white"
                      style={{ background: '#6a9e6a' }}>✅ 승인</button>
                    <button onClick={() => updateStatus(u.id, 'rejected')}
                      className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white"
                      style={{ background: '#c45f5f' }}>❌ 거절</button>
                  </div>
                )}
                {u.status === 'approved' && (
                  <button onClick={() => updateStatus(u.id, 'rejected')}
                    className="w-full py-2.5 rounded-xl text-xs border"
                    style={{ borderColor: '#c45f5f', color: '#c45f5f' }}>승인 취소</button>
                )}
                {u.status === 'rejected' && (
                  <button onClick={() => updateStatus(u.id, 'approved')}
                    className="w-full py-2.5 rounded-xl text-xs border"
                    style={{ borderColor: '#6a9e6a', color: '#6a9e6a' }}>다시 승인</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminNav active="users" />
      <Toast msg={toast} />
    </div>
  );
}
