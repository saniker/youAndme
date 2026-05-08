const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

// 이벤트 목록 (지역 필터, 상태 필터)
router.get('/', requireAuth, (req, res) => {
  const { region, status } = req.query;
  let sql = 'SELECT e.*, (SELECT COUNT(*) FROM applications WHERE event_id=e.id AND status="confirmed" AND gender="M" FROM applications a JOIN users u ON u.id=a.user_id WHERE a.event_id=e.id) as dummy FROM events e WHERE 1=1';

  // 간단하게 처리
  const events = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM applications a JOIN users u ON u.id=a.user_id
        WHERE a.event_id=e.id AND a.status='confirmed' AND u.gender='M') as confirmed_m,
      (SELECT COUNT(*) FROM applications a JOIN users u ON u.id=a.user_id
        WHERE a.event_id=e.id AND a.status='confirmed' AND u.gender='F') as confirmed_f,
      (SELECT COUNT(*) FROM applications WHERE event_id=e.id AND status='pending') as pending_count
    FROM events e
    WHERE (? IS NULL OR e.region=?)
      AND (? IS NULL OR e.status=?)
    ORDER BY e.date ASC
  `).all(region||null, region||null, status||null, status||null);

  res.json(events);
});

// 이벤트 상세
router.get('/:id', requireAuth, (req, res) => {
  const event = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM applications a JOIN users u ON u.id=a.user_id
        WHERE a.event_id=e.id AND a.status='confirmed' AND u.gender='M') as confirmed_m,
      (SELECT COUNT(*) FROM applications a JOIN users u ON u.id=a.user_id
        WHERE a.event_id=e.id AND a.status='confirmed' AND u.gender='F') as confirmed_f
    FROM events e WHERE e.id=?
  `).get(req.params.id);
  if (!event) return res.status(404).json({ error: '이벤트를 찾을 수 없습니다.' });

  // 내 신청 상태
  const myApp = db.prepare('SELECT * FROM applications WHERE event_id=? AND user_id=?')
    .get(req.params.id, req.user.id);

  res.json({ ...event, myApplication: myApp || null });
});

// 신청
router.post('/:id/apply', requireAuth, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!event) return res.status(404).json({ error: '이벤트 없음' });
  if (event.status !== 'open') return res.status(400).json({ error: '신청이 마감된 이벤트입니다.' });

  const existing = db.prepare('SELECT * FROM applications WHERE event_id=? AND user_id=?')
    .get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: '이미 신청한 이벤트입니다.' });

  db.prepare('INSERT INTO applications (event_id, user_id) VALUES (?,?)').run(req.params.id, req.user.id);

  // 운영자에게 알림
  const adminUser = db.prepare("SELECT id FROM users WHERE email='admin@youandme.kr'").get();
  if (adminUser) {
    const user = db.prepare('SELECT name FROM users WHERE id=?').get(req.user.id);
    db.prepare('INSERT INTO notifications (user_id,title,body,type,event_id) VALUES (?,?,?,?,?)')
      .run(adminUser.id, '새 신청이 들어왔습니다', `${user.name}님이 "${event.title}" 이벤트에 신청했습니다.`, 'application', event.id);
  }

  res.json({ ok: true });
});

// 신청 취소
router.delete('/:id/apply', requireAuth, (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE event_id=? AND user_id=?')
    .get(req.params.id, req.user.id);
  if (!app) return res.status(404).json({ error: '신청 내역 없음' });
  if (app.status === 'confirmed') return res.status(400).json({ error: '확정된 신청은 취소할 수 없습니다.' });

  db.prepare('DELETE FROM applications WHERE id=?').run(app.id);
  res.json({ ok: true });
});

// 내 신청 목록
router.get('/my/applications', requireAuth, (req, res) => {
  const apps = db.prepare(`
    SELECT a.*, e.title, e.region, e.cafe_name, e.date, e.time, e.status as event_status, e.thumbnail
    FROM applications a
    JOIN events e ON e.id=a.event_id
    WHERE a.user_id=?
    ORDER BY a.created_at DESC
  `).all(req.user.id);
  res.json(apps);
});

// 행사 후 좋아요 입력 (상대 참가자 목록 조회)
router.get('/:id/participants', requireAuth, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!event) return res.status(404).json({ error: '없음' });

  const myApp = db.prepare('SELECT * FROM applications WHERE event_id=? AND user_id=? AND status="confirmed"')
    .get(req.params.id, req.user.id);
  if (!myApp) return res.status(403).json({ error: '참가자가 아닙니다.' });

  const me = db.prepare('SELECT gender FROM users WHERE id=?').get(req.user.id);
  const opGender = me.gender === 'M' ? 'F' : 'M';

  const participants = db.prepare(`
    SELECT u.id, u.name, u.age, u.job, u.intro, u.photo, u.gender
    FROM applications a JOIN users u ON u.id=a.user_id
    WHERE a.event_id=? AND a.status='confirmed' AND u.gender=? AND u.id != ?
  `).all(req.params.id, opGender, req.user.id);

  // 이미 좋아요 누른 사람
  const likedIds = db.prepare('SELECT to_user_id FROM likes WHERE event_id=? AND from_user_id=?')
    .all(req.params.id, req.user.id).map(l => l.to_user_id);

  res.json({ participants, likedIds });
});

// 좋아요 제출
router.post('/:id/likes', requireAuth, (req, res) => {
  const { userIds } = req.body;
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!event || event.status !== 'finished') return res.status(400).json({ error: '행사 종료 후에만 입력할 수 있습니다.' });

  const insert = db.prepare('INSERT OR IGNORE INTO likes (event_id, from_user_id, to_user_id) VALUES (?,?,?)');
  const insertMany = db.transaction((ids) => { ids.forEach(id => insert.run(req.params.id, req.user.id, id)); });
  insertMany(Array.isArray(userIds) ? userIds : []);

  res.json({ ok: true });
});

// 내 매칭 결과
router.get('/:id/my-matches', requireAuth, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!event) return res.status(404).json({ error: '없음' });

  const matches = db.prepare(`
    SELECT
      CASE WHEN m.user1_id=? THEN u2.id ELSE u1.id END as partner_id,
      CASE WHEN m.user1_id=? THEN u2.name ELSE u1.name END as partner_name,
      CASE WHEN m.user1_id=? THEN u2.age ELSE u1.age END as partner_age,
      CASE WHEN m.user1_id=? THEN u2.job ELSE u1.job END as partner_job,
      CASE WHEN m.user1_id=? THEN u2.photo ELSE u1.photo END as partner_photo,
      CASE WHEN m.user1_id=? THEN u2.gender ELSE u1.gender END as partner_gender
    FROM matches m
    JOIN users u1 ON u1.id=m.user1_id
    JOIN users u2 ON u2.id=m.user2_id
    WHERE m.event_id=? AND (m.user1_id=? OR m.user2_id=?)
  `).all(req.user.id,req.user.id,req.user.id,req.user.id,req.user.id,req.user.id, req.params.id,req.user.id,req.user.id);

  res.json({ matches, eventStatus: event.status });
});

// 알림 목록
router.get('/notifications/list', requireAuth, (req, res) => {
  const notifs = db.prepare(`
    SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);
  res.json(notifs);
});

// 알림 읽음 처리
router.patch('/notifications/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

router.patch('/notifications/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').run(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
