"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Plus, Music2, ChevronRight, X, GripVertical } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Song } from "@/lib/types";
import SongDetail from "./SongDetail";

interface SongItemProps {
  song: Song;
  onSelect: (song: Song) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDragEnd: () => void;
}

function SongItem({ song, onSelect, onDelete, onDragEnd }: SongItemProps) {
  const controls = useDragControls();
  const members = song.members || [];

  return (
    <Reorder.Item
      value={song}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      style={{ listStyle: "none" }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div
        onClick={() => onSelect(song)}
        className="p-4 cursor-pointer transition-all duration-200 active:scale-[0.99] group"
      >
        <div className="flex items-center gap-3">
          <div
            onPointerDown={(e) => { e.stopPropagation(); controls.start(e); }}
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-[#2a3a5a] hover:text-[#6b7fa3] cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#38d1f7]/20 to-[#39ff88]/10 border border-[#38d1f7]/20 flex items-center justify-center flex-shrink-0">
            <Music2 className="w-5 h-5 text-[#38d1f7]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-[#e8f0ff] truncate">{song.title}</h3>
                {song.artist && <p className="text-xs text-[#6b7fa3] truncate mt-0.5">{song.artist}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => onDelete(song.id, e)}
                  className="p-1 text-[#2a3a5a] hover:text-[#ff2d9b] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-[#2a3a5a] group-hover:text-[#38d1f7] transition-colors" />
              </div>
            </div>

            {members.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {members.slice(0, 4).map((sm: { id: string; members?: { name: string; role: string } }) => (
                  <span key={sm.id} className="text-[10px] bg-[#1a2540] text-[#6b7fa3] px-2 py-0.5 rounded-full">
                    {sm.members?.name}
                  </span>
                ))}
                {members.length > 4 && (
                  <span className="text-[10px] text-[#6b7fa3]">+{members.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

export default function SongList() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", artist: "" });
  const songsRef = useRef<Song[]>([]);

  const fetchSongs = useCallback(async () => {
    const { data } = await supabase
      .from("songs")
      .select("*, song_members(*, members(name, role))")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (data) {
      setSongs(data);
      songsRef.current = data;
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  async function handleAdd() {
    if (!form.title.trim()) return;
    const { data } = await supabase.from("songs").insert({
      title: form.title.trim(),
      artist: form.artist.trim(),
      sort_order: songs.length,
    }).select().single();

    if (data) {
      setSongs((prev) => {
        const next = [data, ...prev];
        songsRef.current = next;
        return next;
      });
      setSelectedSong(data);
    }
    setAdding(false);
    setForm({ title: "", artist: "" });
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("이 곡을 삭제할까요?")) return;
    await supabase.from("songs").delete().eq("id", id);
    setSongs((prev) => {
      const next = prev.filter((s) => s.id !== id);
      songsRef.current = next;
      return next;
    });
    if (selectedSong?.id === id) setSelectedSong(null);
  }

  function handleReorder(newOrder: Song[]) {
    setSongs(newOrder);
    songsRef.current = newOrder;
  }

  async function persistOrder() {
    const current = songsRef.current;
    await Promise.all(
      current.map((song, idx) =>
        supabase.from("songs").update({ sort_order: idx }).eq("id", song.id)
      )
    );
  }

  if (selectedSong) {
    return (
      <SongDetail
        song={selectedSong}
        onBack={() => { setSelectedSong(null); fetchSongs(); }}
        onUpdated={(updated) => {
          setSelectedSong(updated);
          setSongs((prev) => prev.map((s) => s.id === updated.id ? updated : s));
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      <button
        onClick={() => setAdding(!adding)}
        className="w-full glass-card rounded-2xl p-4 border-dashed border-[#1a2540] flex items-center gap-3 text-[#6b7fa3] hover:text-[#38d1f7] hover:border-[#38d1f7]/30 hover:bg-[#38d1f7]/5 transition-all group"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        <span className="text-sm">새 곡 추가</span>
      </button>

      {/* Add form */}
      {adding && (
        <div className="glass-card rounded-2xl p-5 border border-[#38d1f7]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#38d1f7]">새 곡 추가</h3>
            <button onClick={() => setAdding(false)} className="text-[#6b7fa3] hover:text-[#e8f0ff]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text" placeholder="곡 제목 *" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
              className="w-full bg-[#080c14] border border-[#1a2540] rounded-xl px-4 py-3 text-[#e8f0ff] text-sm placeholder:text-[#2a3a5a] focus:outline-none focus:border-[#38d1f7]/60"
            />
            <input
              type="text" placeholder="아티스트" value={form.artist}
              onChange={(e) => setForm({ ...form, artist: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full bg-[#080c14] border border-[#1a2540] rounded-xl px-4 py-3 text-[#e8f0ff] text-sm placeholder:text-[#2a3a5a] focus:outline-none focus:border-[#38d1f7]/60"
            />
            <button
              onClick={handleAdd}
              className="w-full bg-[#38d1f7] text-[#080c14] font-bold py-3 rounded-xl hover:bg-[#38d1f7]/90 glow-blue transition-all active:scale-95 text-sm"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* Song list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[#1a2540] rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-[#1a2540] rounded" />
                  <div className="h-3 w-20 bg-[#1a2540] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Music2 className="w-10 h-10 text-[#1a2540] mx-auto mb-3" />
          <p className="text-[#6b7fa3] text-sm">곡이 없어요. 새 곡을 추가해보세요!</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={songs}
          onReorder={handleReorder}
          className="space-y-3"
          style={{ listStyle: "none", padding: 0, margin: 0 }}
        >
          {songs.map((song) => (
            <SongItem
              key={song.id}
              song={song}
              onSelect={setSelectedSong}
              onDelete={handleDelete}
              onDragEnd={persistOrder}
            />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
