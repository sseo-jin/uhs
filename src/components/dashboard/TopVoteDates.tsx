"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatKoreanDate } from "@/lib/utils";
import Link from "next/link";

interface VoteEntry {
  date: string;
  count: number;
  members: string[];
}

export default function TopVoteDates() {
  const [topDates, setTopDates] = useState<VoteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fetchVotes = useCallback(async () => {
    const { data } = await supabase
      .from("votes")
      .select("date, members(name)")
      .eq("year", year)
      .eq("month", month);

    if (data) {
      const map: Record<string, string[]> = {};
      data.forEach((v) => {
        if (!map[v.date]) map[v.date] = [];
        const memberName = (v.members as unknown as { name: string } | null)?.name;
        if (memberName) map[v.date].push(memberName);
      });

      const sorted = Object.entries(map)
        .map(([date, members]) => ({ date, count: members.length, members }))
        .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))
        .slice(0, 5);

      setTopDates(sorted);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchVotes(); }, [fetchVotes]);

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff2d9b]/50 to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#ff2d9b]" />
          <h3 className="font-semibold text-[#e8f0ff] text-sm">이번 달 투표 현황</h3>
        </div>
        <Link href="/vote"
          className="text-xs text-[#6b7fa3] hover:text-[#38d1f7] transition-colors">
          전체 보기 →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-[#1a2540] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : topDates.length === 0 ? (
        <div className="text-center py-4">
          <CalendarDays className="w-8 h-8 text-[#1a2540] mx-auto mb-2" />
          <p className="text-[#6b7fa3] text-sm">아직 투표가 없어요</p>
          <Link href="/vote"
            className="text-xs text-[#38d1f7] hover:underline mt-1 inline-block">
            날짜 투표하러 가기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {topDates.map((entry, idx) => {
            const isTop = idx === 0;
            return (
              <div
                key={entry.date}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                  isTop ? "bg-[#38d1f7]/10 border border-[#38d1f7]/20" : "bg-[#0d1421]"
                }`}
              >
                <span className={`text-xs font-bold w-5 text-center ${isTop ? "text-[#38d1f7]" : "text-[#6b7fa3]"}`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isTop ? "text-[#e8f0ff]" : "text-[#a0b0d0]"}`}>
                    {formatKoreanDate(entry.date)}
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${isTop ? "text-[#39ff88]" : "text-[#6b7fa3]"}`}>
                  <span>{entry.count}명</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
