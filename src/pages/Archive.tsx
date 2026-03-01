import { useState, useMemo } from "react";
import { Search, LayoutGrid, List, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SongCard from "@/components/SongCard";
import { useGoogleSheets, useAliasRules } from "@/hooks/useGoogleSheets";
import { getSearchTermsFromRules } from "@/lib/artistAliases";

type ViewMode = "grid" | "list";
type SortBy = "rating-desc" | "rating-asc" | "date-desc" | "date-asc";

const Archive = () => {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");

  const { data: songs = [], isLoading, error } = useGoogleSheets();
  const { data: aliasRules = [] } = useAliasRules();

  const filtered = useMemo(() => {
    let result = [...songs];

    if (search.trim()) {
      const terms = getSearchTermsFromRules(search.toLowerCase(), aliasRules);
      result = result.filter((s) => {
        const title = s.title.toLowerCase();
        const artist = s.artist.toLowerCase();
        const genre = s.genre?.toLowerCase() || "";
        return terms.some((t) => title.includes(t) || artist.includes(t) || genre.includes(t));
      });
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
  }, [songs, search, sortBy, aliasRules]);

  return (
    <div className="container py-8">
      <h1 className="text-xl font-bold text-foreground mb-6">음악 아카이브</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="곡명, 아티스트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">최신순</SelectItem>
              <SelectItem value="date-asc">오래된순</SelectItem>
              <SelectItem value="rating-desc">높은 평점</SelectItem>
              <SelectItem value="rating-asc">낮은 평점</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden sm:flex border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <p className="text-destructive text-sm">데이터를 불러오는 데 실패했습니다</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <p className="text-xs text-muted-foreground mb-4">{filtered.length}곡</p>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">검색 결과가 없습니다</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Archive;
