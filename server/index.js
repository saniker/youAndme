require('dotenv').config();
console.log('🚀 서버 시작 중...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌ 없음');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌ 없음');

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우터
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));

// 파일 업로드 (Supabase Storage)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/upload', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일 없음' });
  try {
    const supabase = require('./db');
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

    const { error } = await supabase.storage
      .from('photos')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) return res.status(500).json({ error: error.message });

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(filename);

    res.json({ url: publicUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 관리자 계정 초기화
async function initAdmin() {
  const supabase = require('./db');
  const { data: admin, error: findErr } = await supabase
    .from('users').select('id').eq('email', 'admin@youandme.kr').maybeSingle();

  if (findErr) console.error('initAdmin 조회 오류:', findErr.message);

  if (!admin) {
    const hash = bcrypt.hashSync('admin1234', 10);
    const { error: insertErr } = await supabase.from('users').insert({
      name: '관리자', gender: 'M', age: 30, job: '', intro: '',
      email: 'admin@youandme.kr', password: hash, status: 'approved'
    });
    if (insertErr) console.error('❌ 관리자 계정 생성 실패:', insertErr.message);
    else console.log('✅ 관리자 계정 생성: admin@youandme.kr / admin1234');
  } else {
    const { error: updateErr } = await supabase.from('users')
      .update({ status: 'approved' }).eq('email', 'admin@youandme.kr');
    if (updateErr) console.error('❌ 관리자 상태 업데이트 실패:', updateErr.message);
    else console.log('✅ 관리자 계정 확인됨');
  }
}

// D-5 알림 스케줄러 (매일 자정 실행)
function scheduleReminders() {
  const now = new Date();
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const ms = midnight - now;
  setTimeout(async () => {
    const supabase = require('./db');
    const today = new Date(); const target = new Date(today);
    target.setDate(today.getDate() + 5);
    const targetDate = target.toISOString().split('T')[0];

    const { data: events } = await supabase
      .from('events').select('*').eq('date', targetDate).eq('status', 'closed');

    if (events && events.length > 0) {
      for (const event of events) {
        const { data: confirmed } = await supabase
          .from('applications').select('user_id').eq('event_id', event.id).eq('status', 'confirmed');
        if (confirmed && confirmed.length > 0) {
          await supabase.from('notifications').insert(
            confirmed.map(({ user_id }) => ({
              user_id,
              title: `⏰ D-5 ${event.title}`,
              body: `${event.date} ${event.time}, ${event.cafe_name}에서 만나요! ☕`,
              type: 'reminder',
              event_id: event.id
            }))
          );
        }
      }
      console.log(`📬 D-5 알림 발송 완료 (${events.length}개 이벤트)`);
    }
    scheduleReminders();
  }, ms);
}

// 헬스체크
app.get('/', (req, res) => res.json({ status: 'ok', message: 'YouAndMe API' }));

// 전역 에러 핸들러
process.on('uncaughtException', (err) => { console.error('❌ uncaughtException:', err); });
process.on('unhandledRejection', (err) => { console.error('❌ unhandledRejection:', err); });

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ YouAndMe 서버 → http://localhost:${PORT}`);
  try { await initAdmin(); } catch(e) { console.error('initAdmin 오류:', e.message); }
  scheduleReminders();
});
