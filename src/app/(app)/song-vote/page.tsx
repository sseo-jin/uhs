import { cookies } from "next/headers";
import SongVoteList from "@/components/song-vote/SongVoteList";

export default async function SongVotePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("uhs_session");
  let userName = "";
  try {
    if (sessionCookie) {
      const session = JSON.parse(sessionCookie.value);
      userName = session.name || "";
    }
  } catch {}

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#e8f0ff]">곡 투표</h1>
        <p className="text-[#6b7fa3] text-sm mt-0.5">다음 합주 때 하고 싶은 곡에 투표하세요</p>
      </div>
      <SongVoteList userName={userName} />
    </div>
  );
}
