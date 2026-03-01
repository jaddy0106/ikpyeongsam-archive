import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Music, User, Users, Loader2 } from "lucide-react";
import { memberInfo } from "@/lib/mockData";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import RatingBadge from "@/components/RatingBadge";
import member1Img from "@/assets/member-1.png";
import member2Img from "@/assets/member-2.png";
import member3Img from "@/assets/member-3.png";

const memberAvatars: Record<string, string> = {
  "1": member1Img,
  "2": member2Img,
  "3": member3Img,
};

const SongDetail = () => {
  const { id } = useParams();
  const { data: songs = [], isLoading } = useGoogleSheets();
  const song = songs.find((s) => s.id === id);

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

  // Mock subscriber reviews (will be replaced with real data later)
  const subscriberReviews: { id: string; user: string; rating: number; text: string }[] = [];
  const avgSubscriberRating = song.subscriberRating ?? 0;
  const subscriberCount = subscriberReviews.length;

  return (
    <div className="container max-w-2xl py-8">
      <Link to="/archive" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        아카이브
      </Link>

      {/* Song Info */}
      <div className="flex gap-5 mb-8">
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

      {/* 익평삼 평점 섹션 - 항상 표시 */}
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

        {/* 개별 출연자 평점 - 항상 3명 표시 */}
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

      {/* 구독자 평점 섹션 - 항상 표시 */}
      <div className="rounded-lg border border-border bg-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">구독자 평점</span>
          {avgSubscriberRating > 0 ? (
            <RatingBadge rating={avgSubscriberRating} size="lg" />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{subscriberCount}명 참여</span>
        </div>

        {subscriberReviews.length > 0 ? (
          <div className="space-y-2">
            {subscriberReviews.map((review) => (
              <div key={review.id} className="flex items-start gap-3 rounded-lg border border-border bg-background/50 p-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{review.user}</span>
                    <RatingBadge rating={review.rating} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{review.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">아직 작성된 구독자 리뷰가 없습니다</p>
        )}
      </div>

      {/* YouTube 링크 */}
      {song.youtubeUrl && (
        <div className="mb-4">
          <a
            href={song.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            ▶ YouTube에서 듣기
          </a>
        </div>
      )}
    </div>
  );
};

export default SongDetail;
