import { useState, useMemo } from "react";
import { Search, Star, X, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { getSearchTerms } from "@/lib/artistAliases";

interface SelectedSong {
  title: string;
  artist: string;
  album: string;
}

const LoginPrompt = ({ onLogin }: { onLogin: () => void }) => (
  <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
      <User className="h-8 w-8 text-muted-foreground" />
    </div>
    <h1 className="text-lg font-bold text-foreground mb-1">로그인이 필요합니다</h1>
    <p className="text-sm text-muted-foreground mb-5">리뷰를 등록하려면 Google 계정으로 로그인해주세요</p>
    <Button className="font-medium" onClick={onLogin}>Google 로그인</Button>
  </div>
);

const AddReview = () => {
  const { toast } = useToast();
  const { user, loading, signInWithGoogle } = useAuth();
  const { data: sheetSongs = [] } = useGoogleSheets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    const terms = getSearchTerms(q);
    return sheetSongs
      .filter((s) => {
        const title = s.title.toLowerCase();
        const artist = s.artist.toLowerCase();
        return terms.some((t) => title.includes(t) || artist.includes(t));
      })
      .slice(0, 10);
  }, [searchQuery, sheetSongs]);

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <LoginPrompt onLogin={signInWithGoogle} />;
  }

  const handleSelectSong = (song: { title: string; artist: string; album?: string }) => {
    setSelectedSong({ title: song.title, artist: song.artist, album: song.album || "" });
    setSearchQuery("");
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSong || rating === 0) {
      toast({ title: "필수 항목을 입력해주세요", description: "곡 선택과 평점은 필수입니다.", variant: "destructive" });
      return;
    }
    toast({ title: "리뷰가 등록되었습니다!", description: `${selectedSong.artist} - ${selectedSong.title}` });
    setSelectedSong(null);
    setRating(0);
    setReviewText("");
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="container max-w-lg py-8">
      <h1 className="text-xl font-bold text-foreground mb-6">리뷰 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Song Search */}
        <div className="space-y-2">
          <Label>곡 검색 *</Label>
          {selectedSong ? (
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div>
                <p className="font-medium text-foreground text-sm">{selectedSong.title}</p>
                <p className="text-xs text-muted-foreground">{selectedSong.artist} · {selectedSong.album}</p>
              </div>
              <button type="button" onClick={() => setSelectedSong(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="곡명 또는 아티스트로 검색..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                className="pl-10"
              />
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-popover shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((song) => (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => handleSelectSong(song)}
                      className="w-full text-left px-3 py-2.5 hover:bg-secondary/50 transition-colors border-b border-border last:border-0"
                    >
                      <p className="text-sm font-medium text-foreground">{song.title}</p>
                      <p className="text-xs text-muted-foreground">{song.artist} · {song.album}</p>
                    </button>
                  ))}
                </div>
              )}
              {showResults && searchQuery.trim().length >= 1 && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-popover shadow-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Apple Music, Spotify, YouTube Music 등에서 검색됩니다</p>
        </div>

        {/* Star Rating - 5점 만점, 0.5 단위 */}
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
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(value)}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      value <= activeRating
                        ? "text-primary fill-primary"
                        : "text-muted-foreground/20"
                    }`}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-base font-bold text-foreground tabular-nums min-w-[2.5rem]">
              {activeRating > 0 ? activeRating.toFixed(1) : "—"}
            </span>
          </div>
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label htmlFor="review">한줄평 <span className="text-muted-foreground font-normal">({reviewText.length}/200)</span></Label>
          <Textarea
            id="review"
            placeholder="이 곡에 대한 한줄평을 남겨주세요..."
            value={reviewText}
            onChange={(e) => {
              if (e.target.value.length <= 200) setReviewText(e.target.value);
            }}
            rows={3}
            maxLength={200}
            className="resize-none"
          />
        </div>

        <Button type="submit" className="w-full font-medium">
          리뷰 등록하기
        </Button>
      </form>
    </div>
  );
};

export default AddReview;
