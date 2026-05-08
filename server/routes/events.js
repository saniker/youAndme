const express = require('express');
const supabase = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

// 이벤트 목록
router.get('/', requireAuth, async (req, res) => {
  try {
    const { region } = req.query;
    let query = supabase.from('events').select('*').order('date', { ascending: true });
    if (region) query = query.eq('region', region);

    const { data: events } = await query;
    if (!events || events.length === 0) return res.json([]);

    const { data: apps } = await supabase
      .from('applications')
      .select('event_id, status, users(gender)')
      .in('event_id', events.map(e => e.id));

    const enriched = events.map(ev => {
      const evApps = (apps || []).filter(a => a.event_id === ev.id);
      return {
        ...ev,
        confirmed_m: evApps.filter(a => a.status === 'confirmed' && a.users?.gender === 'M').length,
        confirmed_f: evApps.filter(a => a.status === 'confirmed' && a.users?.gender === 'F').length,
        pending_count: evApps.filter(a => a.status === 'pending').length,
      };
    });
    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 내 신청 목록 (/:id 보다 먼저 정의)
router.get('/my/applications', requireAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, events(id, title, region, cafe_name, date, time, status, thumbnail)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    const result = (data || []).map(a => ({
      id: a.id, status: a.status, created_at: a.created_at,
      event_id: a.events?.id, title: a.events?.title, region: a.events?.region,
      cafe_name: a.events?.cafe_name, date: a.events?.date, time: a.events?.time,
      event_status: a.events?.status, thumbnail: a.events?.thumbnail
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 알림 목록 (/:id 보다 먼저 정의)
router.get('/notifications/list', requireAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 알림 전체 읽음
router.patch('/notifications/read-all', requireAuth, async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: 1 }).eq('user_id', req.user.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 알림 읽음 처리
router.patch('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: 1 })
      .eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 이벤트 상세
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data: event } = await supabase.from('events').select('*').eq('id', req.params.id).single();
    if (!event) return res.status(404).json({ error: '이벤트를 찾을 수 없습니다.' });

    const { data: apps } = await supabase
      .from('applications')
      .select('event_id, status, users(gender)')
      .eq('event_id', req.params.id);

    const evApps = apps || [];
    const confirmed_m = evApps.filter(a => a.status === 'confirmed' && a.users?.gender === 'M').length;
    const confirmed_f = evApps.filter(a => a.status === 'confirmed' && a.users?.gender === 'F').length;

    const { data: myApp } = await supabase
      .from('applications').select('*')
      .eq('event_id', req.params.id).eq('user_id', req.user.id).maybeSingle();

    res.json({ ...event, confirmed_m, confirmed_f, myApplication: myApp || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 신청
router.post('/:id/apply', requireAuth, async (req, res) => {
  try {
    const { data: event } = await supabase.from('events').select('*').eq('id', req.params.id).single();
    if (!event) return res.status(404).json({ error: '이벤트 없음' });
    if (event.status !== 'open') return res.status(400).json({ error: '신청이 마감된 이벤트입니다.' });

    const { data: existing } = await supabase
      .from('applications').select('id').eq('event_id', req.params.id).eq('user_id', req.user.id).maybeSingle();
    if (existing) return res.status(409).json({ error: '이미 신청한 이벤트입니다.' });

    await supabase.from('applications').insert({ event_id: req.params.id, user_id: req.user.id });

    // 운영자에게 알림
    const { data: admin } = await supabase.from('users').select('id').eq('email', 'admin@youandme.kr').single();
    const { data: me } = await supabase.from('users').select('name').eq('id', req.user.id).single();
    if (admin) {
      await supabase.from('notifications').insert({
        user_id: admin.id, title: '새 신청이 들어왔습니다',
        body: `${me.name}님이 "${event.title}" 이벤트에 신청했습니다.`,
        type: 'application', event_id: event.id
      });
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 신청 취소
router.delete('/:id/apply', requireAuth, async (req, res) => {
  try {
    const { data: app } = await supabase
      .from('applications').select('*').eq('event_id', req.params.id).eq('user_id', req.user.id).maybeSingle();
    if (!app) return res.status(404).json({ error: '신청 내역 없음' });
    if (app.status === 'confirmed') return res.status(400).json({ error: '확정된 신청은 취소할 수 없습니다.' });

    await supabase.from('applications').delete().eq('id', app.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 상대 참가자 목록 (좋아요용)
router.get('/:id/participants', requireAuth, async (req, res) => {
  try {
    const { data: event } = await supabase.from('events').select('*').eq('id', req.params.id).single();
    if (!event) return res.status(404).json({ error: '없음' });

    const { data: myApp } = await supabase
      .from('applications').select('*')
      .eq('event_id', req.params.id).eq('user_id', req.user.id).eq('status', 'confirmed').maybeSingle();
    if (!myApp) return res.status(403).json({ error: '참가자가 아닙니다.' });

    const { data: me } = await supabase.from('users').select('gender').eq('id', req.user.id).single();
    const opGender = me.gender === 'M' ? 'F' : 'M';

    const { data: apps } = await supabase
      .from('applications')
      .select('users(id, name, age, job, intro, photo, gender)')
      .eq('event_id', req.params.id)
      .eq('status', 'confirmed');

    const participants = (apps || [])
      .map(a => a.users)
      .filter(u => u && u.gender === opGender && u.id !== req.user.id);

    const { data: likedRows } = await supabase
      .from('likes').select('to_user_id').eq('event_id', req.params.id).eq('from_user_id', req.user.id);
    const likedIds = (likedRows || []).map(l => l.to_user_id);

    res.json({ participants, likedIds });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 좋아요 제출
router.post('/:id/likes', requireAuth, async (req, res) => {
  try {
    const { userIds } = req.body;
    const { data: event } = await supabase.from('events').select('*').eq('id', req.params.id).single();
    if (!event || event.status !== 'finished') return res.status(400).json({ error: '행사 종료 후에만 입력할 수 있습니다.' });

    // 기존 좋아요 삭제 후 재입력
    await supabase.from('likes').delete().eq('event_id', req.params.id).eq('from_user_id', req.user.id);

    const ids = Array.isArray(userIds) ? userIds : [];
    if (ids.length > 0) {
      await supabase.from('likes').insert(
        ids.map(toId => ({ event_id: req.params.id, from_user_id: req.user.id, to_user_id: toId }))
      );
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 내 매칭 결과
router.get('/:id/my-matches', requireAuth, async (req, res) => {
  try {
    const { data: event } = await supabase.from('events').select('*').eq('id', req.params.id).single();
    if (!event) return res.status(404).json({ error: '없음' });

    const userId = req.user.id;
    const { data } = await supabase
      .from('matches')
      .select('id, user1:user1_id(id,name,age,job,photo,gender), user2:user2_id(id,name,age,job,photo,gender)')
      .eq('event_id', req.params.id)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const matches = (data || []).map(m => {
      const partner = m.user1.id === userId ? m.user2 : m.user1;
      return {
        partner_id: partner.id, partner_name: partner.name,
        partner_age: partner.age, partner_job: partner.job,
        partner_photo: partner.photo, partner_gender: partner.gender
      };
    });

    res.json({ matches, eventStatus: event.status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
