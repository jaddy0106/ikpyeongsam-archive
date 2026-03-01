import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Music, User, Users, Loader2, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { memberInfo } from "@/lib/mockData";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { supabase } from "@/integrations/supabase/client";
import RatingBadge from "@/components/RatingBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import member1Img from "@/assets/member-1.png";
import member2Img from "@/assets/member-2.png";
import member3Img from "@/assets/member-3.png";

const memberAvatars: Record<string, string> = {
  "1": member1Img,
  "2": member2Img,
  "3": member3Img,
};

interface SubscriberReview {
  작성일시: string;
  작성자: string;
  작성자ID: string;
  곡정보: string;
  곡ID: string;
  평점: string;
  한줄평: string;
  좋아요: string;
  coverUrl: string;
}

type SortMode = "likes" | "latest";

const REVIEWS_PER_PAGE = 5;

const SongDetail = () => {
  const { id } = useParams();
  const { data: songs = [], isLoading } = useGoogleSheets();
  const song = songs.find((s) => s.id === id);

  const [subscriberReviews, setSubscriberReviews] = useState<SubscriberReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("likes");
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    supabase.functions
      .invoke("google-sheets", {
        body: { action: "fetch-song-reviews", songId: id },
      })
      .then(({ data, error }) => {
        if (!error && data?.reviews) setSubscriberReviews(data.reviews);
      })
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const sortedReviews = useMemo(() => {
    const reviews = [...subscriberReviews];
    if (sortMode === "likes") {
      reviews.sort((a, b) => {
        const likesDiff = (parseInt(b.좋아요) || 0) - (parseInt(a.좋아요) || 0);
        if (likesDiff !== 0) return likesDiff;
        return new Date(b.작성일시).getTime() - new Date(a.작성일시).getTime();
      });
    } else {
      reviews.sort((a, b) => {
        const dateDiff = new Date(b.작성일시).getTime() - new Date(a.작성일시).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (parseInt(b.좋아요) || 0) - (parseInt(a.좋아요) || 0);
      });
    }
    return reviews;
  }, [subscriberReviews, sortMode]);

  const totalPages = Math.max(1, Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE));
  const pagedReviews = sortedReviews.slice(page * REVIEWS_PER_PAGE, (page + 1) * REVIEWS_PER_PAGE);

  const avgSubscriberRating = subscriberReviews.length > 0
    ? subscriberReviews.reduce((sum, r) => sum + (parseFloat(r.평점) || 0), 0) / subscriberReviews.length
    : 0;

  // Reset page when sort changes
  useEffect(() => setPage(0), [sortMode]);

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">곡을 찾을 수 없습니다</p>
        <Link to="/archive" className="text-primary text-sm hover:underline mt-4 inline-block">
          아카이브로 돌아가기
        </Link>
      </div>
    );
  }

  const avgMemberRating = song.memberRatings?.some((mr) => mr.rating > 0)
    ? song.memberRatings.reduce((sum, r) => sum + r.rating, 0) / song.memberRatings.filter((r) => r.rating > 0).length
    : 0;

  const hasIndividualRatings = song.memberRatings?.some((mr) => mr.rating > 0);

  return (
    <div className="container max-w-2xl py-8">
      <Link to="/archive" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        아카이브
      </Link>

      {/* Song Info */}
      <div className="flex gap-5 mb-2">
        <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
          {song.coverUrl ? (
            <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{song.title}</h1>
          <div className="flex items-center justify-between mt-1">
            <p className="text-muted-foreground">{song.artist}</p>
            <p className="text-xs text-muted-foreground flex-shrink-0">{song.createdAt}</p>
          </div>
          {song.album && <p className="text-sm text-muted-foreground mt-0.5">{song.album}</p>}
          {song.genre && (
            <span className="inline-block mt-3 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              {song.genre}
            </span>
          )}
        </div>
      </div>

      {/* YouTube 링크 - 앨범커버 하단 */}
      {song.youtubeUrl && (
        <div className="mb-8">
          <button
            onClick={() => {
              const url = song.youtubeUrl!.startsWith("http") ? song.youtubeUrl! : `https://${song.youtubeUrl}`;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            className="text-sm text-primary hover:underline"
          >
            ▶ YouTube에서 듣기
          </button>
        </div>
      )}
      {!song.youtubeUrl && <div className="mb-8" />}

      {/* 익평삼 평점 섹션 */}
      <div className="rounded-lg border border-border bg-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-4 w-4 text-primary fill-primary" />
          <span className="text-sm font-bold text-foreground">익평삼 평점</span>
          {hasIndividualRatings ? (
            <RatingBadge rating={avgMemberRating} size="lg" />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>

        <div className="space-y-3 pt-4">
          {(song.memberRatings || [
            { memberId: "1", rating: 0 },
            { memberId: "2", rating: 0 },
            { memberId: "3", rating: 0 },
          ]).map((mr) => (
            <div key={mr.memberId} className="flex items-center gap-3">
              <img
                src={memberAvatars[mr.memberId]}
                alt={memberInfo[mr.memberId as keyof typeof memberInfo]?.name || mr.memberId}
                className="h-12 w-12 rounded-full object-cover bg-secondary"
              />
              {mr.rating > 0 ? (
                <>
                  <RatingBadge rating={mr.rating} size="sm" />
                  {mr.comment && (
                    <span className="text-sm text-muted-foreground truncate">{mr.comment}</span>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">평점 미등록</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 구독자 평점 섹션 */}
      <div className="rounded-lg border border-border bg-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">구독자 평점</span>
          {avgSubscriberRating > 0 ? (
            <RatingBadge rating={avgSubscriberRating} size="lg" />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{subscriberReviews.length}명 참여</span>
        </div>

        {/* 필터 */}
        {subscriberReviews.length > 0 && (
          <div className="flex gap-1.5 mb-4">
            <button
              onClick={() => setSortMode("likes")}
              className={cn(
                "text-xs px-3 py-1 rounded-full border transition-colors",
                sortMode === "likes"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              좋아요순
            </button>
            <button
              onClick={() => setSortMode("latest")}
              className={cn(
                "text-xs px-3 py-1 rounded-full border transition-colors",
                sortMode === "latest"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              최신순
            </button>
          </div>
        )}

        {reviewsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : pagedReviews.length > 0 ? (
          <>
            <div className="space-y-2">
              {pagedReviews.map((review, i) => {
                const rating = parseFloat(review.평점) || 0;
                const likes = parseInt(review.좋아요) || 0;
                return (
                  <div key={`${review.작성자ID}-${i}`} className="flex items-start gap-3 rounded-lg border border-border bg-background/50 p-3">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{review.작성자}</span>
                        <RatingBadge rating={rating} size="sm" />
                      </div>
                      {review.한줄평 && (
                        <p className="text-sm text-muted-foreground mt-1">{review.한줄평}</p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground/60">{review.작성일시}</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          <span className="text-xs">{likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        i === page ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      )}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">아직 작성된 구독자 리뷰가 없습니다</p>
        )}
      </div>
    </div>
  );
};

export default SongDetail;