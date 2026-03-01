import { useState, useEffect } from "react";
import { User, Loader2, Star, Heart, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface UserReview {
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

const MyPage = () => {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [editReview, setEditReview] = useState<UserReview | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchReviews = () => {
    if (!user) return;
    setReviewsLoading(true);
    const doFetch = async () => {
      try {
        const { data, error } = await supabase
          .from("user_reviews")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (!error && data) setReviews(data as unknown as UserReview[]);
      } finally {
        setReviewsLoading(false);
      }
    };
    doFetch();
  };

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const openEditDialog = (review: UserReview) => {
    setEditReview(review);
    setEditRating(review.rating || 0);
    setEditComment(review.comment || "");
    setShowConfirm(false);
  };

  const handleConfirmEdit = async () => {
    if (!editReview || !user || editRating === 0) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("user_reviews")
        .update({
          rating: editRating,
          comment: editComment || null,
          likes_count: 0,
        })
        .eq("id", editReview.id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "리뷰가 수정되었습니다", description: "좋아요 수가 초기화되었습니다." });
      setEditReview(null);
      setShowConfirm(false);
      fetchReviews();
    } catch (err) {
      console.error("Update review error:", err);
      toast({ title: "수정 실패", description: "잠시 후 다시 시도해주세요", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

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

  const activeEditRating = editHoverRating || editRating;

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
          {reviews.map((review) => {
            const likes = review.likes_count || 0;
            return (
              <div key={review.id} className="rounded-lg border border-border p-3 flex gap-3">
                {review.cover_url ? (
                  <img src={review.cover_url} alt="" className="h-14 w-14 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                    <Star className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-foreground truncate">{review.song_info}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                        <span className="text-sm font-bold text-foreground">{review.rating.toFixed(1)}</span>
                      </div>
                      <button
                        onClick={() => openEditDialog(review)}
                        className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        title="리뷰 수정"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground truncate">{review.comment}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground/60">
                      {new Date(review.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                    </p>
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
      )}

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editReview} onOpenChange={(open) => { if (!open) { setEditReview(null); setShowConfirm(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>리뷰 수정</DialogTitle>
            <DialogDescription>{editReview?.song_info}</DialogDescription>
          </DialogHeader>

          {!showConfirm ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>평점 * <span className="text-muted-foreground font-normal">(0.5~5.0)</span></Label>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => {
                    const value = (i + 1) * 0.5;
                    return (
                      <button
                        key={i}
                        type="button"
                        className="p-0.5"
                        onMouseEnter={() => setEditHoverRating(value)}
                        onMouseLeave={() => setEditHoverRating(0)}
                        onClick={() => setEditRating(value)}
                      >
                        <Star
                          className={`h-5 w-5 transition-colors ${
                            value <= activeEditRating ? "text-primary fill-primary" : "text-muted-foreground/20"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-sm font-bold text-foreground tabular-nums">
                    {activeEditRating > 0 ? activeEditRating.toFixed(1) : "—"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>한줄평 <span className="text-muted-foreground font-normal">({editComment.length}/200)</span></Label>
                <Textarea
                  value={editComment}
                  onChange={(e) => { if (e.target.value.length <= 200) setEditComment(e.target.value); }}
                  rows={3}
                  maxLength={200}
                  className="resize-none"
                  placeholder="한줄평을 입력하세요..."
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditReview(null)}>취소</Button>
                <Button onClick={() => setShowConfirm(true)} disabled={editRating === 0}>수정하기</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 space-y-1">
                <p className="text-sm font-medium text-destructive">⚠️ 좋아요 수가 초기화됩니다</p>
                <p className="text-xs text-muted-foreground">
                  리뷰를 수정하면 기존에 받은 좋아요 수({editReview?.likes_count || 0}개)가 0으로 초기화됩니다. 계속하시겠습니까?
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirm(false)}>돌아가기</Button>
                <Button variant="destructive" onClick={handleConfirmEdit} disabled={updating}>
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  수정 확인
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyPage;
