const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../db');
const { JWT_SECRET } = require('./auth');

const router = express.Router();

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    if (!payload.isAdmin) return res.status(403).json({ error: '관리자 권한 필요' });
    req.user = payload;
    next();
  } catch { res.status(401).json({ error: '토큰 오류' }); }
}

// ── 이벤트 관리 ──

// 이벤트 생성
router.post('/events', requireAdmin, async (req, res) => {
  try {
    const { title, region, cafeName, cafeAddress, date, time, capacityM, capacityF, description, thumbnail } = req.body;
    if (!title || !region || !cafeName || !date)
      return res.status(400).json({ error: '필수 항목 누락' });

    const { data, error } = await supabase.from('events').insert({
      title, region, cafe_name: cafeName, cafe_address: cafeAddress||'',
      date, time: time||'18:00', capacity_m: capacityM||10, capacity_f: capacityF||10,
      description: description||'', thumbnail: thumbnail||''
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 이벤트 목록
router.get('/events', requireAdmin, async (req, res) => {
  try {
    const { data: events } = await supabase.from('events').select('*').order('date', { ascending: false });
    if (!events || events.length === 0) return res.json([]);

    const { data: apps } = await supabase
      .from('applications')
      .select('event_id, status, users(gender)')
      .in('event_id', events.map(e => e.id));

    const enriched = events.map(ev => {
      const evApps = (apps || []).filter(a => a.event_id === ev.id);
      return {
        ...ev,
        pending_count: evApps.filter(a => a.status === 'pending').length,
        confirmed_m: evApps.filter(a => a.status === 'confirmed' && a.users?.gender === 'M').length,
        confirmed_f: evApps.filter(a => a.status === 'confirmed' && a.users?.gender === 'F').length,
      };
    });
    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 이벤트 수정
router.patch('/events/:id', requireAdmin, async (req, res) => {
  try {
    const { title, region, cafeName, cafeAddress, date, time, capacityM, capacityF, description, thumbnail, status } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (region !== undefined) updates.region = region;
    if (cafeName !== undefined) updates.cafe_name = cafeName;
    if (cafeAddress !== undefined) updates.cafe_address = cafeAddress;
    if (date !== undefined) updates.date = date;
    if (time !== undefined) updates.time = time;
    if (capacityM !== undefined) updates.capacity_m = capacityM;
    if (capacityF !== undefined) updates.capacity_f = capacityF;
    if (description !== undefined) updates.description = description;
    if (thumbnail !== undefined) updates.thumbnail = thumbnail;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase.from('events').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 이벤트 삭제
router.delete('/events/:id', requireAdmin, async (req, res) => {
  try {
    const { data: event } = await supabase.from('events').select('*').eq('id', req.params.id).single();
    if (!event) return res.status(404).json({ error: '없음' });

    await supabase.from('likes').delete().eq('event_id', req.params.id);
    await supabase.from('matches').delete().eq('event_id', req.params.id);
    await supabase.from('notifications').delete().eq('event_id', req.params.id);
    await supabase.from('applications').delete().eq('event_id', req.params.id);
    await supabase.from('events').delete().eq('id', req.params.id);

    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 이벤트 상세 (신청자 포함)
router.get('/events/:id', requireAdmin, async (req, res) => {
  try {
    const { data: event } = await supabase.from('events').select('*').eq('id', req.params.id).single();
    if (!event) return res.status(404).json({ error: '없음' });

    const { data: apps } = await supabase
      .from('applications')
      .select('id, status, created_at, users(id, name, gender, age, job, intro, photo, email)')
      .eq('event_id', req.params.id)
      .order('created_at');

    const applications = (apps || []).map(a => ({
      app_id: a.id, app_status: a.status, applied_at: a.created_at,
      ...a.users
    }));

    res.json({ ...event, applications });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 신청 상태 변경
router.patch('/applications/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed','rejected','pending'].includes(status))
      return res.status(400).json({ error: '잘못된 상태값' });

    const { data: app } = await supabase
      .from('applications')
      .select('*, users(name), events(title)')
      .eq('id', req.params.id).single();
    if (!app) return res.status(404).json({ error: '없음' });

    await supabase.from('applications').update({ status }).eq('id', req.params.id);

    const messages = {
      confirmed: { title: '🎉 참가 확정!', body: `"${app.events.title}" 이벤트 참가가 확정됐습니다. 행사 당일을 기대해주세요!` },
      rejected:  { title: '참가 신청 결과', body: `"${app.events.title}" 이벤트 참가 신청이 아쉽게도 반영되지 않았습니다.` },
    };
    if (messages[status]) {
      await supabase.from('notifications').insert({
        user_id: app.user_id, title: messages[status].title, body: messages[status].body,
        type: status, event_id: app.event_id
      });
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 이벤트 종료
router.post('/events/:id/finish', requireAdmin, async (req, res) => {
  try {
    await supabase.from('events').update({ status: 'finished' }).eq('id', req.params.id);

    const { data: event } = await supabase.from('events').select('*').eq('id', req.params.id).single();
    const { data: confirmed } = await supabase
      .from('applications').select('user_id').eq('event_id', req.params.id).eq('status', 'confirmed');

    if (confirmed && confirmed.length > 0) {
      await supabase.from('notifications').insert(
        confirmed.map(({ user_id }) => ({
          user_id,
          title: '💌 좋아요를 입력해주세요!',
          body: `"${event.title}" 행사가 종료됐습니다. 마음에 드셨던 분들께 좋아요를 보내보세요!`,
          type: 'likes_open', event_id: event.id
        }))
      );
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 매칭 집계
router.post('/events/:id/compute-matches', requireAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { data: likes } = await supabase
      .from('likes').select('from_user_id, to_user_id').eq('event_id', eventId);

    const likeSet = new Set((likes || []).map(l => `${l.from_user_id}-${l.to_user_id}`));
    const seen = new Set();
    const matched = [];

    (likes || []).forEach(l => {
      if (likeSet.has(`${l.to_user_id}-${l.from_user_id}`)) {
        const key = [l.from_user_id, l.to_user_id].sort((a,b)=>a-b).join('-');
        if (!seen.has(key)) { seen.add(key); matched.push(key.split('-').map(Number)); }
      }
    });

    await supabase.from('matches').delete().eq('event_id', eventId);

    const { data: event } = await supabase.from('events').select('title').eq('id', eventId).single();

    if (matched.length > 0) {
      await supabase.from('matches').insert(
        matched.map(([u1, u2]) => ({ event_id: eventId, user1_id: u1, user2_id: u2 }))
      );

      // 매칭 알림
      const notifs = [];
      for (const [u1, u2] of matched) {
        const { data: p1 } = await supabase.from('users').select('name').eq('id', u2).single();
        const { data: p2 } = await supabase.from('users').select('name').eq('id', u1).single();
        notifs.push({ user_id: u1, title: '💕 매칭 성공!', body: `"${event.title}"에서 ${p1.name}님과 매칭됐습니다!`, type: 'match', event_id: eventId });
        notifs.push({ user_id: u2, title: '💕 매칭 성공!', body: `"${event.title}"에서 ${p2.name}님과 매칭됐습니다!`, type: 'match', event_id: eventId });
      }
      await supabase.from('notifications').insert(notifs);
    }

    res.json({ count: matched.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 매칭 결과 조회
router.get('/events/:id/matches', requireAdmin, async (req, res) => {
  try {
    const { data } = await supabase
      .from('matches')
      .select('id, user1:user1_id(id,name,gender,age,photo,job), user2:user2_id(id,name,gender,age,photo,job)')
      .eq('event_id', req.params.id);
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// D-5 알림 발송
router.post('/events/send-reminders', requireAdmin, async (req, res) => {
  try {
    const today = new Date(); const target = new Date(today);
    target.setDate(today.getDate() + 5);
    const targetDate = target.toISOString().split('T')[0];

    const { data: events } = await supabase.from('events').select('*').eq('date', targetDate).eq('status', 'closed');
    let count = 0;
    for (const event of (events || [])) {
      const { data: confirmed } = await supabase
        .from('applications').select('user_id').eq('event_id', event.id).eq('status', 'confirmed');
      if (confirmed && confirmed.length > 0) {
        await supabase.from('notifications').insert(
          confirmed.map(({ user_id }) => ({
            user_id, title: `⏰ D-5 ${event.title}`,
            body: `${event.date} ${event.time}, ${event.cafe_name}에서 만나요! ☕`,
            type: 'reminder', event_id: event.id
          }))
        );
        count += confirmed.length;
      }
    }
    res.json({ sent: count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 회원 목록
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { data } = await supabase
      .from('users')
      .select('id,name,gender,age,job,intro,photo,email,status,created_at')
      .neq('email', 'admin@youandme.kr')
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 회원 승인/거절
router.patch('/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved','rejected','pending'].includes(status))
      return res.status(400).json({ error: '잘못된 상태값' });

    const { data: user } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ error: '없음' });

    await supabase.from('users').update({ status }).eq('id', req.params.id);

    const messages = {
      approved: { title: '🎉 가입이 승인됐습니다!', body: 'YouAndMe 회원으로 승인됐습니다. 이벤트를 둘러보세요!' },
      rejected: { title: '가입 신청 결과', body: '아쉽게도 가입 신청이 반려됐습니다. 운영자에게 문의해주세요.' },
    };
    if (messages[status]) {
      await supabase.from('notifications').insert({
        user_id: user.id, title: messages[status].title, body: messages[status].body, type: 'info'
      });
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
module.exports.requireAdmin = requireAdmin;
