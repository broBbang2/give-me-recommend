import RecommendationCard from "@/components/drink/recommendation-card";
import SectionTitle from "@/components/common/section-title";
import { getCommunityRecommendations } from "@/lib/community-recommendations";
import type { RecommendedDrinkItem } from "@/types/recommendation";

function getRotatingRecommendation(recommendations: RecommendedDrinkItem[]) {
  if (recommendations.length === 0) {
    return null;
  }

  const intervalMs = 5 * 60 * 1000;
  const currentBucket = Math.floor(Date.now() / intervalMs);
  const recommendationIndex = currentBucket % recommendations.length;

  return recommendations[recommendationIndex] ?? null;
}

export default async function TodayRecommendation() {
  const recentRecommendations = await getCommunityRecommendations({ limit: 12 });
  const rotatingRecommendations = [...new Map(
    recentRecommendations
      .flatMap((item) => item.recommendations)
      .map((recommendation) => [recommendation.name.trim().toLowerCase(), recommendation]),
  ).values()];
  const todayRecommendation = getRotatingRecommendation(rotatingRecommendations);

  return (
    <section>
      <SectionTitle
        title="오늘의 추천"
        description="최근 추천 결과를 보여드려요."
      />
      {todayRecommendation ? (
        <RecommendationCard recommendation={todayRecommendation} />
      ) : (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          아직 저장된 추천 결과가 없어요. AI 추천을 완료하면 이곳에 최신 추천이
          표시됩니다.
        </div>
      )}
    </section>
  );
}
