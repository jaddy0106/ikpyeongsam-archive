import { useState } from "react";
import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AddReview = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "",
    artist: "",
    album: "",
    genre: "",
    rating: 0,
    reviewText: "",
    youtubeUrl: "",
  });
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.artist || form.rating === 0) {
      toast({ title: "필수 항목을 입력해주세요", description: "곡명, 아티스트, 평점은 필수입니다.", variant: "destructive" });
      return;
    }
    toast({ title: "리뷰가 등록되었습니다!", description: `${form.artist} - ${form.title}` });
    setForm({ title: "", artist: "", album: "", genre: "", rating: 0, reviewText: "", youtubeUrl: "" });
  };

  const activeRating = hoverRating || form.rating;

  return (
    <div className="container max-w-2xl py-10 md:py-16">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">리뷰 등록</h1>
        <p className="text-muted-foreground mt-2">내가 들은 곡을 평가하고 공유하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">곡명 *</Label>
            <Input
              id="title"
              placeholder="곡 제목"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-card border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist">아티스트 *</Label>
            <Input
              id="artist"
              placeholder="아티스트명"
              value={form.artist}
              onChange={(e) => setForm({ ...form, artist: e.target.value })}
              className="bg-card border-border/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="album">앨범</Label>
            <Input
              id="album"
              placeholder="앨범명 (선택)"
              value={form.album}
              onChange={(e) => setForm({ ...form, album: e.target.value })}
              className="bg-card border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="genre">장르</Label>
            <Input
              id="genre"
              placeholder="예: K-Pop, Rock, R&B"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              className="bg-card border-border/50"
            />
          </div>
        </div>

        {/* Star Rating */}
        <div className="space-y-2">
          <Label>평점 * <span className="text-muted-foreground font-normal">(0.5~10.0)</span></Label>
          <div className="flex items-center gap-1">
            {Array.from({ length: 20 }, (_, i) => {
              const value = (i + 1) * 0.5;
              const isHalf = i % 2 === 0;
              return (
                <button
                  key={i}
                  type="button"
                  className="relative p-0.5"
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setForm({ ...form, rating: value })}
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      value <= activeRating
                        ? "text-primary fill-primary"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              );
            })}
            <span className="ml-3 text-lg font-bold text-foreground tabular-nums min-w-[3rem]">
              {activeRating > 0 ? activeRating.toFixed(1) : "—"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review">리뷰</Label>
          <Textarea
            id="review"
            placeholder="이 곡에 대한 감상을 자유롭게 작성해주세요..."
            value={form.reviewText}
            onChange={(e) => setForm({ ...form, reviewText: e.target.value })}
            rows={4}
            className="bg-card border-border/50 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="youtube">YouTube 링크</Label>
          <Input
            id="youtube"
            placeholder="https://youtube.com/watch?v=..."
            value={form.youtubeUrl}
            onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
            className="bg-card border-border/50"
          />
        </div>

        <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
          리뷰 등록하기
        </Button>
      </form>
    </div>
  );
};

export default AddReview;
