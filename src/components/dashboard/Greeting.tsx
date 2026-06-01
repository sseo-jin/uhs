"use client";

interface Props {
  userName: string;
}

export default function Greeting({ userName }: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "좋은 아침이에요" : hour < 18 ? "안녕하세요" : "수고하셨어요";

  return (
    <div className="pt-1">
      <p className="text-[#6b7fa3] text-sm">{greeting},</p>
      <h1 className="text-2xl font-bold text-[#e8f0ff]">
        <span className="text-[#39ff88] text-glow-green">{userName}</span>님 👋
      </h1>
    </div>
  );
}
