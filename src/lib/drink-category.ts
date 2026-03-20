import type { DrinkCategory } from "@/types/drink";
import type { RecommendedDrinkItem } from "@/types/recommendation";

const categoryLabelMap: Record<DrinkCategory, string> = {
  "red-wine": "레드와인",
  "white-wine": "화이트와인",
  whisky: "위스키",
  cocktail: "칵테일",
  liqueur: "리큐르",
  highball: "하이볼",
};

function normalizeCategoryKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]+/g, "");
}

export function formatDrinkCategory(category: DrinkCategory) {
  return categoryLabelMap[category];
}

export function normalizeRecommendationCategory(category: string | null | undefined) {
  if (!category) {
    return null;
  }

  const normalized = normalizeCategoryKey(category);

  if (["redwine", "레드와인", "적포도주"].includes(normalized)) {
    return "레드와인";
  }

  if (["whitewine", "화이트와인", "백포도주"].includes(normalized)) {
    return "화이트와인";
  }

  if (["sparklingwine", "스파클링와인"].includes(normalized)) {
    return "스파클링와인";
  }

  if (["wine", "와인"].includes(normalized)) {
    return "와인";
  }

  if (["whisky", "whiskey", "위스키"].includes(normalized)) {
    return "위스키";
  }

  if (["cocktail", "칵테일"].includes(normalized)) {
    return "칵테일";
  }

  if (["liqueur", "리큐르"].includes(normalized)) {
    return "리큐르";
  }

  if (["highball", "하이볼"].includes(normalized)) {
    return "하이볼";
  }

  return category.trim();
}

export function extractRecommendationCategories(recommendations: RecommendedDrinkItem[]) {
  return [...new Set(
    recommendations
      .map((recommendation) => normalizeRecommendationCategory(recommendation.category))
      .filter((category): category is string => Boolean(category))
      .map((category) => category.trim()),
  )].sort((a, b) => a.localeCompare(b, "ko"));
}
