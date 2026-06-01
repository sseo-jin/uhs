import Link from "next/link";
import { CalendarDays, Music2, Users, Heart, ChevronRight } from "lucide-react";

const ACTIONS = [
  {
    href: "/vote",
    icon: CalendarDays,
    label: "날짜 투표",
    desc: "이번 달 가능한 날짜 선택",
    color: "text-[#38d1f7]",
    bg: "bg-[#38d1f7]/10",
    border: "border-[#38d1f7]/20",
  },
  {
    href: "/song-vote",
    icon: Heart,
    label: "곡 투표",
    desc: "하고 싶은 곡에 투표",
    color: "text-[#ff2d9b]",
    bg: "bg-[#ff2d9b]/10",
    border: "border-[#ff2d9b]/20",
  },
  {
    href: "/songs",
    icon: Music2,
    label: "합주 곡 관리",
    desc: "곡 목록 및 악보 공유",
    color: "text-[#39ff88]",
    bg: "bg-[#39ff88]/10",
    border: "border-[#39ff88]/20",
  },
  {
    href: "/members",
    icon: Users,
    label: "멤버 목록",
    desc: "밴드 멤버 확인",
    color: "text-[#6b7fa3]",
    bg: "bg-[#6b7fa3]/10",
    border: "border-[#6b7fa3]/20",
  },
];

export default function QuickActions() {
  return (
    <div>
      <h3 className="text-xs font-medium text-[#6b7fa3] uppercase tracking-wider mb-3">빠른 메뉴</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACTIONS.map(({ href, icon: Icon, label, desc, color, bg, border }) => (
          <Link
            key={href}
            href={href}
            className={`glass-card rounded-2xl p-4 border ${border} group hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]`}
          >
            <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-sm font-semibold ${color}`}>{label}</p>
                <p className="text-xs text-[#6b7fa3] mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#2a3a5a] group-hover:text-[#6b7fa3] transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
