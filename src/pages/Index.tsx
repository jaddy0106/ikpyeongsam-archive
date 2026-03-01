import { Link } from "react-router-dom";
import { ArrowRight, Star, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SongCard from "@/components/SongCard";
import { mockSongs } from "@/lib/mockData";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { icon: BarChart3, label: "리뷰된 곡", value: "150+" },
  { icon: Star, label: "평균 평점", value: "7.2" },
  { icon: Users, label: "구독자 리뷰", value: "500+" },
];

const Index = () => {
  const topSongs = mockSongs.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="container relative z-10 flex flex-col items-center justify-center py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 mb-6 animate-fade-in">
            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
            <span className="text-xs font-medium text-primary">YouTube 음악평론 채널</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] animate-fade-in-up">
            <span className="text-gradient-gold">익평삼</span>
            <br />
            <span className="text-foreground">음악 아카이브</span>
          </h1>
          <p className="mt-6 max-w-lg text-muted-foreground text-base md:text-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            채널에서 다뤄진 곡들의 평점을 한눈에 확인하고,
            <br className="hidden sm:block" />
            나만의 음악 리뷰를 남겨보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/archive">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 px-6">
                아카이브 보기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/add-review">
              <Button size="lg" variant="outline" className="border-border hover:bg-secondary font-semibold px-6">
                리뷰 등록하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="container grid grid-cols-3 divide-x divide-border/50">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 py-8">
              <stat.icon className="h-5 w-5 text-primary mb-1" />
              <span className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Reviews */}
      <section className="container py-16 md:py-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">최근 평가</h2>
            <p className="text-muted-foreground mt-1 text-sm">익평삼이 최근 평가한 곡들</p>
          </div>
          <Link
            to="/archive"
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            전체 보기 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topSongs.map((song, i) => (
            <div key={song.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <SongCard song={song} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
