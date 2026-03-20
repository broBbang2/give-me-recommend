import type {
  FavoriteRecommendation,
  RecommendedDrinkItem,
} from "@/types/recommendation";

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

export function getRecommendationFavoriteId(recommendation: RecommendedDrinkItem) {
  if (recommendation.existingDrinkId) {
    return recommendation.existingDrinkId;
  }

  return normalizeName(recommendation.name);
}

export function toFavoriteRecommendation(
  recommendation: RecommendedDrinkItem,
): FavoriteRecommendation {
  return {
    ...recommendation,
    favoriteId: getRecommendationFavoriteId(recommendation),
    savedAt: new Date().toISOString(),
  };
}
