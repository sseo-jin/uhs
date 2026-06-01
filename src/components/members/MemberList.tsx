"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Member } from "@/lib/types";

const ROLES = ["보컬", "기타", "베이스", "드럼", "키보드", "멀티", "직접 입력"];
const ROLE_COLORS: Record<string, string> = {
  "보컬": "text-[#ff2d9b] bg-[#ff2d9b]/10 border-[#ff2d9b]/20",
  "기타": "text-[#38d1f7] bg-[#38d1f7]/10 border-[#38d1f7]/20",
  "베이스": "text-[#39ff88] bg-[#39ff88]/10 border-[#39ff88]/20",
  "드럼": "text-[#f7a838] bg-[#f7a838]/10 border-[#f7a838]/20",
  "키보드": "text-[#a838f7] bg-[#a838f7]/10 border-[#a838f7]/20",
  "멀티": "text-[#6b7fa3] bg-[#6b7fa3]/10 border-[#6b7fa3]/20",
};

export default function MemberList({ isAdmin }: { isAdmin: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", role: ROLES[0] });
  const [customRole, setCustomRole] = useState("");

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from("members").select("*").order("name");
    if (data) setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function handleAdd() {
    if (!form.name.trim()) return;
    const role = form.role === "직접 입력" ? customRole.trim() : form.role;
    if (!role) return;
    const { data } = await supabase.from("members").insert({
      name: form.name.trim(),
      role,
    }).select().single();
    if (data) setMembers((prev) => [...prev, data]);
    setAdding(false);
    setForm({ name: "", role: ROLES[0] });
    setCustomRole("");
  }

  async function handleDelete(id: string) {
    if (!confirm("이 멤버를 삭제할까요?")) return;
    await supabase.from("members").delete().eq("id", id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-3">
      {isAdmin && (
      <button
        onClick={() => setAdding(!adding)}
        className="w-full glass-card rounded-2xl p-4 border-dashed border-[#1a2540] flex items-center gap-3 text-[#6b7fa3] hover:text-[#38d1f7] hover:border-[#38d1f7]/30 hover:bg-[#38d1f7]/5 transition-all group"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        <span className="text-sm">멤버 추가</span>
      </button>
      )}

      {isAdmin && adding && (
        <div className="glass-card rounded-2xl p-5 border border-[#38d1f7]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#38d1f7]">새 멤버</h3>
            <button onClick={() => { setAdding(false); setCustomRole(""); }} className="text-[#6b7fa3] hover:text-[#e8f0ff]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text" placeholder="이름 *" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full bg-[#080c14] border border-[#1a2540] rounded-xl px-4 py-3 text-[#e8f0ff] text-sm placeholder:text-[#2a3a5a] focus:outline-none focus:border-[#38d1f7]/60"
            />
            <select
              value={form.role}
              onChange={(e) => { setForm({ ...form, role: e.target.value }); setCustomRole(""); }}
              className="w-full bg-[#080c14] border border-[#1a2540] rounded-xl px-4 py-3 text-[#e8f0ff] text-sm focus:outline-none focus:border-[#38d1f7]/60"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {form.role === "직접 입력" && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="악기/포지션 입력 (예: 바이올린)"
                autoFocus
                className="w-full bg-[#080c14] border border-[#38d1f7]/40 rounded-xl px-4 py-3 text-[#e8f0ff] text-sm placeholder:text-[#2a3a5a] focus:outline-none focus:border-[#38d1f7]/60"
              />
            )}
            <button onClick={handleAdd}
              className="w-full bg-[#38d1f7] text-[#080c14] font-bold py-3 rounded-xl hover:bg-[#38d1f7]/90 glow-blue transition-all active:scale-95 text-sm">
              추가
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1a2540] rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[#1a2540] rounded" />
                  <div className="h-3 w-16 bg-[#1a2540] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <User className="w-10 h-10 text-[#1a2540] mx-auto mb-3" />
          <p className="text-[#6b7fa3] text-sm">멤버를 추가해보세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const colorClass = ROLE_COLORS[member.role] || ROLE_COLORS["멀티"];
            const initial = member.name.charAt(0);
            return (
              <div key={member.id} className="glass-card rounded-2xl p-4 group flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-lg font-bold flex-shrink-0 ${colorClass}`}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#e8f0ff]">{member.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border mt-0.5 inline-block ${colorClass}`}>
                    {member.role}
                  </span>
                </div>
                {isAdmin && <button
                  onClick={() => handleDelete(member.id)}
                  className="p-2 text-[#2a3a5a] hover:text-[#ff2d9b] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
