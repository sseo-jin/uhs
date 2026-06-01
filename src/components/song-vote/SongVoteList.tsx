"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, Plus, X, Music2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { SongCandidate } from "@/lib/types";

interface Props {
  userName: string;
}

export default function SongVoteList({ userName }: Props) {
  const [candidates, setCandidates] = useState<SongCandidate[]>([]);
  const [voteMap, setVoteMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", artist: "" });

  const fetchData = useCallback(async () => {
    const [cRes, vRes] = await Promise.all([
      supabase.from("song_candidates").select("*").order("created_at", { ascending: false }),
      supabase.from("song_votes").select("candidate_id, member_name"),
    ]);

    if (cRes.data) setCandidates(cRes.data);
    if (vRes.data) {
      const map: Record<string, string[]> = {};
      vRes.data.forEach((v) => {
        if (!map[v.candidate_id]) map[v.candidate_id] = [];
        map[v.candidate_id].push(v.member_name);
      });
      setVoteMap(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAdd() {
    if (!form.title.trim()) return;
    const { data } = await supabase
      .from("song_candidates")
      .insert({ title: form.title.trim(), artist: form.artist.trim(), suggested_by: userName })
      .select()
      .single();
    if (data) setCandidates((prev) => [data, ...prev]);
    setAdding(false);
    setForm({ title: "", artist: "" });
  }

  async function handleDelete(id: string) {
    if (!confirm("이 곡 제안을 삭제할까요?")) return;
    await supabase.from("song_candidates").delete().eq("id", id);
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    setVoteMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  async function handleVote(candidateId: string) {
    if (!userName) return;
    const voted = voteMap[candidateId]?.includes(userName) ?? false;
    if (voted) {
      await supabase.from("song_votes").delete().eq("candidate_id", candidateId).eq("member_name", userName);
      setVoteMap((prev) => ({
        ...prev,
        [candidateId]: (prev[candidateId] || []).filter((n) => n !== userName),
      }));
    } else {
      await supabase.from("song_votes").insert({ candidate_id: candidateId, member_name: userName });
      setVoteMap((prev) => ({
        ...prev,
        [candidateId]: [...(prev[candidateId] || []), userName],
      }));
    }
  }

  const sorted = [...candidates].sort(
    (a, b) => (voteMap[b.id]?.length ?? 0) - (voteMap[a.id]?.length ?? 0)
  );

  return (
    <div className="space-y-4">
      {/* Add button */}
      <button
        onClick={() => setAdding(!adding)}
        className="w-full glass-card rounded-2xl p-4 border-dashed border-[#1a2540] flex items-center gap-3 text-[#6b7fa3] hover:text-[#ff2d9b] hover:border-[#ff2d9b]/30 hover:bg-[#ff2d9b]/5 transition-all group"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        <span className="text-sm">곡 제안하기</span>
      </button>

      {/* Add form */}
      {adding && (
        <div className="glass-card rounded-2xl p-5 border border-[#ff2d9b]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#ff2d9b]">새 곡 제안</h3>
            <button onClick={() => setAdding(false)} className="text-[#6b7fa3] hover:text-[#e8f0ff]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="곡 제목 *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
              className="w-full bg-[#080c14] border border-[#1a2540] rounded-xl px-4 py-3 text-[#e8f0ff] text-sm placeholder:text-[#2a3a5a] focus:outline-none focus:border-[#ff2d9b]/40"
            />
            <input
              type="text"
              placeholder="아티스트"
              value={form.artist}
              onChange={(e) => setForm({ ...form, artist: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full bg-[#080c14] border border-[#1a2540] rounded-xl px-4 py-3 text-[#e8f0ff] text-sm placeholder:text-[#2a3a5a] focus:outline-none focus:border-[#ff2d9b]/40"
            />
            <button
              onClick={handleAdd}
              className="w-full bg-[#ff2d9b] text-white font-bold py-3 rounded-xl hover:bg-[#ff2d9b]/90 transition-all active:scale-95 text-sm"
            >
              제안
            </button>
          </div>
        </div>
      )}

      {/* Candidate list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-[#1a2540] rounded-2xl" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-32 bg-[#1a2540] rounded" />
                  <div className="h-3 w-20 bg-[#1a2540] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Music2 className="w-10 h-10 text-[#1a2540] mx-auto mb-3" />
          <p className="text-[#6b7fa3] text-sm">아직 제안된 곡이 없어요</p>
          <p className="text-[#2a3a5a] text-xs mt-1">하고 싶은 곡을 제안해보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((candidate, idx) => {
            const voters = voteMap[candidate.id] || [];
            const iVoted = voters.includes(userName);
            const count = voters.length;
            const isTop = idx === 0 && count > 0;

            return (
              <div
                key={candidate.id}
                className={cn(
                  "glass-card rounded-2xl p-4 transition-all duration-200 group",
                  isTop && "border border-[#ff2d9b]/25"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Vote button */}
                  <button
                    onClick={() => handleVote(candidate.id)}
                    className={cn(
                      "flex flex-col items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-200 flex-shrink-0 active:scale-95",
                      iVoted
                        ? "bg-[#ff2d9b]/15 border-[#ff2d9b]/40 text-[#ff2d9b]"
                        : "bg-[#0d1421] border-[#1a2540] text-[#2a3a5a] hover:border-[#ff2d9b]/30 hover:text-[#ff2d9b] hover:bg-[#ff2d9b]/5"
                    )}
                  >
                    <Heart className={cn("w-5 h-5 transition-all", iVoted && "fill-[#ff2d9b]")} />
                    <span className={cn("text-xs font-bold mt-0.5", iVoted ? "text-[#ff2d9b]" : "text-[#2a3a5a]")}>
                      {count}
                    </span>
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#e8f0ff] truncate">{candidate.title}</h3>
                        {candidate.artist && (
                          <p className="text-xs text-[#6b7fa3] truncate mt-0.5">{candidate.artist}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className="p-1 text-[#2a3a5a] hover:text-[#ff2d9b] opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-[#2a3a5a]">제안: {candidate.suggested_by}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
