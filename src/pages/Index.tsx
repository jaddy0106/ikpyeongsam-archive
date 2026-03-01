import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import SongCard from "@/components/SongCard";
import { mockSongs } from "@/lib/mockData";

const recentVideos = [
  { id: "v1", title: "aespa 'Supernova' 솔직 리뷰", thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop", date: "2024.06.01" },
  { id: "v2", title: "DAY6 'Welcome to the Show' 명곡 분석", thumbnail: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=225&fit=crop", date: "2024.04.10" },
  { id: "v3", title: "NewJeans 'Ditto' 왜 이렇게 좋을까", thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop", date: "2024.03.10" },
];

const Index = () => {
  const recentSongs = mockSongs.slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* Recent Videos */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">최근 영상</h2>
          <a
            href="https://youtube.com/@ikpyeongsam"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            채널 바로가기 <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recentVideos.map((video) => (
            <div key={video.id} className="group rounded-lg overflow-hidden border border-border bg-card">
              <div className="relative aspect-video bg-secondary overflow-hidden">
                <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/10 transition-colors">
                  <Play className="h-10 w-10 text-background opacity-80" fill="currentColor" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-foreground line-clamp-2">{video.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{video.date}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Songs */}
      <section className="container py-8 border-t border-border">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">최근 평가</h2>
          <Link
            to="/archive"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            전체 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {recentSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
