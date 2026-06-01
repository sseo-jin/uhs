"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Upload, FileText, Trash2, Edit2, Save, X, Music, Mic, Guitar, Drum, Piano, Link } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Song, Position, Member } from "@/lib/types";

interface Props {
  song: Song;
  onBack: () => void;
  onUpdated: (song: Song) => void;
}

const POSITION_TYPES = ["보컬", "기타 1", "기타 2", "베이스", "드럼", "키보드", "직접 입력"];

const positionIcon = (type: string) => {
  if (type.includes("보컬")) return Mic;
  if (type.includes("기타")) return Guitar;
  if (type.includes("드럼")) return Drum;
  if (type.includes("키보드") || type.includes("피아노")) return Piano;
  return Music;
};

export default function SongDetail({ song, onBack, onUpdated }: Props) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ title: song.title, artist: song.artist });
  const [addingPosition, setAddingPosition] = useState(false);
  const [newPositionType, setNewPositionType] = useState(POSITION_TYPES[0]);
  const [customPositionType, setCustomPositionType] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [urlText, setUrlText] = useState("");

  const fetchPositions = useCallback(async () => {
    const [posRes, memRes] = await Promise.all([
      supabase.from("positions").select("*, members(name, role)").eq("song_id", song.id).order("type"),
      supabase.from("members").select("*").order("name"),
    ]);
    if (posRes.data) setPositions(posRes.data);
    if (memRes.data) setMembers(memRes.data);
    setLoading(false);
  }, [song.id]);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  async function handleInfoSave() {
    if (!infoForm.title.trim()) return;
    await supabase.from("songs").update({ title: infoForm.title.trim(), artist: infoForm.artist.trim() }).eq("id", song.id);
    onUpdated({ ...song, title: infoForm.title.trim(), artist: infoForm.artist.trim() });
    setEditingInfo(false);
  }

  async function handleMemberAssign(positionId: string, memberId: string | null) {
    await supabase.from("positions").update({ member_id: memberId }).eq("id", positionId);
    setPositions((prev) => prev.map((p) => {
      if (p.id !== positionId) return p;
      const member = memberId ? members.find((m) => m.id === memberId) ?? null : null;
      return { ...p, member_id: memberId ?? undefined, member: member ?? undefined };
    }));
  }

  async function handleAddPosition() {
    const type = newPositionType === "직접 입력" ? customPositionType.trim() : newPositionType;
    if (!type) return;
    const { data } = await supabase.from("positions").insert({
      song_id: song.id,
      type,
      progress: 0,
    }).select().single();
    if (data) setPositions((prev) => [...prev, data]);
    setAddingPosition(false);
    setCustomPositionType("");
  }

  async function handleDeletePosition(id: string) {
    if (!confirm("이 포지션을 삭제할까요?")) return;
    await supabase.from("positions").delete().eq("id", id);
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleProgressUpdate(id: string, progress: number) {
    await supabase.from("positions").update({ progress }).eq("id", id);
    setPositions((prev) => prev.map((p) => p.id === id ? { ...p, progress } : p));
  }

  async function handleNoteUpdate(id: string) {
    await supabase.from("positions").update({ notes: noteText }).eq("id", id);
    setPositions((prev) => prev.map((p) => p.id === id ? { ...p, notes: noteText } : p));
    setEditingNote(null);
  }

  async function handleUrlUpdate(id: string) {
    const url = urlText.trim() || null;
    await supabase.from("positions").update({ reference_url: url }).eq("id", id);
    setPositions((prev) => prev.map((p) => p.id === id ? { ...p, reference_url: url ?? undefined } : p));
    setEditingUrl(null);
  }

  async function handleFileUpload(positionId: string, file: File) {
    setUploadingFor(positionId);
    setUploadErrors((prev) => ({ ...prev, [positionId]: "" }));

    const ext = file.name.split(".").pop();
    const path = `songs/${song.id}/${positionId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("sheet-music").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      setUploadErrors((prev) => ({ ...prev, [positionId]: error.message }));
      setUploadingFor(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("sheet-music").getPublicUrl(path);
    await supabase.from("positions").update({
      sheet_music_url: publicUrl,
      sheet_music_name: file.name,
    }).eq("id", positionId);

    setPositions((prev) => prev.map((p) =>
      p.id === positionId ? { ...p, sheet_music_url: publicUrl, sheet_music_name: file.name } : p
    ));
    setUploadingFor(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl text-[#6b7fa3] hover:text-[#38d1f7] hover:bg-[#38d1f7]/10 transition-all flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {editingInfo ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="flex-1 space-y-1.5 min-w-0">
              <input
                type="text"
                value={infoForm.title}
                onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleInfoSave()}
                placeholder="곡 제목"
                autoFocus
                className="w-full bg-[#080c14] border border-[#38d1f7]/40 rounded-lg px-3 py-1.5 text-sm font-bold text-[#e8f0ff] placeholder:text-[#2a3a5a] focus:outline-none"
              />
              <input
                type="text"
                value={infoForm.artist}
                onChange={(e) => setInfoForm({ ...infoForm, artist: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleInfoSave()}
                placeholder="아티스트"
                className="w-full bg-[#080c14] border border-[#1a2540] rounded-lg px-3 py-1.5 text-xs text-[#e8f0ff] placeholder:text-[#2a3a5a] focus:outline-none focus:border-[#38d1f7]/40"
              />
            </div>
            <button onClick={handleInfoSave}
              className="p-2 bg-[#39ff88]/15 text-[#39ff88] rounded-lg hover:bg-[#39ff88]/25 transition-colors flex-shrink-0">
              <Save className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditingInfo(false); setInfoForm({ title: song.title, artist: song.artist }); }}
              className="p-2 text-[#6b7fa3] hover:text-[#e8f0ff] rounded-lg transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[#e8f0ff] truncate">{song.title}</h2>
              {song.artist && <p className="text-xs text-[#6b7fa3]">{song.artist}</p>}
            </div>
            <button
              onClick={() => { setEditingInfo(true); setInfoForm({ title: song.title, artist: song.artist }); }}
              className="p-2 text-[#2a3a5a] hover:text-[#38d1f7] hover:bg-[#38d1f7]/10 rounded-lg transition-all flex-shrink-0"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Positions */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2540]">
          <h3 className="text-sm font-semibold text-[#e8f0ff]">파트별 관리</h3>
          <button
            onClick={() => setAddingPosition(!addingPosition)}
            className="flex items-center gap-1.5 text-xs text-[#38d1f7] hover:text-[#38d1f7]/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            파트 추가
          </button>
        </div>

        {addingPosition && (
          <div className="px-5 py-4 border-b border-[#1a2540] bg-[#080c14] space-y-2">
            <div className="flex gap-2">
              <select
                value={newPositionType}
                onChange={(e) => { setNewPositionType(e.target.value); setCustomPositionType(""); }}
                className="flex-1 bg-[#0d1421] border border-[#1a2540] rounded-lg px-3 py-2 text-sm text-[#e8f0ff] focus:outline-none focus:border-[#38d1f7]/60"
              >
                {POSITION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={handleAddPosition}
                className="px-4 py-2 bg-[#38d1f7] text-[#080c14] font-bold rounded-lg text-sm hover:bg-[#38d1f7]/90 glow-blue transition-all active:scale-95">
                추가
              </button>
              <button onClick={() => { setAddingPosition(false); setCustomPositionType(""); }}
                className="px-3 py-2 bg-[#1a2540] text-[#6b7fa3] rounded-lg text-sm hover:text-[#e8f0ff] transition-colors">
                취소
              </button>
            </div>
            {newPositionType === "직접 입력" && (
              <input
                type="text"
                value={customPositionType}
                onChange={(e) => setCustomPositionType(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPosition()}
                placeholder="악기 이름 입력 (예: 바이올린)"
                autoFocus
                className="w-full bg-[#0d1421] border border-[#38d1f7]/40 rounded-lg px-3 py-2 text-sm text-[#e8f0ff] placeholder:text-[#2a3a5a] focus:outline-none focus:border-[#38d1f7]/60"
              />
            )}
          </div>
        )}

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-[#1a2540] rounded-xl animate-pulse" />)}
          </div>
        ) : positions.length === 0 ? (
          <div className="p-10 text-center">
            <Music className="w-8 h-8 text-[#1a2540] mx-auto mb-2" />
            <p className="text-[#6b7fa3] text-sm">파트를 추가해보세요</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a2540]">
            {positions.map((pos) => {
              const Icon = positionIcon(pos.type);
              return (
                <div key={pos.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#38d1f7]/10 border border-[#38d1f7]/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#38d1f7]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-[#e8f0ff]">{pos.type}</span>
                          <select
                            value={pos.member_id ?? ""}
                            onChange={(e) => handleMemberAssign(pos.id, e.target.value || null)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs bg-transparent border-0 text-[#6b7fa3] focus:outline-none cursor-pointer hover:text-[#38d1f7] transition-colors max-w-[100px] truncate"
                          >
                            <option value="">담당 없음</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-bold text-[#38d1f7]">{pos.progress}%</span>
                          <button onClick={() => handleDeletePosition(pos.id)}
                            className="p-1 text-[#2a3a5a] hover:text-[#ff2d9b] transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="h-1.5 bg-[#1a2540] rounded-full overflow-hidden">
                          <div className="h-full progress-bar rounded-full transition-all duration-300"
                            style={{ width: `${pos.progress}%` }} />
                        </div>
                        <input type="range" min={0} max={100} value={pos.progress}
                          onChange={(e) => handleProgressUpdate(pos.id, Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  <div className="ml-11 space-y-2">
                    {/* Sheet music */}
                    {pos.sheet_music_url ? (
                      <div className="flex items-center gap-2 p-2.5 bg-[#080c14] border border-[#1a2540] rounded-xl">
                        <FileText className="w-4 h-4 text-[#38d1f7] flex-shrink-0" />
                        <a href={pos.sheet_music_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#38d1f7] hover:underline flex-1 truncate">
                          {pos.sheet_music_name || "악보 파일"}
                        </a>
                        <label className="cursor-pointer p-1 text-[#6b7fa3] hover:text-[#e8f0ff] transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(pos.id, e.target.files[0])} />
                        </label>
                      </div>
                    ) : (
                      <label className={cn(
                        "flex items-center gap-2 px-3 py-2 border border-dashed border-[#1a2540] rounded-xl text-xs text-[#6b7fa3] cursor-pointer hover:border-[#38d1f7]/30 hover:text-[#38d1f7] transition-all",
                        uploadingFor === pos.id && "opacity-50 cursor-not-allowed"
                      )}>
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingFor === pos.id ? "업로드 중..." : "악보 업로드 (PDF, 이미지)"}
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                          disabled={uploadingFor === pos.id}
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(pos.id, e.target.files[0])} />
                      </label>
                    )}

                    {uploadErrors[pos.id] && (
                      <p className="text-[10px] text-[#ff2d9b]">{uploadErrors[pos.id]}</p>
                    )}

                    {/* Reference URL */}
                    {editingUrl === pos.id ? (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={urlText}
                          onChange={(e) => setUrlText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleUrlUpdate(pos.id)}
                          placeholder="https://youtube.com/..."
                          autoFocus
                          className="flex-1 bg-[#080c14] border border-[#38d1f7]/40 rounded-lg px-3 py-1.5 text-xs text-[#e8f0ff] placeholder:text-[#2a3a5a] focus:outline-none"
                        />
                        <button onClick={() => handleUrlUpdate(pos.id)}
                          className="p-1.5 bg-[#39ff88]/15 text-[#39ff88] rounded-lg hover:bg-[#39ff88]/25 transition-colors">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingUrl(null)}
                          className="p-1.5 text-[#6b7fa3] hover:text-[#e8f0ff] rounded-lg transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : pos.reference_url ? (
                      <div className="flex items-center gap-2">
                        <Link className="w-3 h-3 text-[#6b7fa3] flex-shrink-0" />
                        <a
                          href={pos.reference_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#38d1f7] hover:underline truncate flex-1"
                        >
                          {pos.reference_url}
                        </a>
                        <button
                          onClick={() => { setEditingUrl(pos.id); setUrlText(pos.reference_url || ""); }}
                          className="p-1 text-[#2a3a5a] hover:text-[#6b7fa3] transition-colors flex-shrink-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingUrl(pos.id); setUrlText(""); }}
                        className="flex items-center gap-1.5 text-xs text-[#2a3a5a] hover:text-[#6b7fa3] transition-colors"
                      >
                        <Link className="w-3 h-3" />
                        링크 추가
                      </button>
                    )}

                    {/* Notes */}
                    {editingNote === pos.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text" value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleNoteUpdate(pos.id)}
                          placeholder="메모 입력..."
                          autoFocus
                          className="flex-1 bg-[#080c14] border border-[#38d1f7]/40 rounded-lg px-3 py-1.5 text-xs text-[#e8f0ff] placeholder:text-[#2a3a5a] focus:outline-none"
                        />
                        <button onClick={() => handleNoteUpdate(pos.id)}
                          className="p-1.5 bg-[#39ff88]/15 text-[#39ff88] rounded-lg hover:bg-[#39ff88]/25 transition-colors">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingNote(null)}
                          className="p-1.5 text-[#6b7fa3] hover:text-[#e8f0ff] rounded-lg transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingNote(pos.id); setNoteText(pos.notes || ""); }}
                        className="flex items-center gap-1.5 text-xs text-[#6b7fa3] hover:text-[#e8f0ff] transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        {pos.notes || "메모 추가"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Song notes */}
      {song.notes && (
        <div className="glass-card rounded-2xl p-5">
          <h4 className="text-xs font-medium text-[#6b7fa3] mb-2 uppercase tracking-wider">곡 메모</h4>
          <p className="text-sm text-[#a0b0d0]">{song.notes}</p>
        </div>
      )}
    </div>
  );
}
