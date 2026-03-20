import "server-only";

import { z } from "zod";
import {
  extractRecommendationCategories,
  normalizeRecommendationCategory,
} from "@/lib/drink-category";
import { toPlainText } from "@/lib/plain-text";
import type {
  CommunityRecommendation,
  PopularRecommendationItem,
  RecommendedDrinkItem,
} from "@/types/recommendation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CommunityRecommendationSort =
  | "latest"
  | "oldest"
  | "most-recommendations";

const recommendationItemSchema = z.object({
  name: z.string(),
  category: z.string().nullable(),
  reason: z.string(),
  servingTip: z.string().nullable(),
  existingDrinkId: z.string().nullable(),
});

const communityRecommendationRowSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  prompt_summary: z.string(),
  user_taste_summary: z.string(),
  assistant_reply: z.string(),
  recommendations: z.array(recommendationItemSchema),
  recommendation_categories: z.array(z.string()).default([]),
  primary_drink_id: z.string().nullable(),
  primary_drink_name: z.string().nullable(),
  is_public: z.boolean(),
});

const communityRecommendationListSelect =
  "id, created_at, prompt_summary, user_taste_summary, assistant_reply, recommendations, recommendation_categories, primary_drink_id, primary_drink_name, is_public";

const legacyCommunityRecommendationListSelect =
  "id, created_at, prompt_summary, user_taste_summary, assistant_reply, recommendations, primary_drink_id, primary_drink_name, is_public";

const recommendationCategoriesRowSchema = z.object({
  recommendation_categories: z.array(z.string()).default([]),
});

function normalizeRecommendationItems(recommendations: RecommendedDrinkItem[]) {
  return recommendations.map((recommendation) => ({
    ...recommendation,
    name: toPlainText(recommendation.name),
    category: normalizeRecommendationCategory(recommendation.category),
    reason: toPlainText(recommendation.reason),
    servingTip: toPlainText(recommendation.servingTip) || null,
  }));
}

function parseCommunityRecommendation(
  row: z.infer<typeof communityRecommendationRowSchema>,
) {
  return {
    id: row.id,
    createdAt: row.created_at,
    promptSummary: toPlainText(row.prompt_summary),
    userTasteSummary: toPlainText(row.user_taste_summary),
    assistantReply: toPlainText(row.assistant_reply),
    recommendations: normalizeRecommendationItems(row.recommendations),
    primaryDrinkId: row.primary_drink_id,
    primaryDrinkName: row.primary_drink_name,
    isPublic: row.is_public,
  } satisfies CommunityRecommendation;
}

function getKeywordSearchPattern(keyword: string) {
  return `%${keyword.replaceAll(",", " ").trim()}%`;
}

function normalizeStoredCategories(categories: string[]) {
  return [...new Set(
    categories
      .map((category) => normalizeRecommendationCategory(category))
      .filter((category): category is string => Boolean(category)),
  )].sort((a, b) => a.localeCompare(b, "ko"));
}

function isMissingRecommendationCategoriesColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "42703" &&
    candidate.message?.includes("recommendation_categories") === true
  );
}

async function getLegacyCommunityRecommendations(options: {
  limit: number;
  offset: number;
  keyword: string;
  tag: string;
  sort: CommunityRecommendationSort;
}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] satisfies CommunityRecommendation[];
  }

  let query = supabase
    .from("community_recommendations")
    .select(legacyCommunityRecommendationListSelect)
    .eq("is_public", true);

  if (options.keyword) {
    const pattern = getKeywordSearchPattern(options.keyword);
    query = query.or(
      [
        `prompt_summary.ilike.${pattern}`,
        `user_taste_summary.ilike.${pattern}`,
        `assistant_reply.ilike.${pattern}`,
        `primary_drink_name.ilike.${pattern}`,
      ].join(","),
    );
  }

  if (options.sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Failed to load community recommendations", error);
    return [] satisfies CommunityRecommendation[];
  }

  const recommendations = data
    .map((row) => {
      const parsedRow = communityRecommendationRowSchema.safeParse(row);

      if (!parsedRow.success) {
        return null;
      }

      return parseCommunityRecommendation(parsedRow.data);
    })
    .filter((item): item is CommunityRecommendation => item !== null);

  const normalizedTag = options.tag
    ? normalizeRecommendationCategory(options.tag)?.toLowerCase() ?? options.tag.toLowerCase()
    : "";

  const tagFilteredRecommendations = normalizedTag
    ? recommendations.filter((item) =>
        item.recommendations.some(
          (recommendation) => recommendation.category?.toLowerCase() === normalizedTag,
        ),
      )
    : recommendations;

  if (options.sort === "most-recommendations") {
    return tagFilteredRecommendations
      .sort((a, b) => b.recommendations.length - a.recommendations.length)
      .slice(options.offset, options.offset + options.limit);
  }

  return tagFilteredRecommendations.slice(
    options.offset,
    options.offset + options.limit,
  );
}

