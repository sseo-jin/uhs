import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SITE_PASSWORD = process.env.SITE_PASSWORD || "uhs2024";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "seojinsarejj";
const SESSION_COOKIE = "uhs_session";

export async function POST(req: NextRequest) {
  const { password, name } = await req.json();

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "이름을 2자 이상 입력해주세요." }, { status: 400 });
  }

  const trimmedName = name.trim();
  const isAdmin = trimmedName === "admin" && password === ADMIN_PASSWORD;
  const isUser = password === SITE_PASSWORD && trimmedName !== "admin";

  if (!isAdmin && !isUser) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify({ name: trimmedName, isAdmin, loggedAt: Date.now() }), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return NextResponse.json({ ok: true, name: trimmedName, isAdmin });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
