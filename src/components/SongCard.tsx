import { Link } from "react-router-dom";
import { Song } from "@/lib/types";
import { Music, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SongCardProps {
  song: Song;
  variant?: "grid" | "list";
}

const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return "text-primary";
  if (rating >= 3.5) return "text-emerald-400";
  if (rating >= 2.5) return "text-amber-400";
  return "text-red-400";
};

function formatReleaseDate(dateStr: string): string {
  // "2025. 1. 8" → "25. 01. 08"
  const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (!match) return dateStr;
  const yy = match[1].slice(2);
  const mm = match[2].padStart(2, "0");
  const dd = match[3].padStart(2, "0");
  return `${yy}. ${mm}. ${dd}`;
}

const SongCard = ({ song, variant = "grid" }: SongCardProps) => {
  const officialRating = song.memberRatings && song.memberRatings.length > 0
    ? song.memberRatings.reduce((sum, r) => sum + r.rating, 0) / song.memberRatings.length
    : song.rating;

  const hasRating = officialRating > 0;
  const formattedDate = formatReleaseDate(song.createdAt);

  if (variant === "list") {
    return (
      <Link to={`/song/${song.id}`}>
        <div className="group flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary/50">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
            {song.coverUrl ? (
              <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground text-sm truncate">{song.title}</h3>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{formattedDate}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
          </div>
          {song.isOfficial && hasRating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-3 w-3 text-primary fill-primary" />
              <span className={cn("text-xs font-bold tabular-nums", getRatingColor(officialRating))}>{officialRating.toFixed(1)}</span>
            </div>
          )}
          {song.subscriberRating != null && song.subscriberRating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className={cn("text-xs font-bold tabular-nums", getRatingColor(song.subscriberRating))}>{song.subscriberRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/song/${song.id}`}>
      <div className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-secondary/30">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {song.coverUrl ? (
            <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music className="h-10 w-10 text-muted-foreground" />
            </div>
          )}

          {/* 익평삼 평점 - 좌측 하단 */}
          {song.isOfficial && hasRating && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-background/90 backdrop-blur-sm px-1.5 py-0.5">
              <span className="text-[10px] font-semibold text-white">익평삼</span>
              <span className={cn("text-xs font-bold tabular-nums", getRatingColor(officialRating))}>{officialRating.toFixed(1)}</span>
            </div>
          )}

          {/* 구독자 평점 - 우측 하단 */}
          {song.subscriberRating != null && song.subscriberRating > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-muted/90 backdrop-blur-sm px-1.5 py-0.5">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className={cn("text-xs font-bold tabular-nums", getRatingColor(song.subscriberRating))}>{song.subscriberRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1.5">
            <h3 className="font-medium text-foreground text-sm truncate">{song.title}</h3>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">{formattedDate}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{song.artist}</p>
        </div>
      </div>
    </Link>
  );
};

export default SongCard;