async function getLegacyCommunityRecommendationTags(limit: number) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] satisfies string[];
  }

  const { data, error } = await supabase
    .from("community_recommendations")
    .select("recommendations")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("Failed to load community recommendation tags", error);
    return [] satisfies string[];
  }

  return [...new Set(
    data
      .map((row) =>
        z.object({ recommendations: z.array(recommendationItemSchema) }).safeParse(row),
      )
      .filter((row) => row.success)
      .flatMap((row) => extractRecommendationCategories(row.data.recommendations)),
  )].sort((a, b) => a.localeCompare(b, "ko"));
}

function getPrimaryRecommendation(recommendations: RecommendedDrinkItem[]) {
  return recommendations.find((item) => item.existingDrinkId) ?? recommendations[0];
}

export async function saveCommunityRecommendation(input: {
  promptSummary: string;
  userTasteSummary: string;
  assistantReply: string;
  recommendations: RecommendedDrinkItem[];
}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return false;
  }

  const primaryRecommendation = getPrimaryRecommendation(input.recommendations);
  const recommendationCategories = extractRecommendationCategories(input.recommendations);
  let { error } = await supabase.from("community_recommendations").insert({
    prompt_summary: input.promptSummary,
    user_taste_summary: input.userTasteSummary,
    assistant_reply: input.assistantReply,
    recommendations: input.recommendations,
    recommendation_categories: recommendationCategories,
    primary_drink_id: primaryRecommendation?.existingDrinkId ?? null,
    primary_drink_name: primaryRecommendation?.name ?? null,
    is_public: true,
  });

  if (isMissingRecommendationCategoriesColumnError(error)) {
    ({ error } = await supabase.from("community_recommendations").insert({
      prompt_summary: input.promptSummary,
      user_taste_summary: input.userTasteSummary,
      assistant_reply: input.assistantReply,
      recommendations: input.recommendations,
      primary_drink_id: primaryRecommendation?.existingDrinkId ?? null,
      primary_drink_name: primaryRecommendation?.name ?? null,
      is_public: true,
    }));
  }

  if (error) {
    console.error("Failed to save community recommendation", error);
    return false;
  }

  return true;
}

export async function getCommunityRecommendations(options?: {
  limit?: number;
  offset?: number;
  keyword?: string;
  tag?: string;
  sort?: CommunityRecommendationSort;
}) {
  const limit = options?.limit ?? 18;
  const offset = options?.offset ?? 0;
  const keyword = options?.keyword?.trim().toLowerCase() ?? "";
  const tag = options?.tag?.trim().toLowerCase() ?? "";
  const sort = options?.sort ?? "latest";
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] satisfies CommunityRecommendation[];
  }

  let query = supabase
    .from("community_recommendations")
    .select(communityRecommendationListSelect)
    .eq("is_public", true);

  if (keyword) {
    const pattern = getKeywordSearchPattern(keyword);
    query = query.or(
      [
        `prompt_summary.ilike.${pattern}`,
        `user_taste_summary.ilike.${pattern}`,
        `assistant_reply.ilike.${pattern}`,
        `primary_drink_name.ilike.${pattern}`,
      ].join(","),
    );
  }

  if (tag) {
    const normalizedTag = normalizeRecommendationCategory(tag) ?? tag;
    query = query.contains("recommendation_categories", [normalizedTag]);
  }

  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (isMissingRecommendationCategoriesColumnError(error)) {
    return getLegacyCommunityRecommendations({ limit, offset, keyword, tag, sort });
  }

  if (error || !data) {
    console.error("Failed to load community recommendations", error);
    return [] satisfies CommunityRecommendation[];
  }

  const recommendations = data
    .map((row) => {
      const parsedRow = communityRecommendationRowSchema.safeParse(row);

      if (!parsedRow.success) {
        return null;
      }

      return parseCommunityRecommendation(parsedRow.data);
    })
    .filter((item): item is CommunityRecommendation => item !== null);

  if (sort === "most-recommendations") {
    return recommendations
      .sort((a, b) => b.recommendations.length - a.recommendations.length)
      .slice(offset, offset + limit);
  }

  return recommendations.slice(offset, offset + limit);
}

