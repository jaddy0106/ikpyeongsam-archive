import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Play, Loader2, Star, Heart, User } from "lucide-react";
import SongCard from "@/components/SongCard";
import RatingBadge from "@/components/RatingBadge";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { supabase } from "@/integrations/supabase/client";

type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
  description?: string;
};

interface RecentReview {
  id: string;
  user_id: string;
  song_id: string;
  song_info: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  likes_count: number;
  cover_url: string | null;
  created_at: string;
}

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
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

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
        const { data, error } = await supabase.functions.invoke("youtube-videos", { body: null });
        if (error) throw error;
        if (data?.success && data.videos) setVideos(data.videos.slice(0, 4));
      } catch (err) {
        console.error("Failed to fetch YouTube videos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  // Fetch recent reviews from Supabase
  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("user_reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);
        if (!error && data) {
          setRecentReviews(data as unknown as RecentReview[]);
        }
      } catch (err) {
        console.error("Failed to fetch recent reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchRecentReviews();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  const formatReviewDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
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
          <Link to="/archive" className="text-xs text-primary hover:underline flex items-center gap-1">
            전체 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {songsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="relative">
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

            {currentPage > 0 && (
              <button
                onClick={() => goToPage("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground hover:bg-secondary transition-colors shadow-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {currentPage < totalPages - 1 && (
              <button
                onClick={() => goToPage("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground hover:bg-secondary transition-colors shadow-md"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

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

      {/* Recent Reviews */}
      <section className="container py-8 border-t border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">최근 리뷰</h2>
        </div>

        {reviewsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentReviews.length > 0 ? (
          <div className="space-y-2">
            {recentReviews.map((review) => {
              const likes = review.likes_count || 0;
              return (
                <Link
                  key={review.id}
                  to={`/song/${review.song_id}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{review.reviewer_name}</span>
                      <RatingBadge rating={review.rating} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{review.song_info}</p>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-muted-foreground/60">{formatReviewDate(review.created_at)}</span>
                      {likes > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          <span className="text-xs">{likes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">아직 등록된 리뷰가 없습니다</p>
        )}
      </section>
    </div>
  );
};

export default Index;
