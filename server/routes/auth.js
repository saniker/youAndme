const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'youandme_secret_2024';

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { name, gender, age, job, intro, email, password } = req.body;
    if (!name || !gender || !age || !email || !password)
      return res.status(400).json({ error: '필수 항목을 입력해주세요.' });

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });

    const hash = bcrypt.hashSync(password, 10);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, gender, age: parseInt(age), job: job||'', intro: intro||'', email, password: hash, status: 'pending' })
      .select('id,name,gender,age,job,intro,photo,email,status')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const token = jwt.sign({ id: user.id, email, isAdmin: false }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    if (user.status === 'rejected')
      return res.status(403).json({ error: '가입이 거절된 계정입니다. 운영자에게 문의해주세요.' });

    const isAdmin = email === 'admin@youandme.kr';
    const token = jwt.sign({ id: user.id, email, isAdmin }, JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...safe } = user;
    res.json({ token, user: { ...safe, isAdmin } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 내 정보
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users').select('id,name,gender,age,job,intro,photo,email,status').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: '없음' });
    res.json({ ...user, isAdmin: req.user.isAdmin });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 프로필 사진 업데이트
router.patch('/photo', requireAuth, async (req, res) => {
  await supabase.from('users').update({ photo: req.body.photo }).eq('id', req.user.id);
  res.json({ ok: true });
});

// 이름 수정
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    console.log('PATCH /profile - user id:', req.user?.id, 'name:', name);
    if (!name || !name.trim()) return res.status(400).json({ error: '이름을 입력해주세요.' });
    const { error } = await supabase.from('users').update({ name: name.trim() }).eq('id', req.user.id);
    if (error) { console.error('profile update error:', error); return res.status(500).json({ error: error.message }); }
    res.json({ ok: true });
  } catch (e) { console.error('profile catch:', e); res.status(500).json({ error: e.message }); }
});

// 비밀번호 변경
router.patch('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: '비밀번호를 입력해주세요.' });
    if (newPassword.length < 6) return res.status(400).json({ error: '새 비밀번호는 6자 이상이어야 합니다.' });

    const { data: user } = await supabase.from('users').select('password').eq('id', req.user.id).single();
    if (!bcrypt.compareSync(currentPassword, user.password))
      return res.status(400).json({ error: '현재 비밀번호가 올바르지 않습니다.' });

    const hash = bcrypt.hashSync(newPassword, 10);
    await supabase.from('users').update({ password: hash }).eq('id', req.user.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
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
