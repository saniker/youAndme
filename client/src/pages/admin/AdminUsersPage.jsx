import { useEffect, useState } from 'react';
import api from '../../api';
import { AdminNav } from './AdminNav';
import { Spinner, Avatar, Tag, Toast } from '../../components/Layout';

const STATUS_COLOR = { pending: 'blue', approved: 'green', rejected: 'red' };
const STATUS_LABEL = { pending: '대기', approved: '승인', rejected: '거절' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState('approval'); // 'approval' | 'members'
  const [approvalTab, setApprovalTab] = useState('pending'); // 'pending' | 'approved' | 'rejected'
  const [genderTab, setGenderTab] = useState('all'); // 'all' | 'M' | 'F'
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

  // 신청승인관리 필터
  const approvalList = users.filter(u => u.status === approvalTab);

  // 전체 회원관리 필터 (승인된 회원만)
  const memberList = users.filter(u =>
    u.status === 'approved' && (genderTab === 'all' || u.gender === genderTab)
  );

  const maleCount = users.filter(u => u.status === 'approved' && u.gender === 'M').length;
  const femaleCount = users.filter(u => u.status === 'approved' && u.gender === 'F').length;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#fdf6ee' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 py-4 flex items-center justify-between" style={{ background: '#4a2c17' }}>
        <span className="font-semibold text-white text-lg" style={{ fontFamily: "'Playfair Display',serif" }}>회원 관리</span>
        <span className="text-xs text-white opacity-60">전체 {users.length}명</span>
      </div>

      {/* 메인 탭 */}
      <div className="flex border-b" style={{ background: '#fffdf9', borderColor: '#e8d5b7' }}>
        {[
          { v: 'approval', l: '신청승인관리', count: users.filter(u => u.status === 'pending').length },
          { v: 'members',  l: '전체 회원관리', count: users.filter(u => u.status === 'approved').length },
        ].map(({ v, l, count }) => (
          <button key={v} onClick={() => setMainTab(v)}
            className="flex-1 py-3.5 text-sm font-semibold relative"
            style={{ color: mainTab === v ? '#4a2c17' : '#a07850' }}>
            {l}
            {count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                style={{ background: mainTab === v ? '#4a2c17' : '#e8d5b7', color: mainTab === v ? 'white' : '#7b4f2e' }}>
                {count}
              </span>
            )}
            {mainTab === v && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#4a2c17' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── 신청승인관리 ── */}
      {mainTab === 'approval' && (
        <>
          {/* 서브 탭 */}
          <div className="flex px-4 pt-3 pb-1 gap-2">
            {[
              { v: 'pending',  l: '신청대기', color: '#3a5a8a', bg: '#e8eef8' },
              { v: 'approved', l: '승인완료', color: '#4a7a4a', bg: '#e8f4e8' },
              { v: 'rejected', l: '거절',     color: '#9a3f3f', bg: '#fce8e8' },
            ].map(({ v, l, color, bg }) => (
              <button key={v} onClick={() => setApprovalTab(v)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: approvalTab === v ? color : bg,
                  color: approvalTab === v ? 'white' : color,
                }}>
                {l} {users.filter(u => u.status === v).length}
              </button>
            ))}
          </div>

          {loading ? <Spinner /> : (
            <div className="px-4 pt-2 space-y-3">
              {approvalList.length === 0 && (
                <div className="text-center py-12" style={{ color: '#a07850' }}>
                  <div className="text-4xl mb-2">
                    {approvalTab === 'pending' ? '📭' : approvalTab === 'approved' ? '✅' : '❌'}
                  </div>
                  <p className="text-sm">
                    {approvalTab === 'pending' ? '대기 중인 신청이 없어요' :
                     approvalTab === 'approved' ? '승인된 회원이 없어요' : '거절된 회원이 없어요'}
                  </p>
                </div>
              )}
              {approvalList.map(u => (
                <UserCard key={u.id} u={u} onUpdate={updateStatus} showActions />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── 전체 회원관리 ── */}
      {mainTab === 'members' && (
        <>
          {/* 성별 필터 */}
          <div className="flex px-4 pt-3 pb-1 gap-2">
            {[
              { v: 'all', l: `전체 ${users.filter(u=>u.status==='approved').length}명` },
              { v: 'M',   l: `👨 남성 ${maleCount}명` },
              { v: 'F',   l: `👩 여성 ${femaleCount}명` },
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setGenderTab(v)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: genderTab === v ? '#4a2c17' : '#fffdf9',
                  color: genderTab === v ? 'white' : '#7b4f2e',
                  border: `1px solid ${genderTab === v ? '#4a2c17' : '#e8d5b7'}`,
                }}>
                {l}
              </button>
            ))}
          </div>

          {loading ? <Spinner /> : (
            <div className="px-4 pt-2 space-y-3">
              {memberList.length === 0 && (
                <div className="text-center py-12" style={{ color: '#a07850' }}>
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-sm">해당하는 회원이 없어요</p>
                </div>
              )}
              {memberList.map(u => (
                <UserCard key={u.id} u={u} onUpdate={updateStatus} />
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

function UserCard({ u, onUpdate, showActions }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.08)' }}>
      <div className="h-1" style={{ background: u.gender === 'M' ? '#7b9ec9' : '#c97b9e' }} />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={u.photo} name={u.name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm" style={{ color: '#4a2c17' }}>{u.name}</span>
              <span className="text-xs">{u.gender === 'M' ? '👨 남' : '👩 여'}</span>
              <Tag color={STATUS_COLOR[u.status]}>{STATUS_LABEL[u.status]}</Tag>
            </div>
            <div className="text-xs" style={{ color: '#a07850' }}>
              {u.age}세 · {u.job || '직업 미입력'}
            </div>
            <div className="text-xs truncate" style={{ color: '#c9956a' }}>{u.email}</div>
          </div>
          <div className="text-xs text-right flex-shrink-0" style={{ color: '#a07850' }}>
            {new Date(u.created_at).toLocaleDateString('ko-KR')}
          </div>
        </div>

        {u.intro && (
          <p className="text-xs p-2.5 rounded-xl mb-3" style={{ background: '#fdf6ee', color: '#6b4226' }}>
            "{u.intro}"
          </p>
        )}

        {showActions && (
          <>
            {u.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => onUpdate(u.id, 'approved')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white"
                  style={{ background: '#6a9e6a' }}>✅ 승인</button>
                <button onClick={() => onUpdate(u.id, 'rejected')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white"
                  style={{ background: '#c45f5f' }}>❌ 거절</button>
              </div>
            )}
            {u.status === 'approved' && (
              <button onClick={() => onUpdate(u.id, 'rejected')}
                className="w-full py-2.5 rounded-xl text-xs border"
                style={{ borderColor: '#c45f5f', color: '#c45f5f' }}>승인 취소</button>
            )}
            {u.status === 'rejected' && (
              <button onClick={() => onUpdate(u.id, 'approved')}
                className="w-full py-2.5 rounded-xl text-xs border"
                style={{ borderColor: '#6a9e6a', color: '#6a9e6a' }}>다시 승인</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
