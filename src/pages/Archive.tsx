import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SongCard from "@/components/SongCard";
import { mockSongs, mockUserReviews } from "@/lib/mockData";

type ViewMode = "grid" | "list";
type SortBy = "rating-desc" | "rating-asc" | "date-desc" | "date-asc";
type FilterSource = "all" | "official" | "user";

const Archive = () => {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [filterSource, setFilterSource] = useState<FilterSource>("all");

  const allSongs = useMemo(() => [...mockSongs, ...mockUserReviews], []);

  const filtered = useMemo(() => {
    let result = allSongs;

    if (filterSource === "official") result = result.filter((s) => s.isOfficial);
    if (filterSource === "user") result = result.filter((s) => !s.isOfficial);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.genre?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "rating-desc": return b.rating - a.rating;
        case "rating-asc": return a.rating - b.rating;
        case "date-desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return 0;
      }
    });

    return result;
  }, [allSongs, search, sortBy, filterSource]);

  return (
    <div className="container py-10 md:py-16">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">음악 아카이브</h1>
        <p className="text-muted-foreground mt-2">평가된 모든 곡들을 한눈에 확인하세요</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="곡명, 아티스트, 장르 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border/50"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterSource} onValueChange={(v) => setFilterSource(v as FilterSource)}>
            <SelectTrigger className="w-[130px] bg-card border-border/50">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="official">익평삼</SelectItem>
              <SelectItem value="user">구독자</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[130px] bg-card border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">최신순</SelectItem>
              <SelectItem value="date-asc">오래된순</SelectItem>
              <SelectItem value="rating-desc">높은 평점</SelectItem>
              <SelectItem value="rating-asc">낮은 평점</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden sm:flex border border-border/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">{filtered.length}곡</p>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((song) => (
            <SongCard key={song.id} song={song} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((song) => (
            <SongCard key={song.id} song={song} variant="list" />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default Archive;
