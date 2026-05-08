const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'youandme_secret_2024';

router.post('/register', (req, res) => {
  const { name, gender, age, job, intro, email, password } = req.body;
  if (!name || !gender || !age || !email || !password)
    return res.status(400).json({ error: '필수 항목을 입력해주세요.' });

  if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
    return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name,gender,age,job,intro,email,password,status) VALUES (?,?,?,?,?,?,?,?)'
  ).run(name, gender, parseInt(age), job||'', intro||'', email, hash, 'pending');

  const user = db.prepare('SELECT id,name,gender,age,job,intro,photo,email,status FROM users WHERE id=?').get(result.lastInsertRowid);
  const token = jwt.sign({ id: user.id, email, isAdmin: false }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

  if (user.status === 'rejected')
    return res.status(403).json({ error: '가입이 거절된 계정입니다. 운영자에게 문의해주세요.' });

  const isAdmin = email === 'admin@youandme.kr';
  const token = jwt.sign({ id: user.id, email, isAdmin }, JWT_SECRET, { expiresIn: '30d' });
  const { password: _, ...safe } = user;
  res.json({ token, user: { ...safe, isAdmin } });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id,name,gender,age,job,intro,photo,email,status FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '없음' });
  res.json({ ...user, isAdmin: req.user.isAdmin });
});

router.patch('/photo', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET photo=? WHERE id=?').run(req.body.photo, req.user.id);
  res.json({ ok: true });
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: '인증이 필요합니다.' });
  try { req.user = jwt.verify(auth.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: '토큰이 유효하지 않습니다.' }); }
}

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.JWT_SECRET = JWT_SECRET;
