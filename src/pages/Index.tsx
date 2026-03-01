import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Play, Loader2 } from "lucide-react";
import SongCard from "@/components/SongCard";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { supabase } from "@/integrations/supabase/client";

type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
  description?: string;
};

const SONGS_PER_PAGE = 5;
const MAX_PAGES = 3;

const Index = () => {
  const { data: sheetSongs, isLoading: songsLoading } = useGoogleSheets();
  const recentSongs = [...(sheetSongs || [])].reverse().slice(0, SONGS_PER_PAGE * MAX_PAGES);
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.min(Math.ceil(recentSongs.length / SONGS_PER_PAGE), MAX_PAGES);
  const [sliding, setSliding] = useState<"left" | "right" | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const goToPage = (dir: "left" | "right") => {
    const next = dir === "right" ? currentPage + 1 : currentPage - 1;
    if (next < 0 || next >= totalPages) return;
    setSliding(dir);
    setTimeout(() => {
      setCurrentPage(next);
      setSliding(null);
    }, 300);
  };

  const pageSongs = recentSongs.slice(currentPage * SONGS_PER_PAGE, (currentPage + 1) * SONGS_PER_PAGE);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("youtube-videos", {
          body: null,
        });
        if (error) throw error;
        if (data?.success && data.videos) {
          setVideos(data.videos.slice(0, 4));
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">최근 영상</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">최근 평가</h2>
          <Link
            to="/archive"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            전체 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {songsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="relative flex items-center gap-2">
            {/* Left Arrow */}
            <button
              onClick={() => goToPage("left")}
              disabled={currentPage === 0}
              className="flex-shrink-0 p-2 rounded-full border border-border bg-card text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Cards */}
            <div className="flex-1 overflow-hidden">
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 transition-all duration-300 ease-in-out ${
                  sliding === "right" ? "opacity-0 -translate-x-4" :
                  sliding === "left" ? "opacity-0 translate-x-4" :
                  "opacity-100 translate-x-0"
                }`}
              >
                {pageSongs.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => goToPage("right")}
              disabled={currentPage >= totalPages - 1}
              className="flex-shrink-0 p-2 rounded-full border border-border bg-card text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Page Dots */}
        {totalPages > 1 && !songsLoading && (
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: totalPages }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === currentPage ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
