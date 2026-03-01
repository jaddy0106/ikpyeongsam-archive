import { useState, useMemo, useCallback } from "react";
import { Search, Star, X, User, Loader2, Music, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleSheets, useAliasRules } from "@/hooks/useGoogleSheets";
import { getSearchTermsFromRules, getSearchPriority } from "@/lib/artistAliases";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface SelectedSong {
  title: string;
  artist: string;
  album: string;
  coverUrl?: string;
  isNew?: boolean; // iTunes에서 가져온 신규 곡
  releaseDate?: string;
}

interface ITunesResult {
  trackId: number;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  releaseDate: string;
  genre: string;
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
  const { data: aliasRules = [] } = useAliasRules();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [itunesResults, setItunesResults] = useState<ITunesResult[]>([]);
  const [itunesLoading, setItunesLoading] = useState(false);
  const [addingSong, setAddingSong] = useState(false);

  // 디바운스된 iTunes 검색
  const [itunesTimer, setItunesTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const searchITunes = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setItunesResults([]);
      return;
    }
    setItunesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("itunes-search", {
        body: { term: query.trim() },
      });
      if (error) throw error;
      setItunesResults(data?.results || []);
    } catch (err) {
      console.error("iTunes search error:", err);
      setItunesResults([]);
    } finally {
      setItunesLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(true);

    // 디바운스 iTunes 검색
    if (itunesTimer) clearTimeout(itunesTimer);
    if (value.trim().length >= 2) {
      const timer = setTimeout(() => searchITunes(value), 500);
      setItunesTimer(timer);
    } else {
      setItunesResults([]);
    }
  };

  // 시트 검색 결과 (우선순위 정렬)
  const sheetResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    const terms = getSearchTermsFromRules(q, aliasRules);
    return sheetSongs
      .filter((s) => {
        const title = s.title.toLowerCase();
        const artist = s.artist.toLowerCase();
        return terms.some((t) => title.includes(t) || artist.includes(t));
      })
      .map((s) => ({
        ...s,
        priority: getSearchPriority(s.title, s.artist, q, terms),
      }))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 10);
  }, [searchQuery, sheetSongs, aliasRules]);

  // iTunes 결과에서 시트에 이미 있는 곡 제외
  const filteredItunesResults = useMemo(() => {
    if (itunesResults.length === 0) return [];
    return itunesResults.filter((itunes) => {
      const itunesTitle = itunes.title.toLowerCase();
      const itunesArtist = itunes.artist.toLowerCase();
      return !sheetSongs.some(
        (s) =>
          s.title.toLowerCase() === itunesTitle &&
          s.artist.toLowerCase() === itunesArtist
      );
    });
  }, [itunesResults, sheetSongs]);

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

  const handleSelectSheetSong = (song: { title: string; artist: string; album?: string; coverUrl?: string }) => {
    setSelectedSong({
      title: song.title,
      artist: song.artist,
      album: song.album || "",
      coverUrl: song.coverUrl,
      isNew: false,
    });
    setSearchQuery("");
    setShowResults(false);
    setItunesResults([]);
  };

  const handleSelectItunesSong = async (itunes: ITunesResult) => {
    setAddingSong(true);
    try {
      // 구글 시트에 신규 곡 추가
      const newSongId = crypto.randomUUID();
      const releaseDate = itunes.releaseDate
        ? new Date(itunes.releaseDate).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          }).replace(/\./g, ".").trim()
        : "";
      const year = itunes.releaseDate ? new Date(itunes.releaseDate).getFullYear().toString() : "";
      const month = itunes.releaseDate ? (new Date(itunes.releaseDate).getMonth() + 1).toString() : "";

      const { error } = await supabase.functions.invoke("google-sheets", {
        body: {
          action: "append-song",
          values: [[
            newSongId,
            year,
            month,
            itunes.artist,
            itunes.title,
            itunes.album,
            releaseDate,
            itunes.coverUrl,
            "", // ISRC
            "", // cover
            "", // ytUrl
            "C", // ABC - 신규 추가 곡은 C
            "", "", "", "", // rates & avg
            "", "", "", // comments
            "", // IPyoutube
            itunes.genre || "", // Ganre
          ]],
        },
      });

      if (error) throw error;

      setSelectedSong({
        title: itunes.title,
        artist: itunes.artist,
        album: itunes.album,
        coverUrl: itunes.coverUrl,
        isNew: true,
        releaseDate,
      });
      setSearchQuery("");
      setShowResults(false);
      setItunesResults([]);

      toast({
        title: "신규 곡이 추가되었습니다",
        description: `${itunes.artist} - ${itunes.title}`,
      });
    } catch (err) {
      console.error("Error adding song:", err);
      toast({
        title: "곡 추가 실패",
        description: "잠시 후 다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setAddingSong(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSong || rating === 0) {
      toast({ title: "필수 항목을 입력해주세요", description: "곡 선택과 평점은 필수입니다.", variant: "destructive" });
      return;
    }

    try {
      const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
      const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "익명";
      const songInfo = `${selectedSong.artist} - ${selectedSong.title}`;
      const songId = selectedSong.isNew
        ? `${selectedSong.title}-${selectedSong.artist}`.toLowerCase().replace(/\s+/g, '-')
        : sheetSongs.find(s => s.title === selectedSong.title && s.artist === selectedSong.artist)?.id || "";

      await supabase.functions.invoke("google-sheets", {
        body: {
          action: "append-review",
          values: [[now, displayName, user!.id, songInfo, songId, rating.toString(), reviewText]],
        },
      });

      toast({ title: "리뷰가 등록되었습니다!", description: songInfo });
      setSelectedSong(null);
      setRating(0);
      setReviewText("");
    } catch (err) {
      console.error("Review submit error:", err);
      toast({ title: "리뷰 등록 실패", description: "잠시 후 다시 시도해주세요", variant: "destructive" });
    }
  };

  const activeRating = hoverRating || rating;
  const hasAnyResults = sheetResults.length > 0 || filteredItunesResults.length > 0;

  return (
    <div className="container max-w-lg py-8">
      <h1 className="text-xl font-bold text-foreground mb-6">리뷰 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Song Search */}
        <div className="space-y-2">
          <Label>곡 검색 *</Label>
          {selectedSong ? (
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3 gap-3">
              {selectedSong.coverUrl && (
                <img
                  src={selectedSong.coverUrl}
                  alt=""
                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-foreground text-sm truncate">{selectedSong.title}</p>
                  {selectedSong.isNew && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">신규</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{selectedSong.artist} · {selectedSong.album}</p>
              </div>
              <button type="button" onClick={() => setSelectedSong(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="곡명 또는 아티스트로 검색..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowResults(true)}
                className="pl-10"
                disabled={addingSong}
              />
              {showResults && searchQuery.trim().length >= 1 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-popover shadow-lg max-h-72 overflow-y-auto">
                  {/* 시트 검색 결과 */}
                  {sheetResults.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 bg-secondary/30 border-b border-border">
                        <span className="text-[11px] font-medium text-muted-foreground">익평삼 DB</span>
                      </div>
                      {sheetResults.map((song) => (
                        <button
                          key={song.id}
                          type="button"
                          onClick={() => handleSelectSheetSong(song)}
                          className="w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors border-b border-border last:border-0 flex items-center gap-2.5"
                        >
                          {song.coverUrl && (
                            <img src={song.coverUrl} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{song.artist} · {song.album}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* iTunes 검색 결과 */}
                  {filteredItunesResults.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 bg-secondary/30 border-b border-border flex items-center gap-1.5">
                        <Music className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium text-muted-foreground">iTunes 검색결과 — 선택 시 DB에 추가</span>
                      </div>
                      {filteredItunesResults.map((itunes) => (
                        <button
                          key={itunes.trackId}
                          type="button"
                          onClick={() => handleSelectItunesSong(itunes)}
                          disabled={addingSong}
                          className="w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors border-b border-border last:border-0 flex items-center gap-2.5"
                        >
                          {itunes.coverUrl && (
                            <img src={itunes.coverUrl} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{itunes.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{itunes.artist} · {itunes.album}</p>
                          </div>
                          <Plus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* iTunes 로딩 */}
                  {itunesLoading && sheetResults.length === 0 && (
                    <div className="p-4 text-center flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">검색 중...</span>
                    </div>
                  )}

                  {/* 결과 없음 */}
                  {!hasAnyResults && !itunesLoading && searchQuery.trim().length >= 1 && (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
                    </div>
                  )}
                </div>
              )}

              {addingSong && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-popover shadow-lg p-4 text-center flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">곡을 추가하는 중...</span>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">익평삼 DB + iTunes에서 검색됩니다</p>
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
