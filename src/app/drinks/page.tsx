import PageContainer from "@/components/common/page-container";
import SectionTitle from "@/components/common/section-title";
import CommunityFeedControls from "@/components/drink/community-feed-controls";
import CommunityRecommendationCard from "@/components/drink/community-recommendation-card";
import {
  getCommunityRecommendations,
  getCommunityRecommendationTags,
} from "@/lib/community-recommendations";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface DrinksPageProps {
  searchParams?: Promise<{
    q?: string;
    sort?: string;
    tag?: string;
  }>;
}

const sortOptions = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "most-recommendations", label: "추천 주류 많은순" },
] as const;

export default async function DrinksPage({ searchParams }: DrinksPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const keyword = resolvedSearchParams.q?.trim() ?? "";
  const tag = resolvedSearchParams.tag?.trim() ?? "";
  const currentSort = sortOptions.some(
    (option) => option.value === resolvedSearchParams.sort,
  )
    ? (resolvedSearchParams.sort as (typeof sortOptions)[number]["value"])
    : "latest";
  const recommendations = await getCommunityRecommendations({
    keyword,
    tag,
    sort: currentSort,
  });
  const allRecommendations = await getCommunityRecommendations({ limit: 100 });
  const availableTags = getCommunityRecommendationTags(allRecommendations);
  const hasSupabase = isSupabaseConfigured();

  return (
    <PageContainer className="space-y-8">
      <section className="rounded-3xl border bg-muted/20 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <SectionTitle
              title="술 둘러보기"
              description="다른 사용자들이 AI와 대화해서 받은 추천 결과를 커뮤니티 피드처럼 모아봤어요."
            />
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              어떤 상황에서 어떤 술을 찾았는지, 그리고 바텐더가 어떤 주류를
              추천했는지 한눈에 둘러볼 수 있어요.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs text-muted-foreground">피드 수</p>
              <p className="mt-1 text-2xl font-bold">{recommendations.length}</p>
            </div>
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs text-muted-foreground">공개 방식</p>
              <p className="mt-1 text-sm font-medium">익명 커뮤니티</p>
            </div>
            <div className="rounded-2xl border bg-background px-4 py-3 col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground">업데이트</p>
              <p className="mt-1 text-sm font-medium">
                {sortOptions.find((option) => option.value === currentSort)?.label}
              </p>
            </div>
          </div>
        </div>
      </section>

      <CommunityFeedControls
        initialKeyword={keyword}
        initialSort={currentSort}
        initialTag={tag}
        availableTags={availableTags}
        sortOptions={sortOptions}
      />

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <CommunityRecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-3xl border bg-background p-8 text-center">
          <h2 className="text-xl font-semibold">
            {keyword ? "검색 결과가 없어요" : "아직 올라온 추천이 없어요"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {hasSupabase
              ? keyword || tag
                ? "다른 키워드나 태그를 선택하거나 정렬 조건을 바꿔보세요."
                : "AI 추천을 완료하면 이곳에 익명 추천 피드가 하나씩 쌓입니다."
              : "Supabase 연결 정보를 설정하면 이곳에 커뮤니티 추천 피드가 표시됩니다."}
          </p>
        </section>
      )}
    </PageContainer>
  );
}