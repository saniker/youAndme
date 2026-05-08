const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
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
router.post('/events', requireAdmin, (req, res) => {
  const { title, region, cafeName, cafeAddress, date, time, capacityM, capacityF, description, thumbnail } = req.body;
  if (!title || !region || !cafeName || !date)
    return res.status(400).json({ error: '필수 항목 누락' });

  const result = db.prepare(`
    INSERT INTO events (title,region,cafe_name,cafe_address,date,time,capacity_m,capacity_f,description,thumbnail)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(title, region, cafeName, cafeAddress||'', date, time||'18:00',
         capacityM||10, capacityF||10, description||'', thumbnail||'');

  res.json(db.prepare('SELECT * FROM events WHERE id=?').get(result.lastInsertRowid));
});

// 이벤트 목록
router.get('/events', requireAdmin, (req, res) => {
  const events = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM applications WHERE event_id=e.id AND status='pending') as pending_count,
      (SELECT COUNT(*) FROM applications a JOIN users u ON u.id=a.user_id
        WHERE a.event_id=e.id AND a.status='confirmed' AND u.gender='M') as confirmed_m,
      (SELECT COUNT(*) FROM applications a JOIN users u ON u.id=a.user_id
        WHERE a.event_id=e.id AND a.status='confirmed' AND u.gender='F') as confirmed_f
    FROM events e ORDER BY e.date DESC
  `).all();
  res.json(events);
});

// 이벤트 수정
router.patch('/events/:id', requireAdmin, (req, res) => {
  const { title, region, cafeName, cafeAddress, date, time, capacityM, capacityF, description, thumbnail, status } = req.body;
  const ev = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!ev) return res.status(404).json({ error: '없음' });

  db.prepare(`UPDATE events SET
    title=COALESCE(?,title), region=COALESCE(?,region), cafe_name=COALESCE(?,cafe_name),
    cafe_address=COALESCE(?,cafe_address), date=COALESCE(?,date), time=COALESCE(?,time),
    capacity_m=COALESCE(?,capacity_m), capacity_f=COALESCE(?,capacity_f),
    description=COALESCE(?,description), thumbnail=COALESCE(?,thumbnail), status=COALESCE(?,status)
    WHERE id=?
  `).run(title,region,cafeName,cafeAddress,date,time,capacityM,capacityF,description,thumbnail,status, req.params.id);

  res.json(db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id));
});

// 이벤트 삭제
router.delete('/events/:id', requireAdmin, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!event) return res.status(404).json({ error: '없음' });
  if (event.status === 'active') return res.status(400).json({ error: '진행 중인 이벤트는 삭제할 수 없습니다.' });

  db.transaction(() => {
    db.prepare('DELETE FROM likes WHERE event_id=?').run(req.params.id);
    db.prepare('DELETE FROM matches WHERE event_id=?').run(req.params.id);
    db.prepare('DELETE FROM applications WHERE event_id=?').run(req.params.id);
    db.prepare('DELETE FROM notifications WHERE event_id=?').run(req.params.id);
    db.prepare('DELETE FROM events WHERE id=?').run(req.params.id);
  })();

  res.json({ ok: true });
});

// 이벤트 상세 (신청자 포함)
router.get('/events/:id', requireAdmin, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!event) return res.status(404).json({ error: '없음' });

  const applications = db.prepare(`
    SELECT a.id as app_id, a.status as app_status, a.created_at as applied_at,
      u.id, u.name, u.gender, u.age, u.job, u.intro, u.photo, u.email
    FROM applications a JOIN users u ON u.id=a.user_id
    WHERE a.event_id=?
    ORDER BY u.gender, a.created_at ASC
  `).all(req.params.id);

  res.json({ ...event, applications });
});

// 신청 상태 변경 (확정/거절)
router.patch('/applications/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['confirmed','rejected','pending'].includes(status))
    return res.status(400).json({ error: '잘못된 상태값' });

  const app = db.prepare(`
    SELECT a.*, u.name, e.title FROM applications a
    JOIN users u ON u.id=a.user_id
    JOIN events e ON e.id=a.event_id
    WHERE a.id=?
  `).get(req.params.id);
  if (!app) return res.status(404).json({ error: '없음' });

  db.prepare('UPDATE applications SET status=? WHERE id=?').run(status, req.params.id);

  // 회원에게 알림 발송
  const messages = {
    confirmed: { title: '🎉 참가 확정!', body: `"${app.title}" 이벤트 참가가 확정됐습니다. 행사 당일을 기대해주세요!` },
    rejected:  { title: '참가 신청 결과', body: `"${app.title}" 이벤트 참가 신청이 아쉽게도 반영되지 않았습니다.` },
  };
  if (messages[status]) {
    db.prepare('INSERT INTO notifications (user_id,title,body,type,event_id) VALUES (?,?,?,?,?)')
      .run(app.user_id, messages[status].title, messages[status].body, status, app.event_id);
  }

  res.json({ ok: true });
});

