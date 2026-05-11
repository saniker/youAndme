import { useEffect, useState } from 'react';
import api from '../../api';
import { AdminNav } from './AdminNav';
import { Spinner, Avatar, Toast } from '../../components/Layout';

const STATUS_LABEL = { pending: '대기', approved: '승인', rejected: '거절' };
const STATUS_STYLE = {
  pending:  { color: '#3182F6', bg: '#EBF3FF' },
  approved: { color: '#00C853', bg: '#E6FAF0' },
  rejected: { color: '#F04452', bg: '#FFF0F0' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState('approval');
  const [approvalTab, setApprovalTab] = useState('pending');
  const [genderTab, setGenderTab] = useState('all');
  const [toast, setToast] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
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

  async function deleteUser(userId, userName) {
    if (!window.confirm(`"${userName}" 회원을 삭제하시겠습니까?\n삭제 후 복구가 불가능합니다.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      showToast('🗑 회원이 삭제됐습니다.');
      fetchUsers();
    } catch { showToast('삭제에 실패했습니다.'); }
  }

  const approvalList = users.filter(u => u.status === approvalTab);
  const memberList = users.filter(u =>
    u.status === 'approved' && (genderTab === 'all' || u.gender === genderTab)
  );
  const maleCount = users.filter(u => u.status === 'approved' && u.gender === 'M').length;
  const femaleCount = users.filter(u => u.status === 'approved' && u.gender === 'F').length;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F2F4F6' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 py-4 flex items-center justify-between"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #F2F4F6' }}>
        <span className="font-black text-lg" style={{ color: '#191F28' }}>회원 관리</span>
        <span className="text-sm font-semibold" style={{ color: '#8B95A1' }}>전체 {users.length}명</span>
      </div>

      {/* 메인 탭 */}
      <div className="flex" style={{ background: '#FFFFFF', borderBottom: '1px solid #F2F4F6' }}>
        {[
          { v: 'approval', l: '신청승인관리', count: users.filter(u => u.status === 'pending').length },
          { v: 'members',  l: '전체 회원관리', count: users.filter(u => u.status === 'approved').length },
        ].map(({ v, l, count }) => (
          <button key={v} onClick={() => setMainTab(v)}
            className="flex-1 py-3.5 text-sm font-bold relative"
            style={{ color: mainTab === v ? '#3182F6' : '#8B95A1' }}>
            {l}
            {count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: mainTab === v ? '#3182F6' : '#F2F4F6',
                  color: mainTab === v ? 'white' : '#8B95A1'
                }}>
                {count}
              </span>
            )}
            {mainTab === v && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#3182F6' }} />}
          </button>
        ))}
      </div>

      {/* ── 신청승인관리 ── */}
      {mainTab === 'approval' && (
        <>
          <div className="flex px-4 pt-3 pb-1 gap-2">
            {[
              { v: 'pending',  l: '신청대기', color: '#3182F6', bg: '#EBF3FF' },
              { v: 'approved', l: '승인완료', color: '#00C853', bg: '#E6FAF0' },
              { v: 'rejected', l: '거절',     color: '#F04452', bg: '#FFF0F0' },
            ].map(({ v, l, color, bg }) => (
              <button key={v} onClick={() => setApprovalTab(v)}
                className="flex-1 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: approvalTab === v ? color : bg,
                  color: approvalTab === v ? 'white' : color,
                  minHeight: 48,
                }}>
                {l} {users.filter(u => u.status === v).length}
              </button>
            ))}
          </div>

          {loading ? <Spinner /> : (
            <div className="px-4 pt-2 space-y-3 pb-4">
              {approvalList.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-2">
                    {approvalTab === 'pending' ? '📭' : approvalTab === 'approved' ? '✅' : '❌'}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#191F28' }}>
                    {approvalTab === 'pending' ? '대기 중인 신청이 없어요' :
                     approvalTab === 'approved' ? '승인된 회원이 없어요' : '거절된 회원이 없어요'}
                  </p>
                </div>
              )}
              {approvalList.map(u => (
                <UserCard key={u.id} u={u} onUpdate={updateStatus} onDelete={deleteUser} showActions />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── 전체 회원관리 ── */}
      {mainTab === 'members' && (
        <>
          <div className="flex px-4 pt-3 pb-1 gap-2">
            {[
              { v: 'all', l: `전체 ${users.filter(u => u.status === 'approved').length}명` },
              { v: 'M',   l: `👨 남성 ${maleCount}명` },
              { v: 'F',   l: `👩 여성 ${femaleCount}명` },
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setGenderTab(v)}
                className="flex-1 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: genderTab === v ? '#191F28' : '#FFFFFF',
                  color: genderTab === v ? 'white' : '#4A4F5C',
                  border: `1px solid ${genderTab === v ? '#191F28' : '#E5E8EB'}`,
                  minHeight: 48,
                }}>
                {l}
              </button>
            ))}
          </div>

          {loading ? <Spinner /> : (
            <div className="px-4 pt-2 space-y-3 pb-4">
              {memberList.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-sm font-semibold" style={{ color: '#191F28' }}>해당하는 회원이 없어요</p>
                </div>
              )}
              {memberList.map(u => (
                <UserCard key={u.id} u={u} onUpdate={updateStatus} onDelete={deleteUser} />
              ))}
            </div>
          )}
        </>
      )}

      <AdminNav active="users" />
      <Toast msg={toast} />
    </div>
  );
}

function UserCard({ u, onUpdate, onDelete, showActions }) {
  const st = STATUS_STYLE[u.status] || STATUS_STYLE.pending;
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="h-1" style={{ background: u.gender === 'M' ? '#3182F6' : '#F04452' }} />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={u.photo} name={u.name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-black text-sm" style={{ color: '#191F28' }}>{u.name}</span>
              <span className="text-xs">{u.gender === 'M' ? '👨 남' : '👩 여'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: st.bg, color: st.color }}>{STATUS_LABEL[u.status]}</span>
            </div>
            <div className="text-xs" style={{ color: '#8B95A1' }}>
              {u.age}세 · {u.job || '직업 미입력'}
            </div>
            <div className="text-xs truncate" style={{ color: '#8B95A1' }}>{u.email}</div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="text-xs" style={{ color: '#8B95A1' }}>
              {new Date(u.created_at).toLocaleDateString('ko-KR')}
            </div>
            <button onClick={() => onDelete(u.id, u.name)}
              className="text-xs px-2.5 py-1 rounded-lg font-bold"
              style={{ background: '#FFF0F0', color: '#F04452' }}>
              🗑 삭제
            </button>
          </div>
        </div>

        {u.intro && (
          <p className="text-xs p-2.5 rounded-xl mb-3" style={{ background: '#F2F4F6', color: '#4A4F5C' }}>
            "{u.intro}"
          </p>
        )}

        {showActions && (
          <>
            {u.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => onUpdate(u.id, 'approved')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                  style={{ background: '#00C853' }}>✅ 승인</button>
                <button onClick={() => onUpdate(u.id, 'rejected')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                  style={{ background: '#F04452' }}>❌ 거절</button>
              </div>
            )}
            {u.status === 'approved' && (
              <button onClick={() => onUpdate(u.id, 'rejected')}
                className="w-full py-2.5 rounded-xl text-xs font-bold border"
                style={{ borderColor: '#F04452', color: '#F04452' }}>승인 취소</button>
            )}
            {u.status === 'rejected' && (
              <button onClick={() => onUpdate(u.id, 'approved')}
                className="w-full py-2.5 rounded-xl text-xs font-bold border"
                style={{ borderColor: '#00C853', color: '#00C853' }}>다시 승인</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
