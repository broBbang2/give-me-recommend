import "server-only";

import { z } from "zod";
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
  primary_drink_id: z.string().nullable(),
  primary_drink_name: z.string().nullable(),
  is_public: z.boolean(),
});

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
  const { error } = await supabase.from("community_recommendations").insert({
    prompt_summary: input.promptSummary,
    user_taste_summary: input.userTasteSummary,
    assistant_reply: input.assistantReply,
    recommendations: input.recommendations,
    primary_drink_id: primaryRecommendation?.existingDrinkId ?? null,
    primary_drink_name: primaryRecommendation?.name ?? null,
    is_public: true,
  });

  if (error) {
    console.error("Failed to save community recommendation", error);
    return false;
  }

  return true;
}

export async function getCommunityRecommendations(options?: {
  limit?: number;
  keyword?: string;
  tag?: string;
  sort?: CommunityRecommendationSort;
}) {
  const limit = options?.limit ?? 18;
  const keyword = options?.keyword?.trim().toLowerCase() ?? "";
  const tag = options?.tag?.trim().toLowerCase() ?? "";
  const sort = options?.sort ?? "latest";
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] satisfies CommunityRecommendation[];
  }

  const { data, error } = await supabase
    .from("community_recommendations")
    .select(
      "id, created_at, prompt_summary, user_taste_summary, assistant_reply, recommendations, primary_drink_id, primary_drink_name, is_public",
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

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

      return {
        id: parsedRow.data.id,
        createdAt: parsedRow.data.created_at,
        promptSummary: parsedRow.data.prompt_summary,
        userTasteSummary: parsedRow.data.user_taste_summary,
        assistantReply: parsedRow.data.assistant_reply,
        recommendations: parsedRow.data.recommendations,
        primaryDrinkId: parsedRow.data.primary_drink_id,
        primaryDrinkName: parsedRow.data.primary_drink_name,
        isPublic: parsedRow.data.is_public,
      } satisfies CommunityRecommendation;
    })
    .filter((item): item is CommunityRecommendation => item !== null);

  const keywordFilteredRecommendations = keyword
    ? recommendations.filter((item) => {
        const searchableText = [
          item.promptSummary,
          item.userTasteSummary,
          item.assistantReply,
          ...item.recommendations.map((recommendation) => recommendation.name),
          ...item.recommendations.map(
            (recommendation) => recommendation.category ?? "",
          ),
          ...item.recommendations.map((recommendation) => recommendation.reason),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(keyword);
      })
    : recommendations;

  const filteredRecommendations = tag
    ? keywordFilteredRecommendations.filter((item) =>
        item.recommendations.some(
          (recommendation) =>
            (recommendation.category ?? "").toLowerCase() === tag,
        ),
      )
    : keywordFilteredRecommendations;

  return filteredRecommendations.sort((a, b) => {
    if (sort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    if (sort === "most-recommendations") {
      return b.recommendations.length - a.recommendations.length;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getCommunityRecommendationTags(
  recommendations: CommunityRecommendation[],
) {
  return [...new Set(
    recommendations
      .flatMap((item) => item.recommendations.map((recommendation) => recommendation.category))
      .filter((category): category is string => Boolean(category))
      .map((category) => category.trim()),
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
        recommendation,
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
