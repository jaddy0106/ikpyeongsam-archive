import { cn } from "@/lib/utils";

interface RatingBadgeProps {
  rating: number;
  size?: "sm" | "md" | "lg";
}

const getRatingColor = (rating: number) => {
  if (rating >= 9) return "bg-primary/15 text-primary border-primary/30";
  if (rating >= 7) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (rating >= 5) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-red-500/10 text-red-600 border-red-500/20";
};

const sizeClasses = {
  sm: "text-xs px-1.5 py-0.5 min-w-[2rem]",
  md: "text-sm px-2 py-0.5 min-w-[2.5rem]",
  lg: "text-base px-2.5 py-1 min-w-[3rem] font-bold",
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
