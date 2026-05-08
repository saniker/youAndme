/* ☕ YouAndMe - 공통 유틸리티 */

const DB_KEY = 'youandme_db';

const defaultDB = {
  users: [],        // 참가자 목록
  events: [],       // 이벤트 목록
  rounds: [],       // 라운드별 매칭
  likes: [],        // 좋아요 기록
  matches: [],      // 최종 매칭 결과
  admin: { id: 'admin', pw: 'admin1234' }
};

/* --- DB 헬퍼 --- */
function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) { localStorage.setItem(DB_KEY, JSON.stringify(defaultDB)); return defaultDB; }
  return JSON.parse(raw);
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function getUsers() { return getDB().users; }
function getUser(id) { return getDB().users.find(u => u.id === id); }
function getCurrentUser() {
  const id = sessionStorage.getItem('current_user');
  return id ? getUser(id) : null;
}
function getActiveEvent() {
  return getDB().events.find(e => e.status === 'active' || e.status === 'waiting');
}

/* --- 세션 --- */
function loginUser(id) { sessionStorage.setItem('current_user', id); }
function logoutUser() { sessionStorage.removeItem('current_user'); sessionStorage.removeItem('is_admin'); }
function loginAdmin() { sessionStorage.setItem('is_admin', '1'); }
function isAdmin() { return sessionStorage.getItem('is_admin') === '1'; }

/* --- 라우팅 --- */
function goTo(path) { window.location.href = path; }

/* --- 토스트 --- */
function showToast(msg, duration = 2200) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

/* --- 시간 포맷 --- */
function fmtTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/* --- UUID --- */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* --- 성별 레이블 --- */
function genderLabel(g) { return g === 'M' ? '남성' : '여성'; }
function genderEmoji(g) { return g === 'M' ? '👨' : '👩'; }

/* --- 상태 레이블 --- */
function statusLabel(s) {
  return { pending: '승인 대기', approved: '승인됨', rejected: '거절됨' }[s] || s;
}
function statusClass(s) {
  return { pending: 'tag-blue', approved: 'tag-green', rejected: 'tag-red' }[s] || '';
}
