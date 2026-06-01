import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("uhs_session");

  if (!sessionCookie) {
    redirect("/login");
  }

  let userName = "멤버";
  try {
    const session = JSON.parse(sessionCookie.value);
    userName = session.name || "멤버";
  } catch {
    redirect("/login");
  }

  return <AppShell userName={userName}>{children}</AppShell>;
}
