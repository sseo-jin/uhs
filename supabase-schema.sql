-- ===========================
-- UHS Band Management Schema
-- ===========================

-- Members
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '멤버',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rehearsals
CREATE TABLE rehearsals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rehearsal_id UUID REFERENCES rehearsals(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'undecided', -- attending | absent | undecided
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rehearsal_id, member_id)
);

-- Votes (date availability)
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, date)
);

-- Songs
CREATE TABLE songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'learning', -- learning | rehearsing | ready | performed
  cover_url TEXT,
  notes TEXT,
  youtube_url TEXT,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Migration (기존 테이블에 추가할 때):
-- ALTER TABLE songs ADD COLUMN youtube_url TEXT;
-- Migration (기존 테이블에 추가할 때):
-- ALTER TABLE songs ADD COLUMN sort_order INT;
-- ALTER TABLE positions ADD COLUMN reference_url TEXT;

-- Song Members (which members are in each song)
CREATE TABLE song_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  position_type TEXT,
  UNIQUE(song_id, member_id)
);

-- Positions (per song, per instrument)
CREATE TABLE positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 보컬, 기타1, 기타2, 베이스, 드럼, 키보드
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  sheet_music_url TEXT,
  sheet_music_name TEXT,
  reference_url TEXT,
  notes TEXT,
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Song Vote Candidates (합주 외 신규 곡 후보)
CREATE TABLE song_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT '',
  suggested_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Song Votes (곡 후보 투표)
CREATE TABLE song_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES song_candidates(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, member_name)
);

-- ===========================
-- Storage bucket for sheet music
-- ===========================
-- 1. Supabase Dashboard > Storage > New bucket: "sheet-music" (Public 체크)
-- 2. SQL Editor에서 아래 실행:
-- CREATE POLICY "Allow all" ON storage.objects FOR ALL TO anon
--   USING (bucket_id = 'sheet-music') WITH CHECK (bucket_id = 'sheet-music');

-- ===========================
-- RLS Policies (open for band members)
-- ===========================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsals ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (site password handles auth)
CREATE POLICY "Allow all" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rehearsals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON song_candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON song_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON songs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON song_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON positions FOR ALL USING (true) WITH CHECK (true);
