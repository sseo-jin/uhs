import SongList from "@/components/songs/SongList";

export default function SongsPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#e8f0ff]">합주 곡 관리</h1>
        <p className="text-[#6b7fa3] text-sm mt-0.5">현재 연습 중인 곡들을 관리하세요</p>
      </div>
      <SongList />
    </div>
  );
}
