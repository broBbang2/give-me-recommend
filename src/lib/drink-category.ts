import type { DrinkCategory } from "@/types/drink";
import type { RecommendedDrinkItem } from "@/types/recommendation";
import { toPlainText } from "@/lib/plain-text";

const categoryLabelMap: Record<DrinkCategory, string> = {
  "red-wine": "레드와인",
  "white-wine": "화이트와인",
  whisky: "위스키",
  cocktail: "칵테일",
  liqueur: "리큐르",
  highball: "하이볼",
};

const simplifiedRecommendationTagOrder = [
  "레드와인",
  "화이트와인",
  "와인",
  "위스키",
  "칵테일",
] as const;

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

export function simplifyRecommendationTag(category: string | null | undefined) {
  const normalizedCategory = normalizeRecommendationCategory(category);

  if (!normalizedCategory) {
    return null;
  }

  if (normalizedCategory === "레드와인") {
    return "레드와인";
  }

  if (normalizedCategory === "화이트와인") {
    return "화이트와인";
  }

  if (
    normalizedCategory === "스파클링와인" ||
    normalizedCategory === "와인"
  ) {
    return "와인";
  }

  if (
    normalizedCategory === "하이볼" ||
    normalizedCategory === "칵테일" ||
    normalizedCategory === "리큐르"
  ) {
    return "칵테일";
  }

  if (normalizedCategory === "위스키") {
    return "위스키";
  }

  return null;
}

export function sortSimplifiedRecommendationTags(categories: string[]) {
  return [...categories].sort((a, b) => {
    const indexA = simplifiedRecommendationTagOrder.indexOf(
      a as (typeof simplifiedRecommendationTagOrder)[number],
    );
    const indexB = simplifiedRecommendationTagOrder.indexOf(
      b as (typeof simplifiedRecommendationTagOrder)[number],
    );

    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b, "ko");
    }

    if (indexA === -1) {
      return 1;
    }

    if (indexB === -1) {
      return -1;
    }

    return indexA - indexB;
  });
}

export function normalizeDetailedRecommendationTag(category: string | null | undefined) {
  const plainCategory = toPlainText(category)?.trim();

  if (!plainCategory) {
    return null;
  }

  return normalizeRecommendationCategory(plainCategory) ?? plainCategory;
}

export function extractDetailedRecommendationTags(recommendations: RecommendedDrinkItem[]) {
  return [...new Set(
    recommendations
      .map((recommendation) => normalizeDetailedRecommendationTag(recommendation.category))
      .filter(
        (
          category,
        ): category is Exclude<ReturnType<typeof normalizeDetailedRecommendationTag>, null> =>
          Boolean(category),
      )
      .map((category) => category.trim()),
  )].sort((a, b) => a.localeCompare(b, "ko"));
}

export function extractRecommendationCategories(recommendations: RecommendedDrinkItem[]) {
  const simplifiedCategories = recommendations
    .map((recommendation) => simplifyRecommendationTag(recommendation.category))
    .filter(
      (
        category,
      ): category is Exclude<ReturnType<typeof simplifyRecommendationTag>, null> =>
        Boolean(category),
    )
    .map((category) => category.trim());

  return sortSimplifiedRecommendationTags([...new Set(simplifiedCategories)]);
}

export function getDisplayRecommendationCategory(category: string | null | undefined) {
  const normalizedCategory = normalizeRecommendationCategory(category);

  if (!normalizedCategory) {
    return null;
  }

  if (
    normalizedCategory === "하이볼" ||
    normalizedCategory === "리큐르" ||
    normalizedCategory === "칵테일"
  ) {
    return "칵테일";
  }

  return normalizedCategory;
}

export function getRecommendationTagClassName(category: string | null | undefined) {
  const normalizedCategory = getDisplayRecommendationCategory(category);

  if (normalizedCategory === "레드와인") {
    return "border-rose-700/45 bg-rose-950/45 text-rose-100";
  }

  if (normalizedCategory === "화이트와인") {
    return "border-amber-700/45 bg-amber-950/45 text-amber-100";
  }

  if (normalizedCategory === "스파클링와인") {
    return "border-fuchsia-700/45 bg-fuchsia-950/45 text-fuchsia-100";
  }

  if (normalizedCategory === "와인") {
    return "border-stone-600/45 bg-stone-900/45 text-stone-100";
  }

  if (normalizedCategory === "위스키") {
    return "border-orange-700/45 bg-orange-950/45 text-orange-100";
  }

  if (normalizedCategory === "칵테일") {
    return "border-pink-700/45 bg-pink-950/45 text-pink-100";
  }

  return "border-border";
}
