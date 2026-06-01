import { cookies } from "next/headers";
import VoteCalendar from "@/components/vote/VoteCalendar";

export default async function VotePage() {
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
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#e8f0ff]">날짜 투표</h1>
        <p className="text-[#6b7fa3] text-sm mt-0.5">가능한 날짜를 클릭하거나 드래그해서 선택하세요</p>
      </div>
      <VoteCalendar initialYear={now.getFullYear()} initialMonth={now.getMonth() + 1} userName={userName} />
    </div>
  );
}
