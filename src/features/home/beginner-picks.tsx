import RecommendationCard from "@/components/drink/recommendation-card";
import SectionTitle from "@/components/common/section-title";
import { getPopularBeginnerRecommendations } from "@/lib/community-recommendations";

export default async function BeginnerPicks() {
  const beginnerRecommendations = await getPopularBeginnerRecommendations(5);

  return (
    <section className="rounded-3xl border border-border/70 bg-card/35 p-6">
      <SectionTitle
        title="입문자 추천"
        description="실제 대화 추천에서 자주 언급된 주류 5가지를 모았어요."
      />
      {beginnerRecommendations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {beginnerRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.name}
              recommendation={recommendation}
              recommendationCount={recommendation.recommendationCount}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          아직 쌓인 추천 데이터가 없어요. AI 추천을 몇 번 더 완료하면 이곳에
          인기 주류가 카드로 표시됩니다.
        </div>
      )}
    </section>
  );
}
