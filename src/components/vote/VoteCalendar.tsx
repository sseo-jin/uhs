"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Users, Check } from "lucide-react";
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
  const [allMembers, setAllMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // saved = what's currently in DB, used to compute diff on save
  const savedVotesRef = useRef<Set<string>>(new Set());
  const myVotesRef = useRef<Set<string>>(new Set());

  const hasChanges = (() => {
    const saved = savedVotesRef.current;
    const current = myVotesRef.current;
    if (saved.size !== current.size) return true;
    for (const d of current) if (!saved.has(d)) return true;
    return false;
  })();

  const fetchVotes = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    const [votesRes, membersRes] = await Promise.all([
      supabase.from("votes").select("date, members(name)").eq("year", year).eq("month", month),
      supabase.from("members").select("name").order("name"),
    ]);

    const map: VoteMap = {};
    const mine = new Set<string>();

    if (votesRes.data) {
      votesRes.data.forEach((v) => {
        const memberName = (v.members as unknown as { name: string } | null)?.name;
        if (!map[v.date]) map[v.date] = [];
        if (memberName) {
          map[v.date].push(memberName);
          if (memberName === userName) mine.add(v.date);
        }
      });
    }

    if (membersRes.data) setAllMembers(membersRes.data.map((m) => m.name));

    setVoteMap(map);
    setMyVotes(new Set(mine));
    myVotesRef.current = new Set(mine);
    savedVotesRef.current = new Set(mine);
    setMaxCount(Math.max(0, ...Object.values(map).map((m) => m.length)));
    setLoading(false);
  }, [year, month, userName]);

  useEffect(() => { fetchVotes(); }, [fetchVotes]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const { data: member } = await supabase
        .from("members").select("id").eq("name", userName).single();
      if (!member) {
        throw new Error(`'${userName}'이(가) 멤버 목록에 없어요. 멤버 페이지에서 먼저 등록해주세요.`);
      }

      const saved = savedVotesRef.current;
      const current = myVotesRef.current;

      const toAdd = [...current].filter(d => !saved.has(d));
      const toRemove = [...saved].filter(d => !current.has(d));

      await Promise.all([
        toAdd.length > 0 && supabase.from("votes").upsert(
          toAdd.map(date => ({ member_id: member.id, date, year, month })),
          { onConflict: "member_id,date" }
        ),
        ...toRemove.map(date =>
          supabase.from("votes").delete().eq("member_id", member.id).eq("date", date)
        ),
      ]);

      savedVotesRef.current = new Set(current);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "저장에 실패했어요. 다시 시도해주세요.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  function toggleDate(dateStr: string) {
    const next = new Set(myVotesRef.current);
    const isSelected = next.has(dateStr);
    if (isSelected) next.delete(dateStr);
    else next.add(dateStr);
    myVotesRef.current = next;

    setMyVotes(new Set(next));
    setVoteMap((prev) => {
      const updated = { ...prev };
      if (isSelected) {
        updated[dateStr] = (updated[dateStr] || []).filter(n => n !== userName);
        if (updated[dateStr].length === 0) delete updated[dateStr];
      } else {
        updated[dateStr] = [...(updated[dateStr] || []), userName];
      }
      setMaxCount(Math.max(0, ...Object.values(updated).map(m => m.length)));
      return updated;
    });
  }


  const getCellOpacity = (count: number): string => {
    if (maxCount === 0 || count === 0) return "0";
    const ratio = count / maxCount;
    if (ratio >= 1) return "0.85";
    if (ratio >= 0.75) return "0.6";
    if (ratio >= 0.5) return "0.4";
    if (ratio >= 0.25) return "0.25";
    return "0.12";
  };

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

  const sortedDates = Object.entries(voteMap)
    .filter(([, members]) => members.length > 0)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5);

  const votedAny = new Set(Object.values(voteMap).flat());
  const notVotedAtAll = allMembers.filter((m) => !votedAny.has(m));

  return (
    <div className="space-y-4">
      {/* Calendar card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2540]">
          <button onClick={prevMonth}
            className="p-2 rounded-xl text-[#6b7fa3] hover:text-[#38d1f7] hover:bg-[#38d1f7]/10 transition-all active:scale-90">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-[#e8f0ff]">
            {year}년 {MONTHS_KR[month - 1]}
          </h2>
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
          <div className="grid grid-cols-7">
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
                    isValid && "cursor-pointer calendar-cell active:scale-95",
                    !isValid && "opacity-0",
                    isTopDate && "ring-1 ring-inset ring-[#38d1f7]/40"
                  )}
                  onClick={isValid ? () => toggleDate(dateStr) : undefined}
                >
                  {isValid && count > 0 && (
                    <div
                      className="absolute inset-0 bg-[#38d1f7] transition-all duration-300"
                      style={{ opacity }}
                    />
                  )}
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

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className={cn(
          "w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200",
          hasChanges
            ? "bg-[#39ff88] text-[#080c14] hover:bg-[#39ff88]/90 active:scale-[0.98] glow-green"
            : "bg-[#0d1421] border border-[#1a2540] text-[#2a3a5a] cursor-not-allowed"
        )}
      >
        <Check className="w-4 h-4" />
        {saving ? "저장 중..." : hasChanges ? "저장하기" : "저장됨"}
      </button>

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
      {(sortedDates.length > 0 || notVotedAtAll.length > 0) && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1a2540]">
            <h3 className="text-sm font-semibold text-[#e8f0ff]">투표 현황</h3>
          </div>

          {sortedDates.length > 0 && (
            <div className="divide-y divide-[#1a2540]">
              {sortedDates.map(([date, voters], idx) => {
                const d = new Date(date + "T00:00:00");
                const days = ["일", "월", "화", "수", "목", "금", "토"];
                const label = `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
                const absent = allMembers.filter((m) => !voters.includes(m));
                const isTop = idx === 0;

                return (
                  <div key={date} className={cn("px-5 py-4", isTop && "bg-[#38d1f7]/5")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isTop && <span className="text-[10px] font-bold text-[#38d1f7] bg-[#38d1f7]/15 px-2 py-0.5 rounded-full">최다</span>}
                        <span className={cn("text-sm font-semibold", isTop ? "text-[#e8f0ff]" : "text-[#a0b0d0]")}>
                          {label}
                        </span>
                      </div>
                      <span className={cn("text-sm font-bold", isTop ? "text-[#39ff88]" : "text-[#6b7fa3]")}>
                        {voters.length}/{allMembers.length || voters.length}명
                      </span>
                    </div>

                    {/* 가능 */}
                    {voters.length > 0 && (
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-[10px] text-[#39ff88] font-medium w-8 pt-0.5 flex-shrink-0">가능</span>
                        <div className="flex flex-wrap gap-1">
                          {voters.map((name) => (
                            <span key={name} className={cn(
                              "text-[11px] px-2 py-0.5 rounded-full border font-medium",
                              name === userName
                                ? "bg-[#39ff88]/20 border-[#39ff88]/40 text-[#39ff88]"
                                : "bg-[#39ff88]/10 border-[#39ff88]/20 text-[#39ff88]"
                            )}>
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 미응답 */}
                    {absent.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] text-[#2a3a5a] font-medium w-8 pt-0.5 flex-shrink-0">미응답</span>
                        <div className="flex flex-wrap gap-1">
                          {absent.map((name) => (
                            <span key={name} className="text-[11px] px-2 py-0.5 rounded-full border border-[#1a2540] bg-[#0d1421] text-[#3a4a6a]">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 이번 달 아예 투표 안 한 멤버 */}
          {notVotedAtAll.length > 0 && (
            <div className="px-5 py-4 border-t border-[#1a2540] bg-[#ff2d9b]/5">
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-[#ff2d9b] font-medium pt-0.5 flex-shrink-0">미투표</span>
                <div className="flex flex-wrap gap-1">
                  {notVotedAtAll.map((name) => (
                    <span key={name} className="text-[11px] px-2 py-0.5 rounded-full border border-[#ff2d9b]/20 bg-[#ff2d9b]/10 text-[#ff2d9b]">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-[#6b7fa3] mt-2">이번 달 아직 투표 안 함</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
