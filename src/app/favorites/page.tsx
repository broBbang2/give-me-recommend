"use client";

import { useMemo } from "react";
import PageContainer from "@/components/common/page-container";
import RecommendationCard from "@/components/drink/recommendation-card";
import { useFavoriteStore } from "@/stores/favorite-store";

export default function FavoritesPage() {
  const favorites = useFavoriteStore((state) => state.favorites);
  const hydrated = useFavoriteStore((state) => state.hydrated);
  const sortedFavorites = useMemo(
    () =>
      [...favorites].sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
      ),
    [favorites],
  );

  return (
    <PageContainer className="space-y-6">
      <h1 className="text-3xl font-bold">즐겨찾기</h1>
      <p className="text-muted-foreground">
        하트를 눌러 저장한 추천 카드가 이곳에 보관됩니다.
      </p>

      {!hydrated ? (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          즐겨찾기 목록을 불러오고 있어요.
        </div>
      ) : sortedFavorites.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedFavorites.map((favorite) => (
            <RecommendationCard
              key={favorite.favoriteId}
              recommendation={favorite}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          아직 저장한 추천 카드가 없어요. 추천 카드 우측 상단의 하트를 눌러
          즐겨찾기에 담아보세요.
        </div>
      )}
    </PageContainer>
  );
}
