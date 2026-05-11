import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuthStore } from '../../store';
import { AdminNav } from './AdminNav';
import { Spinner, Toast } from '../../components/Layout';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '제주'];

const STATUS_MAP = {
  open:     { label: '신청 가능', color: '#00C853', bg: '#E6FAF0' },
  closed:   { label: '신청 마감', color: '#8B95A1', bg: '#F2F4F6' },
  finished: { label: '행사 종료', color: '#8B95A1', bg: '#F2F4F6' },
};

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    title: '', region: '', cafeName: '', cafeAddress: '',
    date: '', time: '18:00', capacityM: 10, capacityF: 10, description: ''
  });

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  useEffect(() => {
    if (!user?.isAdmin) navigate('/admin', { replace: true });
    else fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try { const { data } = await api.get('/admin/events'); setEvents(data); }
    catch {} finally { setLoading(false); }
  }

  async function createEvent() {
    if (!form.title || !form.region || !form.cafeName || !form.date)
      return showToast('필수 항목을 모두 입력해주세요.');
    try {
      await api.post('/admin/events', form);
      showToast('✅ 이벤트가 생성됐습니다!');
      setShowCreate(false);
      setForm({ title:'', region:'', cafeName:'', cafeAddress:'', date:'', time:'18:00', capacityM:10, capacityF:10, description:'' });
      fetchEvents();
    } catch { showToast('생성 실패'); }
  }

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none',
    background: '#F2F4F6', color: '#191F28', fontFamily: 'inherit', fontSize: 14, outline: 'none'
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F2F4F6' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 py-4 flex items-center justify-between"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #F2F4F6' }}>
        <span className="font-black text-lg" style={{ color: '#191F28' }}>이벤트 관리</span>
        <button onClick={() => setShowCreate(true)}
          className="text-xs px-4 py-2 rounded-full font-bold text-white"
          style={{ background: '#3182F6' }}>+ 새 이벤트</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="px-4 pt-4 space-y-3">
          {events.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-sm font-semibold" style={{ color: '#191F28' }}>이벤트를 생성해보세요</p>
            </div>
          )}
          {events.map(ev => {
            const st = STATUS_MAP[ev.status] || STATUS_MAP.open;
            return (
              <button key={ev.id} onClick={() => navigate(`/admin/events/${ev.id}`)}
                className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
                style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="h-1" style={{ background: st.color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-black flex-1 mr-3 text-sm" style={{ color: '#191F28' }}>{ev.title}</div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0"
                      style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className="text-xs mb-2" style={{ color: '#8B95A1' }}>
                    📍 {ev.region} · {ev.cafe_name} &nbsp;·&nbsp; 📅 {ev.date} {ev.time}
                  </div>
                  <div className="flex gap-4 text-xs font-semibold" style={{ color: '#4A4F5C' }}>
                    <span>⏳ 대기 {ev.pending_count}명</span>
                    <span>👨 {ev.confirmed_m}/{ev.capacity_m}명</span>
                    <span>👩 {ev.confirmed_f}/{ev.capacity_f}명</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 이벤트 생성 모달 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', paddingBottom: 60 }}
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col"
            style={{ background: '#FFFFFF', maxHeight: 'calc(90vh - 60px)' }}>
            <div className="px-5 pt-5 pb-3 flex-shrink-0 flex items-center justify-between"
              style={{ borderBottom: '1px solid #F2F4F6' }}>
              <h3 className="font-black" style={{ color: '#191F28' }}>새 이벤트 만들기</h3>
              <button onClick={() => setShowCreate(false)} className="text-xl" style={{ color: '#8B95A1' }}>✕</button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>이벤트 이름 *</label>
                <input style={inp} placeholder="예: 2025 봄 로테이션 소개팅"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>지역 *</label>
                <select style={inp} value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
                  <option value="">지역 선택</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>카페 이름 *</label>
                <input style={inp} placeholder="카페명 입력"
                  value={form.cafeName} onChange={e => setForm(f => ({ ...f, cafeName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>카페 주소</label>
                <input style={inp} placeholder="상세 주소 (선택)"
                  value={form.cafeAddress} onChange={e => setForm(f => ({ ...f, cafeAddress: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>날짜 *</label>
                  <input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>시간</label>
                  <input style={inp} type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>남성 정원</label>
                  <input style={inp} type="number" min={1} max={20} value={form.capacityM}
                    onChange={e => setForm(f => ({ ...f, capacityM: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>여성 정원</label>
                  <input style={inp} type="number" min={1} max={20} value={form.capacityF}
                    onChange={e => setForm(f => ({ ...f, capacityF: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#191F28' }}>이벤트 소개</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'none' }} placeholder="이벤트 설명을 입력하세요"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #F2F4F6' }}>
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: '#F2F4F6', color: '#8B95A1' }}>취소</button>
              <button onClick={createEvent}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: '#3182F6' }}>생성</button>
            </div>
          </div>
        </div>
      )}

      <AdminNav active="events" />
      <Toast msg={toast} />
    </div>
  );
}
