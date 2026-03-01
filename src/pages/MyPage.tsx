import { User, Music, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import SongCard from "@/components/SongCard";
import { mockUserReviews } from "@/lib/mockData";

const MyPage = () => {
  const isLoggedIn = false;

  if (!isLoggedIn) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-1">로그인이 필요합니다</h1>
        <p className="text-sm text-muted-foreground mb-5">Google 계정으로 로그인하여 나만의 리뷰를 관리하세요</p>
        <Button className="font-medium">Google 로그인</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">음악팬123</h1>
          <p className="text-xs text-muted-foreground">등록한 리뷰 {mockUserReviews.length}곡</p>
        </div>
      </div>

      <h2 className="text-base font-bold text-foreground mb-3">내 리뷰</h2>
      <div className="flex flex-col gap-2">
        {mockUserReviews.map((song) => (
          <SongCard key={song.id} song={song} variant="list" />
        ))}
      </div>
    </div>
  );
};

export default MyPage;
