import RecommendationCard from "@/components/drink/recommendation-card";
import SectionTitle from "@/components/common/section-title";
import { getCommunityRecommendations } from "@/lib/community-recommendations";

export default async function TodayRecommendation() {
  const [latestRecommendation] = await getCommunityRecommendations({ limit: 1 });
  const todayRecommendation = latestRecommendation?.recommendations[0] ?? null;

  return (
    <section>
      <SectionTitle
        title="오늘의 술 추천"
        description="최근 대화 추천에서 나온 주류를 살펴보세요."
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
