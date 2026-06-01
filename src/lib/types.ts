export interface Member {
  id: string;
  name: string;
  role: string; // 보컬, 기타, 베이스, 드럼, 키보드 등
  avatar_url?: string;
  created_at: string;
}

export interface Rehearsal {
  id: string;
  date: string; // ISO date
  time: string; // HH:mm
  location: string;
  notes?: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  rehearsal_id: string;
  member_id: string;
  status: 'attending' | 'absent' | 'undecided';
  member?: Member;
}

export interface Vote {
  id: string;
  member_id: string;
  date: string; // YYYY-MM-DD
  year: number;
  month: number;
  member?: Member;
}

export interface SongCandidate {
  id: string;
  title: string;
  artist: string;
  suggested_by: string;
  created_at: string;
  votes?: string[]; // member names
}

export interface SongVote {
  id: string;
  candidate_id: string;
  member_name: string;
  created_at: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  notes?: string;
  sort_order?: number;
  created_at: string;
  members?: SongMember[];
  positions?: Position[];
}

export interface SongMember {
  id: string;
  song_id: string;
  member_id: string;
  position_type: string;
  member?: Member;
}

export interface Position {
  id: string;
  song_id: string;
  type: string; // 보컬, 기타1, 기타2, 베이스, 드럼, 키보드
  member_id?: string;
  sheet_music_url?: string;
  sheet_music_name?: string;
  reference_url?: string;
  notes?: string;
  progress: number; // 0-100
  member?: Member;
}

export type VoteMap = Record<string, string[]>; // date -> memberName[]
