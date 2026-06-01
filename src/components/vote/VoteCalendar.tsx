"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getDaysInMonth, getFirstDayOfMonth, toDateString } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  initialYear: number;
  initialMonth: number;
  userName: string;
}

type VoteMap = Record<string, string[]>;

const DAYS_KR = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS_KR = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export default function VoteCalendar({ initialYear, initialMonth, userName }: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [voteMap, setVoteMap] = useState<VoteMap>({});
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [maxCount, setMaxCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove">("add");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const myVotesRef = useRef<Set<string>>(new Set());

  const fetchVotes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("votes")
      .select("date, members(name)")
      .eq("year", year)
      .eq("month", month);

    const map: VoteMap = {};
    const mine = new Set<string>();

    if (data) {
      data.forEach((v) => {
        const memberName = (v.members as unknown as { name: string } | null)?.name;
        if (!map[v.date]) map[v.date] = [];
        if (memberName) {
          map[v.date].push(memberName);
          if (memberName === userName) mine.add(v.date);
        }
      });
    }

    setVoteMap(map);
    setMyVotes(mine);
    myVotesRef.current = mine;
    setMaxCount(Math.max(0, ...Object.values(map).map((m) => m.length)));
    setLoading(false);
  }, [year, month, userName]);

  useEffect(() => { fetchVotes(); }, [fetchVotes]);

  const getCellOpacity = (count: number): string => {
    if (maxCount === 0 || count === 0) return "0";
    const ratio = count / maxCount;
    if (ratio >= 1) return "0.85";
    if (ratio >= 0.75) return "0.6";
    if (ratio >= 0.5) return "0.4";
    if (ratio >= 0.25) return "0.25";
    return "0.12";
  };

  async function saveVote(dateStr: string, action: "add" | "remove") {
    setSaving(true);
    setSaveError(null);
    try {
      const { data: member } = await supabase
        .from("members").select("id").eq("name", userName).single();
      if (!member) {
        throw new Error(`'${userName}'이(가) 멤버 목록에 없어요. 멤버 페이지에서 먼저 등록해주세요.`);
      }
      if (action === "add") {
        const { error } = await supabase.from("votes").upsert(
          [{ member_id: member.id, date: dateStr, year, month }],
          { onConflict: "member_id,date" }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.from("votes")
          .delete().eq("member_id", member.id).eq("date", dateStr);
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "저장에 실패했어요. 다시 시도해주세요.";
      setSaveError(msg);
      fetchVotes();
    } finally {
      setSaving(false);
    }
  }

  function toggleDate(dateStr: string) {
    const isSelected = myVotesRef.current.has(dateStr);

    // Update ref immediately so drag and debounce always see current state
    const nextVotes = new Set(myVotesRef.current);
    if (isSelected) nextVotes.delete(dateStr);
    else nextVotes.add(dateStr);
    myVotesRef.current = nextVotes;

    // Optimistic UI update
    setMyVotes(new Set(nextVotes));
    setVoteMap((prev) => {
      const next = { ...prev };
      if (isSelected) {
        next[dateStr] = (next[dateStr] || []).filter((n) => n !== userName);
        if (next[dateStr].length === 0) delete next[dateStr];
      } else {
        next[dateStr] = [...(next[dateStr] || []), userName];
      }
      setMaxCount(Math.max(0, ...Object.values(next).map((m) => m.length)));
      return next;
    });

    saveVote(dateStr, isSelected ? "remove" : "add");
  }

  // Drag handling
  function handleMouseDown(dateStr: string, e: React.MouseEvent) {
    e.preventDefault();
    const isSelected = myVotesRef.current.has(dateStr);
    setDragMode(isSelected ? "remove" : "add");
    setIsDragging(true);
    applyDrag(dateStr, isSelected ? "remove" : "add");
  }

  function handleMouseEnter(dateStr: string) {
    if (!isDragging) return;
    applyDrag(dateStr, dragMode);
  }

  function applyDrag(dateStr: string, mode: "add" | "remove") {
    const isSelected = myVotesRef.current.has(dateStr);
    if (mode === "add" && isSelected) return;
    if (mode === "remove" && !isSelected) return;
    toggleDate(dateStr);
  }

  useEffect(() => {
    const handleUp = () => {
      if (isDragging) setIsDragging(false);
    };
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  // Summary: top dates
  const sortedDates = Object.entries(voteMap)
    .filter(([, members]) => members.length > 0)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2540]">
          <button onClick={prevMonth}
            className="p-2 rounded-xl text-[#6b7fa3] hover:text-[#38d1f7] hover:bg-[#38d1f7]/10 transition-all active:scale-90">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#e8f0ff]">
              {year}년 {MONTHS_KR[month - 1]}
            </h2>
            {saving && (
              <span className="text-[10px] text-[#6b7fa3] animate-pulse">저장 중...</span>
            )}
          </div>
          <button onClick={nextMonth}
            className="p-2 rounded-xl text-[#6b7fa3] hover:text-[#38d1f7] hover:bg-[#38d1f7]/10 transition-all active:scale-90">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[#1a2540]">
          {DAYS_KR.map((d, i) => (
            <div key={d} className={cn(
              "text-center py-2.5 text-xs font-medium",
              i === 0 ? "text-[#ff2d9b]" : i === 6 ? "text-[#38d1f7]" : "text-[#6b7fa3]"
            )}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-14 border-b border-r border-[#1a2540]/50 animate-pulse bg-[#0d1421]/30" />
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-7 select-none"
            onMouseLeave={() => isDragging && setIsDragging(false)}
          >
            {Array.from({ length: totalCells }).map((_, idx) => {
              const dayNum = idx - firstDay + 1;
              const isValid = dayNum >= 1 && dayNum <= daysInMonth;
              const dayOfWeek = idx % 7;
              const dateStr = isValid ? toDateString(year, month, dayNum) : "";
              const count = isValid ? (voteMap[dateStr]?.length || 0) : 0;
              const isSelected = isValid && myVotes.has(dateStr);
              const opacity = getCellOpacity(count);
              const isTopDate = isValid && count > 0 && count === maxCount;

              return (
                <div
                  key={idx}
                  className={cn(
                    "relative h-14 border-b border-r border-[#1a2540]/40 transition-all duration-150",
                    isValid && "cursor-pointer calendar-cell",
                    !isValid && "opacity-0",
                    isTopDate && "ring-1 ring-inset ring-[#38d1f7]/40"
                  )}
                  onMouseDown={isValid ? (e) => handleMouseDown(dateStr, e) : undefined}
                  onMouseEnter={isValid ? () => handleMouseEnter(dateStr) : undefined}
                  onTouchStart={isValid ? (e) => {
                    e.preventDefault();
                    const isSelected = myVotesRef.current.has(dateStr);
                    setDragMode(isSelected ? "remove" : "add");
                    setIsDragging(true);
                    applyDrag(dateStr, isSelected ? "remove" : "add");
                  } : undefined}
                >
                  {/* Vote fill */}
                  {isValid && count > 0 && (
                    <div
                      className="absolute inset-0 bg-[#38d1f7] transition-all duration-300"
                      style={{ opacity }}
                    />
                  )}

                  {/* My selection indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-[#39ff88] rounded-sm pointer-events-none" />
                  )}

                  {isValid && (
                    <div className="relative z-10 p-1.5 h-full flex flex-col justify-between">
                      <span className={cn(
                        "text-xs font-medium leading-none",
                        dayOfWeek === 0 ? "text-[#ff2d9b]" : dayOfWeek === 6 ? "text-[#38d1f7]" : "text-[#e8f0ff]",
                        count > 0 && "font-bold"
                      )}>
                        {dayNum}
                      </span>
                      {count > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5 text-[#080c14] opacity-80" />
                          <span className="text-[10px] font-bold text-[#080c14] opacity-80">{count}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save error */}
      {saveError && (
        <div className="text-xs text-[#ff2d9b] bg-[#ff2d9b]/10 border border-[#ff2d9b]/20 rounded-xl px-4 py-3">
          {saveError}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[#6b7fa3] px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 border-2 border-[#39ff88] rounded-sm" />
          <span>내 선택</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {["0.15", "0.35", "0.6", "0.85"].map((op) => (
              <div key={op} className="w-3 h-3 bg-[#38d1f7] rounded-sm" style={{ opacity: op }} />
            ))}
          </div>
          <span>투표 많을수록 진함</span>
        </div>
      </div>

      {/* Summary */}
      {sortedDates.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[#e8f0ff] mb-3">투표 요약</h3>
          <div className="space-y-2">
            {sortedDates.map(([date, members], idx) => {
              const d = new Date(date + "T00:00:00");
              const days = ["일", "월", "화", "수", "목", "금", "토"];
              const label = `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
              return (
                <div key={date} className={cn(
                  "flex items-start gap-3 px-3 py-2.5 rounded-xl",
                  idx === 0 ? "bg-[#38d1f7]/10 border border-[#38d1f7]/20" : "bg-[#0d1421]"
                )}>
                  <span className={cn(
                    "text-xs font-bold w-5 flex-shrink-0 text-center mt-0.5",
                    idx === 0 ? "text-[#38d1f7]" : "text-[#6b7fa3]"
                  )}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", idx === 0 ? "text-[#e8f0ff]" : "text-[#a0b0d0]")}>
                      {label}
                    </p>
                    <p className="text-xs text-[#6b7fa3] truncate mt-0.5">
                      {members.join(", ")}
                    </p>
                  </div>
                  <span className={cn("text-sm font-bold flex-shrink-0", idx === 0 ? "text-[#39ff88]" : "text-[#6b7fa3]")}>
                    {members.length}명
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
