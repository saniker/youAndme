-- YouAndMe Supabase Schema
-- Supabase 대시보드 → SQL Editor 에서 실행하세요

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('M','F')),
  age INTEGER NOT NULL,
  job TEXT DEFAULT '',
  intro TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  push_token TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL,
  cafe_name TEXT NOT NULL,
  cafe_address TEXT DEFAULT '',
  date TEXT NOT NULL,
  time TEXT DEFAULT '18:00',
  capacity_m INTEGER DEFAULT 10,
  capacity_f INTEGER DEFAULT 10,
  status TEXT DEFAULT 'open' CHECK(status IN ('open','closed','finished')),
  description TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  from_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user1_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
