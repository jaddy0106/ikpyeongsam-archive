import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Loader2 } from "lucide-react";
import SongCard from "@/components/SongCard";
import { mockSongs } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
  description?: string;
};

const Index = () => {
  const recentSongs = mockSongs.slice(0, 6);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("youtube-videos", {
          body: null,
        });
        if (error) throw error;
        if (data?.success && data.videos) {
          setVideos(data.videos.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch YouTube videos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Recent Videos */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">최근 영상</h2>
          <a
            href="https://www.youtube.com/@anonymouscritics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            채널 바로가기 <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {videos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg overflow-hidden border border-border bg-card"
              >
                <div className="relative aspect-video bg-secondary overflow-hidden">
                  <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/10 transition-colors">
                    <Play className="h-10 w-10 text-background opacity-80" fill="currentColor" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2">{video.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(video.date)}</p>
                </div>
              </a>
            ))}
          </div>
        )}
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
