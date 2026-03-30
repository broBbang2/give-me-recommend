import "server-only";

import { z } from "zod";
import {
  extractDetailedRecommendationTags,
  extractRecommendationCategories,
  normalizeDetailedRecommendationTag,
  normalizeRecommendationCategory,
  simplifyRecommendationTag,
  sortSimplifiedRecommendationTags,
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
  foodPairing: z.string().nullable().default(null),
  pairingReason: z.string().nullable().default(null),
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
  recommendation_detail_tags: z.array(z.string()).default([]),
  primary_drink_id: z.string().nullable(),
  primary_drink_name: z.string().nullable(),
  is_public: z.boolean(),
});

const communityRecommendationListSelect =
  "id, created_at, prompt_summary, user_taste_summary, assistant_reply, recommendations, recommendation_categories, recommendation_detail_tags, primary_drink_id, primary_drink_name, is_public";

const legacyCommunityRecommendationListSelect =
  "id, created_at, prompt_summary, user_taste_summary, assistant_reply, recommendations, primary_drink_id, primary_drink_name, is_public";

const recommendationCategoriesRowSchema = z.object({
  recommendation_categories: z.array(z.string()).default([]),
  recommendation_detail_tags: z.array(z.string()).default([]),
});

const recommendationDetailTagsRowSchema = z.object({
  recommendation_detail_tags: z.array(z.string()).default([]),
});

