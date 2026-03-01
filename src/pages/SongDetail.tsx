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

  const avgMemberRating = song.memberRatings
    ? song.memberRatings.reduce((sum, r) => sum + r.rating, 0) / song.memberRatings.length
    : song.rating;

  const hasRating = avgMemberRating > 0;
  const hasIndividualRatings = song.memberRatings?.some((mr) => mr.rating > 0);

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
          <p className="text-muted-foreground mt-1">{song.artist}</p>
          {song.album && <p className="text-sm text-muted-foreground mt-0.5">{song.album}</p>}
          <p className="text-xs text-muted-foreground mt-1">{song.createdAt}</p>
          {song.genre && (
            <span className="inline-block mt-3 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              {song.genre}
            </span>
          )}
        </div>
      </div>

      {/* 익평삼 평점 섹션 */}
      {hasRating && (
        <div className="rounded-lg border border-border bg-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="text-sm font-bold text-foreground">익평삼 평점</span>
            <RatingBadge rating={avgMemberRating} size="lg" />
          </div>

          {hasIndividualRatings && song.memberRatings && (
            <div className="space-y-3 pt-4">
              {song.memberRatings
                .filter((mr) => mr.rating > 0)
                .map((mr) => (
                  <div key={mr.memberId} className="flex items-center gap-3">
                    <img
                      src={memberAvatars[mr.memberId]}
                      alt={memberInfo[mr.memberId as keyof typeof memberInfo]?.name || mr.memberId}
                      className="h-12 w-12 rounded-full object-cover bg-secondary"
                    />
                    <RatingBadge rating={mr.rating} size="sm" />
                    {mr.comment && (
                      <span className="text-sm text-muted-foreground truncate">{mr.comment}</span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

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
