"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Clock, CheckCircle2, XCircle, HelpCircle, Edit2, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatKoreanDate } from "@/lib/utils";
import type { Rehearsal, Attendance } from "@/lib/types";

interface Props {
  userName: string;
}

type AttendStatus = "attending" | "absent" | "undecided";

const STATUS_BTNS: { status: AttendStatus; label: string; icon: typeof CheckCircle2; color: string; active: string }[] = [
  { status: "attending", label: "참석", icon: CheckCircle2, color: "text-[#39ff88]", active: "bg-[#39ff88]/15 border-[#39ff88]/40 text-[#39ff88] glow-green" },
  { status: "absent", label: "불참", icon: XCircle, color: "text-[#ff2d9b]", active: "bg-[#ff2d9b]/15 border-[#ff2d9b]/40 text-[#ff2d9b] glow-pink" },
  { status: "undecided", label: "미정", icon: HelpCircle, color: "text-[#6b7fa3]", active: "bg-[#38d1f7]/10 border-[#38d1f7]/30 text-[#38d1f7]" },
];

export default function NextRehearsalCard({ userName }: Props) {
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [myStatus, setMyStatus] = useState<AttendStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [form, setForm] = useState({ date: "", time: "", location: "", notes: "" });

  const fetchRehearsal = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("rehearsals")
      .select("*")
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(1)
      .single();

    if (data) {
      setRehearsal(data);
      setForm({ date: data.date, time: data.time, location: data.location, notes: data.notes || "" });
      fetchAttendance(data.id);
    }
    setLoading(false);
  }, []);

  const fetchAttendance = async (rehearsalId: string) => {
    const { data } = await supabase
      .from("attendance")
      .select("*, members(name, role)")
      .eq("rehearsal_id", rehearsalId);

    if (data) {
      setAttendance(data);
      const mine = data.find((a) => (a.members as unknown as { name: string } | null)?.name === userName);
      if (mine) setMyStatus(mine.status);
    }
  };

  useEffect(() => { fetchRehearsal(); }, [fetchRehearsal]);

  async function handleAttend(status: AttendStatus) {
    if (!rehearsal) return;
    setMyStatus(status);

    // Upsert via member name lookup
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("name", userName)
      .single();

    if (!member) return;

    await supabase.from("attendance").upsert({
      rehearsal_id: rehearsal.id,
      member_id: member.id,
      status,
    }, { onConflict: "rehearsal_id,member_id" });

    fetchAttendance(rehearsal.id);
  }

  async function handleSaveRehearsal() {
    if (rehearsal) {
      await supabase.from("rehearsals").update(form).eq("id", rehearsal.id);
    } else {
      await supabase.from("rehearsals").insert(form);
    }
    setEditing(false);
    fetchRehearsal();
  }

  const attendingCount = attendance.filter((a) => a.status === "attending").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-5 animate-pulse">
        <div className="h-5 w-32 bg-[#1a2540] rounded mb-3" />
        <div className="h-8 w-48 bg-[#1a2540] rounded mb-2" />
        <div className="h-4 w-40 bg-[#1a2540] rounded" />
      </div>
    );
  }

  if (!rehearsal && !editing) {
    return (
      <div className="glass-card rounded-2xl p-5 border-dashed border-[#1a2540]">
        <div className="text-center py-4">
          <p className="text-[#6b7fa3] text-sm mb-3">다음 합주가 아직 등록되지 않았어요</p>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#38d1f7]/10 border border-[#38d1f7]/30 text-[#38d1f7] rounded-xl text-sm hover:bg-[#38d1f7]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            합주 등록하기
          </button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="glass-card rounded-2xl p-5 border border-[#38d1f7]/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#38d1f7] font-semibold">합주 일정 {rehearsal ? "수정" : "등록"}</h3>
          <button onClick={() => setEditing(false)} className="text-[#6b7fa3] hover:text-[#e8f0ff]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6b7fa3] mb-1 block">날짜</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-[#080c14] border border-[#1a2540] rounded-lg px-3 py-2 text-[#e8f0ff] text-sm focus:outline-none focus:border-[#38d1f7]/60" />
            </div>
            <div>
              <label className="text-xs text-[#6b7fa3] mb-1 block">시간</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full bg-[#080c14] border border-[#1a2540] rounded-lg px-3 py-2 text-[#e8f0ff] text-sm focus:outline-none focus:border-[#38d1f7]/60" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#6b7fa3] mb-1 block">장소</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="홍대 스튜디오 A"
              className="w-full bg-[#080c14] border border-[#1a2540] rounded-lg px-3 py-2 text-[#e8f0ff] text-sm focus:outline-none focus:border-[#38d1f7]/60" />
          </div>
          <div>
            <label className="text-xs text-[#6b7fa3] mb-1 block">메모 (선택)</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="준비사항 등"
              className="w-full bg-[#080c14] border border-[#1a2540] rounded-lg px-3 py-2 text-[#e8f0ff] text-sm focus:outline-none focus:border-[#38d1f7]/60" />
          </div>
          <button onClick={handleSaveRehearsal}
            className="w-full bg-[#38d1f7] text-[#080c14] font-bold py-2.5 rounded-xl hover:bg-[#38d1f7]/90 glow-blue transition-all active:scale-95 text-sm">
            저장
          </button>
        </div>
      </div>
    );
  }

  const dateObj = new Date(`${rehearsal!.date}T${rehearsal!.time}`);

  return (
    <div className="glass-card rounded-2xl p-5 border border-[#38d1f7]/15 relative overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#38d1f7]/60 to-transparent" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[#6b7fa3] text-xs font-medium uppercase tracking-wider mb-1">다음 합주</p>
          <h2 className="text-xl font-bold text-[#e8f0ff]">{formatKoreanDate(dateObj)}</h2>
        </div>
        <button onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-[#6b7fa3] hover:text-[#38d1f7] hover:bg-[#38d1f7]/10 transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-5">
        <div className="flex items-center gap-1.5 text-sm text-[#6b7fa3]">
          <Clock className="w-3.5 h-3.5 text-[#38d1f7]" />
          <span>{rehearsal!.time}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-[#6b7fa3]">
          <MapPin className="w-3.5 h-3.5 text-[#38d1f7]" />
          <span>{rehearsal!.location}</span>
        </div>
      </div>

      {/* Attendance buttons */}
      <div className="flex gap-2 mb-4">
        {STATUS_BTNS.map(({ status, label, icon: Icon, active }) => (
          <button
            key={status}
            onClick={() => handleAttend(status)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all duration-200 active:scale-95",
              myStatus === status ? active : "border-[#1a2540] text-[#6b7fa3] hover:border-[#2a3a5a] hover:text-[#e8f0ff]"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Attendance summary + roster */}
      {attendance.length > 0 && (() => {
        const attending = attendance.filter((a) => a.status === "attending");
        const absent = attendance.filter((a) => a.status === "absent");
        const undecided = attendance.filter((a) => a.status === "undecided");
        return (
          <div className="space-y-2.5">
            {/* Counts */}
            <div className="flex items-center gap-3 text-xs text-[#6b7fa3]">
              <span className="text-[#39ff88]">참석 {attendingCount}명</span>
              <span>·</span>
              <span className="text-[#ff2d9b]">불참 {absentCount}명</span>
              <span>·</span>
              <span>미정 {undecided.length}명</span>
            </div>
            {/* Name roster */}
            <div className="space-y-1.5">
              {[
                { list: attending, color: "text-[#39ff88] bg-[#39ff88]/10 border-[#39ff88]/20" },
                { list: absent,    color: "text-[#ff2d9b] bg-[#ff2d9b]/10 border-[#ff2d9b]/20" },
                { list: undecided, color: "text-[#6b7fa3] bg-[#1a2540] border-[#1a2540]" },
              ].map(({ list, color }) =>
                list.length > 0 ? (
                  <div key={color} className="flex flex-wrap gap-1">
                    {list.map((a) => (
                      <span
                        key={a.id}
                        className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", color)}
                      >
                        {(a.member as unknown as { name: string } | null)?.name ?? "알 수 없음"}
                      </span>
                    ))}
                  </div>
                ) : null
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
