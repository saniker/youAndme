import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { AdminNav } from './AdminNav';
import { Spinner, Avatar } from '../../components/Layout';

export default function AdminResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    try {
      const [{ data: ev }, { data: m }] = await Promise.all([
        api.get(`/admin/events/${id}`),
        api.get(`/admin/events/${id}/matches`)
      ]);
      setEvent(ev);
      setMatches(m);
    } catch {}
    finally { setLoading(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F4F6' }}>
      <Spinner />
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F2F4F6' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-50 px-5 py-4 flex items-center gap-3"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #F2F4F6' }}>
        <button onClick={() => navigate(`/admin/events/${id}`)} style={{ color: '#191F28', fontSize: 22 }}>←</button>
        <div>
          <div className="font-black text-sm" style={{ color: '#191F28' }}>매칭 결과</div>
          <div className="text-xs" style={{ color: '#8B95A1' }}>{event?.title}</div>
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* 요약 */}
        <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="text-5xl mb-2">💕</div>
          <div className="font-black text-xl" style={{ color: '#191F28' }}>총 {matches.length}쌍 매칭</div>
          <div className="text-sm mt-1" style={{ color: '#8B95A1' }}>서로 좋아요를 누른 커플</div>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-semibold" style={{ color: '#191F28' }}>아직 매칭 결과가 없어요</p>
            <p className="text-xs mt-1" style={{ color: '#8B95A1' }}>행사 종료 후 매칭 집계를 진행해주세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m, i) => (
              <div key={m.id} className="rounded-2xl overflow-hidden"
                style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #3182F6, #F04452)' }} />
                <div className="p-4 flex items-center gap-2">
                  <span className="text-sm font-black w-5 flex-shrink-0" style={{ color: '#8B95A1' }}>{i + 1}</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar src={m.u1_photo} name={m.u1_name} size="sm" />
                    <div className="min-w-0">
                      <div className="font-black text-sm" style={{ color: '#191F28' }}>{m.u1_name}</div>
                      <div className="text-xs" style={{ color: '#8B95A1' }}>
                        {m.u1_gender === 'M' ? '👨' : '👩'} {m.u1_age}세 · {m.u1_job || '직업 미입력'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xl flex-shrink-0">💕</span>
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    <div className="text-right min-w-0">
                      <div className="font-black text-sm" style={{ color: '#191F28' }}>{m.u2_name}</div>
                      <div className="text-xs" style={{ color: '#8B95A1' }}>
                        {m.u2_gender === 'M' ? '👨' : '👩'} {m.u2_age}세 · {m.u2_job || '직업 미입력'}
                      </div>
                    </div>
                    <Avatar src={m.u2_photo} name={m.u2_name} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminNav active="events" />
    </div>
  );
}
