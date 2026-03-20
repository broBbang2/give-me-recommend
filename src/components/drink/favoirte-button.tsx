"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavoriteStore } from "@/stores/favorite-store";
import type { RecommendedDrinkItem } from "@/types/recommendation";

interface FavoriteButtonProps {
  recommendation: RecommendedDrinkItem;
  className?: string;
}

export default function FavoriteButton({
  recommendation,
  className,
}: FavoriteButtonProps) {
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const hydrated = useFavoriteStore((state) => state.hydrated);
  const isFavorite = useFavoriteStore((state) => state.isFavorite(recommendation));

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        toggleFavorite(recommendation);
      }}
      className={cn(
        "rounded-full border border-border/70 bg-background/80 p-2 text-muted-foreground transition hover:text-rose-300",
        isFavorite && hydrated && "border-rose-700/50 bg-rose-950/35 text-rose-300",
        className,
      )}
      aria-label={isFavorite && hydrated ? "즐겨찾기 해제" : "즐겨찾기 추가"}
    >
      <Heart className={isFavorite && hydrated ? "fill-current" : ""} size={16} />
    </button>
  );
}