// 이벤트 종료 처리 (좋아요 입력 활성화)
router.post('/events/:id/finish', requireAdmin, (req, res) => {
  db.prepare("UPDATE events SET status='finished' WHERE id=?").run(req.params.id);

  // 확정 참가자 전원에게 알림
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  const confirmed = db.prepare(`
    SELECT a.user_id FROM applications a WHERE a.event_id=? AND a.status='confirmed'
  `).all(req.params.id);

  const insertNotif = db.prepare('INSERT INTO notifications (user_id,title,body,type,event_id) VALUES (?,?,?,?,?)');
  db.transaction(() => {
    confirmed.forEach(({ user_id }) => {
      insertNotif.run(user_id,
        '💌 좋아요를 입력해주세요!',
        `"${event.title}" 행사가 종료됐습니다. 마음에 드셨던 분들께 좋아요를 보내보세요!`,
        'likes_open', event.id
      );
    });
  })();

  res.json({ ok: true });
});

// 매칭 집계
router.post('/events/:id/compute-matches', requireAdmin, (req, res) => {
  const eventId = req.params.id;
  const likes = db.prepare('SELECT from_user_id, to_user_id FROM likes WHERE event_id=?').all(eventId);
  const likeSet = new Set(likes.map(l => `${l.from_user_id}-${l.to_user_id}`));

  const seen = new Set();
  const matched = [];
  likes.forEach(l => {
    if (likeSet.has(`${l.to_user_id}-${l.from_user_id}`)) {
      const key = [l.from_user_id, l.to_user_id].sort((a,b)=>a-b).join('-');
      if (!seen.has(key)) { seen.add(key); matched.push(key.split('-').map(Number)); }
    }
  });

  db.prepare('DELETE FROM matches WHERE event_id=?').run(eventId);
  const insert = db.prepare('INSERT INTO matches (event_id,user1_id,user2_id) VALUES (?,?,?)');
  const event = db.prepare('SELECT title FROM events WHERE id=?').get(eventId);

  // 매칭 저장 + 당사자 알림
  const insertNotif = db.prepare('INSERT INTO notifications (user_id,title,body,type,event_id) VALUES (?,?,?,?,?)');
  db.transaction(() => {
    matched.forEach(([u1, u2]) => {
      insert.run(eventId, u1, u2);
      const partner1 = db.prepare('SELECT name FROM users WHERE id=?').get(u2);
      const partner2 = db.prepare('SELECT name FROM users WHERE id=?').get(u1);
      insertNotif.run(u1, '💕 매칭 성공!', `"${event.title}"에서 ${partner1.name}님과 매칭됐습니다!`, 'match', eventId);
      insertNotif.run(u2, '💕 매칭 성공!', `"${event.title}"에서 ${partner2.name}님과 매칭됐습니다!`, 'match', eventId);
    });
  })();

  res.json({ count: matched.length });
});

// 매칭 결과 조회
router.get('/events/:id/matches', requireAdmin, (req, res) => {
  const matches = db.prepare(`
    SELECT m.id,
      u1.id as u1_id, u1.name as u1_name, u1.gender as u1_gender, u1.age as u1_age, u1.photo as u1_photo, u1.job as u1_job,
      u2.id as u2_id, u2.name as u2_name, u2.gender as u2_gender, u2.age as u2_age, u2.photo as u2_photo, u2.job as u2_job
    FROM matches m
    JOIN users u1 ON u1.id=m.user1_id
    JOIN users u2 ON u2.id=m.user2_id
    WHERE m.event_id=?
  `).all(req.params.id);
  res.json(matches);
});

// D-5 알림 발송 (스케줄러에서 호출)
router.post('/events/send-reminders', requireAdmin, (req, res) => {
  const today = new Date();
  const target = new Date(today); target.setDate(today.getDate() + 5);
  const targetDate = target.toISOString().split('T')[0];

  const events = db.prepare("SELECT * FROM events WHERE date=? AND status='closed'").all(targetDate);
  const insertNotif = db.prepare('INSERT INTO notifications (user_id,title,body,type,event_id) VALUES (?,?,?,?,?)');

  let count = 0;
  db.transaction(() => {
    events.forEach(event => {
      const confirmed = db.prepare("SELECT user_id FROM applications WHERE event_id=? AND status='confirmed'").all(event.id);
      confirmed.forEach(({ user_id }) => {
        insertNotif.run(user_id,
          `⏰ D-5 ${event.title}`,
          `${event.date} ${event.time}, ${event.cafe_name}에서 만나요! 기대해주세요 ☕`,
          'reminder', event.id
        );
        count++;
      });
    });
  })();

  res.json({ sent: count });
});

// 회원 목록
router.get('/users', requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT id,name,gender,age,job,intro,photo,email,status,created_at FROM users
    WHERE email != 'admin@youandme.kr' ORDER BY created_at DESC
  `).all();
  res.json(users);
});

// 회원 승인/거절
router.patch('/users/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status))
    return res.status(400).json({ error: '잘못된 상태값' });

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '없음' });

  db.prepare('UPDATE users SET status=? WHERE id=?').run(status, req.params.id);

  if (status === 'approved') {
    db.prepare('INSERT INTO notifications (user_id,title,body,type) VALUES (?,?,?,?)')
      .run(user.id, '🎉 가입이 승인됐습니다!', 'YouAndMe 회원으로 승인됐습니다. 이벤트를 둘러보세요!', 'info');
  } else if (status === 'rejected') {
    db.prepare('INSERT INTO notifications (user_id,title,body,type) VALUES (?,?,?,?)')
      .run(user.id, '가입 신청 결과', '아쉽게도 가입 신청이 반려됐습니다. 운영자에게 문의해주세요.', 'info');
  }

  res.json({ ok: true });
});

module.exports = router;
module.exports.requireAdmin = requireAdmin;
