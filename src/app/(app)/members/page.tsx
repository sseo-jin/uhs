import { cookies } from "next/headers";
import MemberList from "@/components/members/MemberList";

export default async function MembersPage() {
  const cookieStore = await cookies();
  let isAdmin = false;
  try {
    const session = JSON.parse(cookieStore.get("uhs_session")?.value || "{}");
    isAdmin = session.isAdmin === true;
  } catch {}

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#e8f0ff]">멤버</h1>
        <p className="text-[#6b7fa3] text-sm mt-0.5">밴드 멤버 목록</p>
      </div>
      <MemberList isAdmin={isAdmin} />
    </div>
  );
}
