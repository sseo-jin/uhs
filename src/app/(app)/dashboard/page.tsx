import { cookies } from "next/headers";
import NextRehearsalCard from "@/components/dashboard/NextRehearsalCard";
import TopVoteDates from "@/components/dashboard/TopVoteDates";
import QuickActions from "@/components/dashboard/QuickActions";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("uhs_session");
  let userName = "멤버";
  try {
    if (sessionCookie) {
      const session = JSON.parse(sessionCookie.value);
      userName = session.name || "멤버";
    }
  } catch {}

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "좋은 아침이에요" : hour < 18 ? "안녕하세요" : "수고하셨어요";

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* Greeting */}
      <div className="pt-1">
        <p className="text-[#6b7fa3] text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-[#e8f0ff]">
          <span className="text-[#39ff88] text-glow-green">{userName}</span>님 👋
        </h1>
      </div>

      {/* Next rehearsal */}
      <NextRehearsalCard userName={userName} />

      {/* Top vote dates */}
      <TopVoteDates />

      {/* Quick actions */}
      <QuickActions />
    </div>
  );
}
