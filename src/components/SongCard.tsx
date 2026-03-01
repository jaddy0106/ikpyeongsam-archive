import { Link } from "react-router-dom";
import { Song } from "@/lib/types";
import RatingBadge from "./RatingBadge";
import { Music, Star } from "lucide-react";

interface SongCardProps {
  song: Song;
  variant?: "grid" | "list";
}

const SongCard = ({ song, variant = "grid" }: SongCardProps) => {
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
            <h3 className="font-medium text-foreground text-sm truncate">{song.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
          </div>
          {song.isOfficial && <Star className="h-3.5 w-3.5 text-primary fill-primary flex-shrink-0" />}
          <RatingBadge rating={song.rating} size="sm" />
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
          <div className="absolute top-2 right-2">
            <RatingBadge rating={song.rating} size="md" />
          </div>
          {song.isOfficial && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5">
              <Star className="h-3 w-3 text-primary fill-primary" />
              <span className="text-[10px] font-semibold text-primary">익평삼</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-foreground text-sm truncate">{song.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{song.artist}</p>
        </div>
      </div>
    </Link>
  );
};

export default SongCard;
