"use client";

import PageContainer from "@/components/common/page-container";

export default function FavoritesPage() {
  return (
    <PageContainer className="space-y-6">
      <h1 className="text-3xl font-bold">즐겨찾기</h1>
      <p className="text-muted-foreground">
        목업 기반 상세 주류 데이터를 제거하면서 기존 즐겨찾기 기능은 잠시
        비활성화되어 있어요. 이후에는 AI 추천 카드 자체를 저장하는 방식으로
        다시 연결할 수 있습니다.
      </p>
    </PageContainer>
  );
}
