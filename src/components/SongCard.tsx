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
      <div className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:glow-gold-sm">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
          {song.coverUrl ? (
            <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{song.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
        {song.genre && (
          <span className="hidden sm:inline-block text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
            {song.genre}
          </span>
        )}
        <div className="flex items-center gap-2">
          {song.isOfficial && <Star className="h-3.5 w-3.5 text-primary fill-primary" />}
          <RatingBadge rating={song.rating} />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30 hover:glow-gold-sm">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={song.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <RatingBadge rating={song.rating} size="lg" />
        </div>
        {song.isOfficial && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-md bg-background/80 backdrop-blur-sm px-2 py-1">
            <Star className="h-3 w-3 text-primary fill-primary" />
            <span className="text-[10px] font-semibold text-primary">익평삼</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{song.title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{song.artist}</p>
        {song.reviewText && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {song.reviewText}
          </p>
        )}
        {song.genre && (
          <span className="inline-block mt-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            {song.genre}
          </span>
        )}
      </div>
    </div>
  );
};

export default SongCard;
