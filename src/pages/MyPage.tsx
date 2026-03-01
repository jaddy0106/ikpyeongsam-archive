import { useState, useEffect } from "react";
import { User, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UserReview {
  작성일시: string;
  작성자: string;
  작성자ID: string;
  곡정보: string;
  곡ID: string;
  평점: string;
  한줄평: string;
}

const MyPage = () => {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setReviewsLoading(true);
    supabase.functions
      .invoke("google-sheets", {
        body: { action: "fetch-user-reviews", userId: user.id },
      })
      .then(({ data, error }) => {
        if (!error && data?.reviews) setReviews(data.reviews);
      })
      .finally(() => setReviewsLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-1">로그인이 필요합니다</h1>
        <p className="text-sm text-muted-foreground mb-5">Google 계정으로 로그인하여 나만의 리뷰를 관리하세요</p>
        <Button className="font-medium" onClick={signInWithGoogle}>Google 로그인</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{profile?.display_name || "사용자"}</h1>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>로그아웃</Button>
      </div>

      <h2 className="text-base font-bold text-foreground mb-3">내 리뷰 ({reviews.length})</h2>

      {reviewsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">아직 작성한 리뷰가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review, i) => {
            const rating = parseFloat(review.평점) || 0;
            return (
              <div key={i} className="rounded-lg border border-border p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-foreground">{review.곡정보}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                    <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
                  </div>
                </div>
                {review.한줄평 && (
                  <p className="text-sm text-muted-foreground">{review.한줄평}</p>
                )}
                <p className="text-xs text-muted-foreground/60">{review.작성일시}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyPage;