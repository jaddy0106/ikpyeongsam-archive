import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Music, User } from "lucide-react";
import { mockSongs, mockUserReviews } from "@/lib/mockData";
import RatingBadge from "@/components/RatingBadge";

const SongDetail = () => {
  const { id } = useParams();
  const allSongs = [...mockSongs, ...mockUserReviews];
  const song = allSongs.find((s) => s.id === id);

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

  // Mock subscriber reviews for this song
  const subscriberReviews = [
    { id: "sr1", user: "음악팬123", rating: 4.0, text: "정말 좋은 곡이에요! 반복 재생 중" },
    { id: "sr2", user: "멜로디러버", rating: 3.8, text: "프로듀싱이 인상적입니다" },
    { id: "sr3", user: "사운드헌터", rating: 4.5, text: "올해 최고의 곡 중 하나" },
  ];

  const avgSubscriberRating = subscriberReviews.reduce((sum, r) => sum + r.rating, 0) / subscriberReviews.length;

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
          {song.genre && (
            <span className="inline-block mt-3 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              {song.genre}
            </span>
          )}
        </div>
      </div>

      {/* Ratings Section */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-foreground">익평삼 평점</span>
          </div>
          <RatingBadge rating={song.rating} size="lg" />
          {song.reviewText && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{song.reviewText}</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">구독자 평점</span>
          </div>
          <RatingBadge rating={avgSubscriberRating} size="lg" />
          <p className="text-xs text-muted-foreground mt-3">{subscriberReviews.length}명 참여</p>
        </div>
      </div>

      {/* Subscriber Reviews */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-4">구독자 한줄평</h2>
        <div className="space-y-2">
          {subscriberReviews.map((review) => (
            <div key={review.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
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
      </div>
    </div>
  );
};

export default SongDetail;
