"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Guitar, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-[#38d1f7] opacity-5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full bg-[#ff2d9b] opacity-5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0d1421] border border-[#38d1f7]/30 glow-blue mb-4">
            <Guitar className="w-8 h-8 text-[#38d1f7]" />
          </div>
          <h1 className="text-3xl font-bold text-[#38d1f7] text-glow-blue tracking-tight">UHS</h1>
          <p className="text-[#6b7fa3] text-sm mt-1">엄희성 밴드 관리 시스템</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-[#6b7fa3] mb-1.5 font-medium uppercase tracking-wider">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              required
              className="w-full bg-[#080c14] border border-[#1a2540] rounded-lg px-4 py-3 text-[#e8f0ff] placeholder:text-[#2a3a5a] focus:outline-none focus:border-[#38d1f7]/60 focus:ring-1 focus:ring-[#38d1f7]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-[#6b7fa3] mb-1.5 font-medium uppercase tracking-wider">
              <Shield className="inline w-3 h-3 mr-1" />
              밴드 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              className="w-full bg-[#080c14] border border-[#1a2540] rounded-lg px-4 py-3 text-[#e8f0ff] placeholder:text-[#2a3a5a] focus:outline-none focus:border-[#38d1f7]/60 focus:ring-1 focus:ring-[#38d1f7]/20 transition-all"
            />
          </div>

          {error && (
            <p className="text-[#ff2d9b] text-sm bg-[#ff2d9b]/10 border border-[#ff2d9b]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#38d1f7] text-[#080c14] font-bold py-3 rounded-lg hover:bg-[#38d1f7]/90 glow-blue transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "확인 중..." : "입장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
