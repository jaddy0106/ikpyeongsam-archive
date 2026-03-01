import { cn } from "@/lib/utils";

interface RatingBadgeProps {
  rating: number;
  size?: "sm" | "md" | "lg";
}

const getRatingColor = (rating: number) => {
  if (rating >= 9) return "bg-primary/20 text-primary border-primary/40";
  if (rating >= 7) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (rating >= 5) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/15 text-red-400 border-red-500/30";
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 min-w-[2rem]",
  md: "text-sm px-2.5 py-1 min-w-[2.5rem]",
  lg: "text-lg px-3 py-1.5 min-w-[3rem] font-bold",
};

const RatingBadge = ({ rating, size = "md" }: RatingBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-semibold tabular-nums",
        getRatingColor(rating),
        sizeClasses[size]
      )}
    >
      {rating.toFixed(1)}
    </span>
  );
};

export default RatingBadge;