function normalizeRecommendationItems(recommendations: RecommendedDrinkItem[]) {
  return recommendations.map((recommendation) => ({
    ...recommendation,
    name: toPlainText(recommendation.name),
    category: normalizeRecommendationCategory(recommendation.category),
    reason: toPlainText(recommendation.reason),
    servingTip: toPlainText(recommendation.servingTip) || null,
    foodPairing: toPlainText(recommendation.foodPairing) || null,
    pairingReason: toPlainText(recommendation.pairingReason) || null,
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
  const normalizedCategories = categories
    .map((category) => simplifyRecommendationTag(category))
    .filter(
      (
        category,
      ): category is Exclude<ReturnType<typeof simplifyRecommendationTag>, null> =>
        Boolean(category),
    );

  return sortSimplifiedRecommendationTags([...new Set(normalizedCategories)]);
}

function getStoredTagFilterValues(tag: string) {
  const normalizedTag = simplifyRecommendationTag(tag) ?? tag;

  if (normalizedTag === "레드와인") {
    return ["레드와인"];
  }

  if (normalizedTag === "화이트와인") {
    return ["화이트와인"];
  }

  if (normalizedTag === "와인") {
    return ["와인", "레드와인", "화이트와인", "스파클링와인"];
  }

  if (normalizedTag === "칵테일") {
    return ["칵테일", "하이볼", "리큐르"];
  }

  return [normalizedTag];
}

function normalizeStoredDetailTags(categories: string[]) {
  const normalizedCategories = categories
    .map((category) => normalizeDetailedRecommendationTag(category))
    .filter(
      (
        category,
      ): category is Exclude<ReturnType<typeof normalizeDetailedRecommendationTag>, null> =>
        Boolean(category),
    );

  return [...new Set(normalizedCategories)].sort((a, b) => a.localeCompare(b, "ko"));
}

function isMissingRecommendationCategoriesColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    (candidate.code === "42703" || candidate.code === "PGRST204") &&
    (
      candidate.message?.includes("recommendation_categories") === true ||
      candidate.message?.includes("recommendation_detail_tags") === true
    )
  );
}

async function getLegacyCommunityRecommendations(options: {
  limit: number;
  offset: number;
  keyword: string;
  tag: string;
  detailTag: string;
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
    ? simplifyRecommendationTag(options.tag)?.toLowerCase() ?? options.tag.toLowerCase()
    : "";
  const normalizedDetailTag = options.detailTag
    ? normalizeDetailedRecommendationTag(options.detailTag)?.toLowerCase() ?? options.detailTag.toLowerCase()
    : "";

  const tagFilteredRecommendations = normalizedTag
    ? recommendations.filter((item) =>
        item.recommendations.some(
          (recommendation) => simplifyRecommendationTag(recommendation.category)?.toLowerCase() === normalizedTag,
        ),
      )
    : recommendations;

  const detailTagFilteredRecommendations = normalizedDetailTag
    ? tagFilteredRecommendations.filter((item) =>
        item.recommendations.some(
          (recommendation) =>
            normalizeDetailedRecommendationTag(recommendation.category)?.toLowerCase() === normalizedDetailTag,
        ),
      )
    : tagFilteredRecommendations;

  if (options.sort === "most-recommendations") {
    return detailTagFilteredRecommendations
      .sort((a, b) => b.recommendations.length - a.recommendations.length)
      .slice(options.offset, options.offset + options.limit);
  }

  return detailTagFilteredRecommendations.slice(
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

async function getLegacyCommunityRecommendationDetailTags(limit: number) {
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
    console.error("Failed to load community recommendation detail tags", error);
    return [] satisfies string[];
  }

  return [...new Set(
    data
      .map((row) =>
        z.object({ recommendations: z.array(recommendationItemSchema) }).safeParse(row),
      )
      .filter((row) => row.success)
      .flatMap((row) => extractDetailedRecommendationTags(row.data.recommendations)),
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
  const recommendationDetailTags = extractDetailedRecommendationTags(input.recommendations);
  let { error } = await supabase.from("community_recommendations").insert({
    prompt_summary: input.promptSummary,
    user_taste_summary: input.userTasteSummary,
    assistant_reply: input.assistantReply,
    recommendations: input.recommendations,
    recommendation_categories: recommendationCategories,
    recommendation_detail_tags: recommendationDetailTags,
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
  detailTag?: string;
  sort?: CommunityRecommendationSort;
}) {
  const limit = options?.limit ?? 18;
  const offset = options?.offset ?? 0;
  const keyword = options?.keyword?.trim().toLowerCase() ?? "";
  const tag = options?.tag?.trim().toLowerCase() ?? "";
  const detailTag = options?.detailTag?.trim().toLowerCase() ?? "";
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
    query = query.overlaps("recommendation_detail_tags", getStoredTagFilterValues(tag));
  }

  if (detailTag) {
    const normalizedDetailTag = normalizeDetailedRecommendationTag(detailTag) ?? detailTag;
    query = query.contains("recommendation_detail_tags", [normalizedDetailTag]);
  }

  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (sort !== "most-recommendations") {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;

  if (isMissingRecommendationCategoriesColumnError(error)) {
    return getLegacyCommunityRecommendations({
      limit,
      offset,
      keyword,
      tag,
      detailTag,
      sort,
    });
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

  // `range(offset, …)`로 이미 페이지 단위만 왔으므로 인덱스는 0부터입니다. 여기서 `slice(offset, …)`를 쓰면 2페이지부터 빈 배열이 됩니다.
  return recommendations;
}

export async function getCommunityRecommendationCount(options?: {
  keyword?: string;
  tag?: string;
  detailTag?: string;
}) {
  const keyword = options?.keyword?.trim().toLowerCase() ?? "";
  const tag = options?.tag?.trim().toLowerCase() ?? "";
  const detailTag = options?.detailTag?.trim().toLowerCase() ?? "";
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return 0;
  }

  let query = supabase
    .from("community_recommendations")
    .select("id", { count: "exact" })
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
    query = query.overlaps("recommendation_detail_tags", getStoredTagFilterValues(tag));
  }

  if (detailTag) {
    const normalizedDetailTag = normalizeDetailedRecommendationTag(detailTag) ?? detailTag;
    query = query.contains("recommendation_detail_tags", [normalizedDetailTag]);
  }

  const { count, error } = await query;

  if (isMissingRecommendationCategoriesColumnError(error)) {
    return getLegacyCommunityRecommendationCount({ keyword, tag, detailTag });
  }

  if (error) {
    console.error("Failed to load community recommendation count", error);
    return 0;
  }

  return count ?? 0;
}

async function getLegacyCommunityRecommendationCount(options: {
  keyword: string;
  tag: string;
  detailTag: string;
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
    simplifyRecommendationTag(options.tag)?.toLowerCase() ?? options.tag.toLowerCase();
  const normalizedDetailTag = options.detailTag
    ? normalizeDetailedRecommendationTag(options.detailTag)?.toLowerCase() ?? options.detailTag.toLowerCase()
    : "";

  const tagFilteredRecommendations = !options.tag
    ? recommendations
    : recommendations.filter((item) =>
        item.recommendations.some(
          (recommendation) =>
            simplifyRecommendationTag(recommendation.category)?.toLowerCase() === normalizedTag,
        ),
      );

  if (!normalizedDetailTag) {
    return tagFilteredRecommendations.length;
  }

  return tagFilteredRecommendations.filter((item) =>
    item.recommendations.some(
      (recommendation) =>
        normalizeDetailedRecommendationTag(recommendation.category)?.toLowerCase() === normalizedDetailTag,
    ),
  ).length;
}

/** 최근 행에서 태그 후보를 모읍니다. 행 수를 줄이면 첫 로딩이 가벼워집니다(태그 종류는 보통 상위 샘플에도 충분히 반영됨). */
export async function getCommunityRecommendationTags(limit = 100) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] satisfies string[];
  }

  const { data, error } = await supabase
    .from("community_recommendations")
    .select("recommendation_categories, recommendation_detail_tags")
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

  return sortSimplifiedRecommendationTags([...new Set(
    data
      .map((row) => recommendationCategoriesRowSchema.safeParse(row))
      .filter((row) => row.success)
      .flatMap((row) =>
        normalizeStoredCategories(
          row.data.recommendation_detail_tags.length > 0
            ? row.data.recommendation_detail_tags
            : row.data.recommendation_categories,
        ),
      ),
  )]);
}

export async function getCommunityRecommendationDetailTags(limit = 200) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] satisfies string[];
  }

  const { data, error } = await supabase
    .from("community_recommendations")
    .select("recommendation_detail_tags")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (isMissingRecommendationCategoriesColumnError(error)) {
    return getLegacyCommunityRecommendationDetailTags(limit);
  }

  if (error || !data) {
    console.error("Failed to load community recommendation detail tags", error);
    return [] satisfies string[];
  }

  return [...new Set(
    data
      .map((row) => recommendationDetailTagsRowSchema.safeParse(row))
      .filter((row) => row.success)
      .flatMap((row) => normalizeStoredDetailTags(row.data.recommendation_detail_tags)),
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
