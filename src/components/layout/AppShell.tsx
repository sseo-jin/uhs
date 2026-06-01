"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Music2,
  Users,
  LogOut,
  Guitar,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "대시보드", short: "홈" },
  { href: "/vote", icon: CalendarDays, label: "날짜 투표", short: "날짜" },
  { href: "/song-vote", icon: Heart, label: "곡 투표", short: "곡 투표" },
  { href: "/songs", icon: Music2, label: "합주 곡 관리", short: "합주 곡" },
  { href: "/members", icon: Users, label: "멤버", short: "멤버" },
];

interface AppShellProps {
  children: React.ReactNode;
  userName: string;
}

export default function AppShell({ children, userName }: AppShellProps) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#080c14]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-[#0d1421] border-r border-[#1a2540]">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-6 border-b border-[#1a2540]">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#38d1f7]/10 border border-[#38d1f7]/30">
              <Guitar className="w-5 h-5 text-[#38d1f7]" />
            </div>
            <div>
              <div className="text-[#38d1f7] font-bold text-lg leading-none text-glow-blue">UHS</div>
              <div className="text-[#6b7fa3] text-xs mt-0.5">엄희성 밴드</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-[#38d1f7]/10 text-[#38d1f7] border border-[#38d1f7]/20"
                      : "text-[#6b7fa3] hover:text-[#e8f0ff] hover:bg-[#1a2540]/60"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-[#38d1f7]")} />
                  {label}
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#38d1f7] neon-pulse" />}
                </Link>
              );
            })}
          </nav>

          {/* User + Logout */}
          <div className="px-3 py-4 border-t border-[#1a2540]">
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg bg-[#39ff88]/10 border border-[#39ff88]/30 flex items-center justify-center text-xs font-bold text-[#39ff88]">
                {userName.charAt(0)}
              </div>
              <span className="text-sm text-[#e8f0ff] font-medium flex-1 truncate">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-[#6b7fa3] hover:text-[#ff2d9b] hover:bg-[#ff2d9b]/10 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#1a2540] bg-[#0d1421]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#38d1f7]/10 border border-[#38d1f7]/30">
              <Guitar className="w-4 h-4 text-[#38d1f7]" />
            </div>
            <span className="text-[#38d1f7] font-bold text-glow-blue">UHS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b7fa3]">{userName}</span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[#6b7fa3] hover:text-[#ff2d9b] hover:bg-[#ff2d9b]/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto grid-bg pb-20 md:pb-0">
          <div className="page-enter">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1421] border-t border-[#1a2540] flex items-stretch">
        {NAV_ITEMS.map(({ href, icon: Icon, short }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
                active ? "text-[#38d1f7]" : "text-[#2a3a5a]"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-all", active && "drop-shadow-[0_0_6px_#38d1f7]")} />
              <span className={cn("text-[10px] font-medium", active ? "text-[#38d1f7]" : "text-[#2a3a5a]")}>
                {short}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
