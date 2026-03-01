import { User, Music, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import SongCard from "@/components/SongCard";
import { mockUserReviews } from "@/lib/mockData";

const MyPage = () => {
  const isLoggedIn = false;

  if (!isLoggedIn) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-6">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">로그인이 필요합니다</h1>
        <p className="text-muted-foreground mb-6">Google 계정으로 로그인하여 나만의 리뷰를 관리하세요</p>
        <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
          Google 로그인
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-16">
      {/* Profile */}
      <div className="flex items-center gap-4 mb-10">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">음악팬123</h1>
          <p className="text-sm text-muted-foreground">등록한 리뷰 {mockUserReviews.length}곡</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { icon: Music, label: "등록 곡", value: mockUserReviews.length },
          { icon: Star, label: "평균 평점", value: "8.5" },
          { icon: User, label: "활동일", value: "30일" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-4 text-center">
            <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <h2 className="text-xl font-bold text-foreground mb-4">내 리뷰</h2>
      <div className="flex flex-col gap-2">
        {mockUserReviews.map((song) => (
          <SongCard key={song.id} song={song} variant="list" />
        ))}
      </div>
    </div>
  );
};

export default MyPage;