export async function getCommunityRecommendationCount(options?: {
  keyword?: string;
  tag?: string;
}) {
  const keyword = options?.keyword?.trim().toLowerCase() ?? "";
  const tag = options?.tag?.trim().toLowerCase() ?? "";
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return 0;
  }

  let query = supabase
    .from("community_recommendations")
    .select(communityRecommendationListSelect)
    .eq("is_public", true);

  if (keyword) {
    const pattern = getKeywordSearchPattern(keyword);
    query = query.or(
      [
        `prompt_summary.ilike.${pattern}`,
        `user_taste_summary.ilike.${pattern}`,
        `assistant_reply.ilike.${pattern}`,
        `primary_drink_name.ilike.${pattern}`,
      ].join(","),
    );
  }

  if (tag) {
    const normalizedTag = normalizeRecommendationCategory(tag) ?? tag;
    query = query.contains("recommendation_categories", [normalizedTag]);
  }

  const { data, error } = await query;

  if (isMissingRecommendationCategoriesColumnError(error)) {
    return getLegacyCommunityRecommendationCount({ keyword, tag });
  }

  if (error || !data) {
    console.error("Failed to load community recommendation count", error);
    return 0;
  }

  return data
    .map((row) => communityRecommendationRowSchema.safeParse(row))
    .filter((row) => row.success).length;
}

async function getLegacyCommunityRecommendationCount(options: {
  keyword: string;
  tag: string;
}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return 0;
  }

  let query = supabase
    .from("community_recommendations")
    .select(legacyCommunityRecommendationListSelect)
    .eq("is_public", true);

  if (options.keyword) {
    const pattern = getKeywordSearchPattern(options.keyword);
    query = query.or(
      [
        `prompt_summary.ilike.${pattern}`,
        `user_taste_summary.ilike.${pattern}`,
        `assistant_reply.ilike.${pattern}`,
        `primary_drink_name.ilike.${pattern}`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Failed to load community recommendation count", error);
    return 0;
  }

  const recommendations = data
    .map((row) => {
      const parsedRow = communityRecommendationRowSchema.safeParse(row);

      if (!parsedRow.success) {
        return null;
      }

      return parseCommunityRecommendation(parsedRow.data);
    })
    .filter((item): item is CommunityRecommendation => item !== null);

  if (!options.tag) {
    return recommendations.length;
  }

  const normalizedTag =
    normalizeRecommendationCategory(options.tag)?.toLowerCase() ?? options.tag.toLowerCase();

  return recommendations.filter((item) =>
    item.recommendations.some(
      (recommendation) => recommendation.category?.toLowerCase() === normalizedTag,
    ),
  ).length;
}

export async function getCommunityRecommendationTags(limit = 200) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] satisfies string[];
  }

  const { data, error } = await supabase
    .from("community_recommendations")
    .select("recommendation_categories")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (isMissingRecommendationCategoriesColumnError(error)) {
    return getLegacyCommunityRecommendationTags(limit);
  }

  if (error || !data) {
    console.error("Failed to load community recommendation tags", error);
    return [] satisfies string[];
  }

  return [...new Set(
    data
      .map((row) => recommendationCategoriesRowSchema.safeParse(row))
      .filter((row) => row.success)
      .flatMap((row) => normalizeStoredCategories(row.data.recommendation_categories)),
  )].sort((a, b) => a.localeCompare(b, "ko"));
}

export async function getPopularBeginnerRecommendations(
  limit = 5,
): Promise<PopularRecommendationItem[]> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] satisfies PopularRecommendationItem[];
  }

  const { data, error } = await supabase
    .from("community_recommendations")
    .select("recommendations")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    console.error("Failed to load popular beginner drinks", error);
    return [] satisfies PopularRecommendationItem[];
  }

  const counts = new Map<
    string,
    { recommendation: RecommendedDrinkItem; recommendationCount: number }
  >();

  for (const row of data) {
    const parsedRecommendations = z.array(recommendationItemSchema).safeParse(
      row.recommendations,
    );

    if (!parsedRecommendations.success) {
      continue;
    }

    for (const recommendation of parsedRecommendations.data) {
      const key = recommendation.name.trim().toLowerCase();

      counts.set(key, {
        recommendation: {
          ...recommendation,
          category: normalizeRecommendationCategory(recommendation.category),
        },
        recommendationCount: (counts.get(key)?.recommendationCount ?? 0) + 1,
      });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.recommendationCount - a.recommendationCount)
    .slice(0, limit)
    .map(
      ({ recommendation, recommendationCount }) =>
        ({
          ...recommendation,
          recommendationCount,
        }) satisfies PopularRecommendationItem,
    );
}
