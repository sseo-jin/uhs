import { cookies } from "next/headers";
import Greeting from "@/components/dashboard/Greeting";
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

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <Greeting userName={userName} />
      <NextRehearsalCard userName={userName} />
      <TopVoteDates />
      <QuickActions />
    </div>
  );
}
