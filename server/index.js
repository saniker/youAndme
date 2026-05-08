const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB 초기화 (관리자 계정 생성)
const db = require('./db');
const adminExists = db.prepare("SELECT id FROM users WHERE email='admin@youandme.kr'").get();
if (!adminExists) {
  db.prepare(`INSERT INTO users (name,gender,age,email,password,status) VALUES ('관리자','M',30,'admin@youandme.kr',?,?)`)
    .run(bcrypt.hashSync('admin1234', 10), 'approved');
  console.log('✅ 관리자 계정 생성: admin@youandme.kr / admin1234');
} else {
  db.prepare("UPDATE users SET status='approved' WHERE email='admin@youandme.kr'").run();
}

// 라우터
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));

// 파일 업로드
const multer = require('multer');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일 없음' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// D-5 알림 스케줄러 (매일 자정 실행)
function scheduleReminders() {
  const now = new Date();
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const ms = midnight - now;
  setTimeout(() => {
    const { requireAdmin } = require('./routes/admin');
    // 직접 DB 호출
    const today = new Date(); const target = new Date(today);
    target.setDate(today.getDate() + 5);
    const targetDate = target.toISOString().split('T')[0];
    const events = db.prepare("SELECT * FROM events WHERE date=? AND status='closed'").all(targetDate);
    const insertNotif = db.prepare('INSERT INTO notifications (user_id,title,body,type,event_id) VALUES (?,?,?,?,?)');
    db.transaction(() => {
      events.forEach(event => {
        const confirmed = db.prepare("SELECT user_id FROM applications WHERE event_id=? AND status='confirmed'").all(event.id);
        confirmed.forEach(({ user_id }) => {
          insertNotif.run(user_id, `⏰ D-5 ${event.title}`,
            `${event.date} ${event.time}, ${event.cafe_name}에서 만나요! ☕`, 'reminder', event.id);
        });
      });
    })();
    console.log(`📬 D-5 알림 발송 완료 (${events.length}개 이벤트)`);
    scheduleReminders(); // 내일 다시
  }, ms);
}
scheduleReminders();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ YouAndMe 서버 → http://localhost:${PORT}`);
});
