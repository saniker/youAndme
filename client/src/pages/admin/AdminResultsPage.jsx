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

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf6ee' }}><Spinner /></div>;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#fdf6ee' }}>
      <div className="sticky top-0 z-50 px-5 py-4 flex items-center gap-3" style={{ background: '#4a2c17' }}>
        <button onClick={() => navigate(`/admin/events/${id}`)} className="text-white text-xl">←</button>
        <div>
          <div className="font-semibold text-white">매칭 결과</div>
          <div className="text-xs text-white opacity-60">{event?.title}</div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">💕</div>
          <div className="font-bold text-lg" style={{ color: '#4a2c17' }}>총 {matches.length}쌍 매칭</div>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#a07850' }}>
            <p className="text-sm">아직 매칭 결과가 없어요</p>
            <p className="text-xs mt-1">행사 종료 후 매칭 집계를 진행해주세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m, i) => (
              <div key={m.id} className="rounded-2xl overflow-hidden"
                style={{ background: '#fffdf9', boxShadow: '0 4px 20px rgba(74,44,23,0.1)' }}>
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #c9956a, #e8b48a)' }} />
                <div className="p-4 flex items-center gap-2">
                  <span className="text-sm font-bold w-5 flex-shrink-0" style={{ color: '#c9956a' }}>{i+1}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar src={m.u1_photo} name={m.u1_name} size="sm" />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm" style={{ color: '#4a2c17' }}>{m.u1_name}</div>
                      <div className="text-xs" style={{ color: '#a07850' }}>{m.u1_gender==='M'?'👨':'👩'} {m.u1_age}세 · {m.u1_job}</div>
                    </div>
                  </div>
                  <span className="text-xl flex-shrink-0">💕</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="text-right min-w-0">
                      <div className="font-semibold text-sm" style={{ color: '#4a2c17' }}>{m.u2_name}</div>
                      <div className="text-xs" style={{ color: '#a07850' }}>{m.u2_age}세 {m.u2_gender==='M'?'👨':'👩'} · {m.u2_job}</div>
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
