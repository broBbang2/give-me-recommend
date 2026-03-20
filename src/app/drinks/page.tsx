import Link from "next/link";
import { redirect } from "next/navigation";
import PageContainer from "@/components/common/page-container";
import SectionTitle from "@/components/common/section-title";
import CommunityFeedControls from "@/components/drink/community-feed-controls";
import CommunityRecommendationCard from "@/components/drink/community-recommendation-card";
import {
  getCommunityRecommendationCount,
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
    page?: string;
  }>;
}

const pageSize = 5;
const maxVisiblePages = 5;
const sortOptions = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "most-recommendations", label: "추천 주류 많은순" },
] as const;

function getPageLink(params: {
  keyword: string;
  tag: string;
  sort: (typeof sortOptions)[number]["value"];
  page: number;
}) {
  const query = new URLSearchParams();

  if (params.keyword) {
    query.set("q", params.keyword);
  }

  if (params.tag) {
    query.set("tag", params.tag);
  }

  if (params.sort !== "latest") {
    query.set("sort", params.sort);
  }

  if (params.page > 1) {
    query.set("page", String(params.page));
  }

  const queryString = query.toString();
  return queryString ? `/drinks?${queryString}` : "/drinks";
}

export default async function DrinksPage({ searchParams }: DrinksPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const keyword = resolvedSearchParams.q?.trim() ?? "";
  const tag = resolvedSearchParams.tag?.trim() ?? "";
  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1);
  const currentSort = sortOptions.some(
    (option) => option.value === resolvedSearchParams.sort,
  )
    ? (resolvedSearchParams.sort as (typeof sortOptions)[number]["value"])
    : "latest";
  const [totalCount, availableTags] = await Promise.all([
    getCommunityRecommendationCount({
      keyword,
      tag,
    }),
    getCommunityRecommendationTags(),
  ]);
  const hasSupabase = isSupabaseConfigured();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  if (currentPage !== safeCurrentPage) {
    redirect(
      getPageLink({
        keyword,
        tag,
        sort: currentSort,
        page: safeCurrentPage,
      }),
    );
  }

  const offset = (safeCurrentPage - 1) * pageSize;
  const recommendations = await getCommunityRecommendations({
    limit: pageSize,
    offset,
    keyword,
    tag,
    sort: currentSort,
  });
  const halfVisiblePages = Math.floor(maxVisiblePages / 2);
  let pageStart = Math.max(1, safeCurrentPage - halfVisiblePages);
  const pageEnd = Math.min(totalPages, pageStart + maxVisiblePages - 1);

  if (pageEnd - pageStart + 1 < maxVisiblePages) {
    pageStart = Math.max(1, pageEnd - maxVisiblePages + 1);
  }

  const visiblePages = Array.from(
    { length: pageEnd - pageStart + 1 },
    (_, index) => pageStart + index,
  );

  return (
    <PageContainer className="space-y-8">
      <section className="rounded-3xl border bg-muted/20 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <SectionTitle
              title="추천 둘러보기"
              description="다른 사용자들이 AI와 대화해서 받은 추천 결과를 커뮤니티 피드처럼 모아봤어요."
            />
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              어떤 상황에서 어떤 술을 찾았는지, 그리고 바텐더가 어떤 주류를
              추천했는지 한눈에 둘러볼 수 있어요.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs text-muted-foreground">피드 수</p>
              <p className="mt-1 text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="rounded-2xl border bg-background px-4 py-3">
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
        <div className="space-y-6">
          <div className="space-y-4">
            {recommendations.map((recommendation) => (
              <CommunityRecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href={getPageLink({
                  keyword,
                  tag,
                  sort: currentSort,
                  page: safeCurrentPage - 1,
                })}
                aria-disabled={safeCurrentPage === 1}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  safeCurrentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "hover:bg-muted"
                }`}
              >
                이전
              </Link>

              {pageStart > 1 && (
                <span className="px-2 text-sm text-muted-foreground">...</span>
              )}

              {visiblePages.map((page) => (
                <Link
                  key={page}
                  href={getPageLink({
                    keyword,
                    tag,
                    sort: currentSort,
                    page,
                  })}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    page === safeCurrentPage
                      ? "bg-foreground text-background"
                      : "hover:bg-muted"
                  }`}
                >
                  {page}
                </Link>
              ))}

              {pageEnd < totalPages && (
                <span className="px-2 text-sm text-muted-foreground">...</span>
              )}

              <Link
                href={getPageLink({
                  keyword,
                  tag,
                  sort: currentSort,
                  page: safeCurrentPage + 1,
                })}
                aria-disabled={safeCurrentPage === totalPages}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  safeCurrentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "hover:bg-muted"
                }`}
              >
                다음
              </Link>
            </nav>
          )}
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