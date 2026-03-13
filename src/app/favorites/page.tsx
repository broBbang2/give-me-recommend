"use client";

import PageContainer from "@/components/common/page-container";
import DrinkCard from "@/components/drink/drink-card";
import { drinks } from "@/data/drinks";
import { useFavoriteStore } from "@/stores/favorite-store";

export default function FavoritesPage() {
  const favorites = useFavoriteStore((state) => state.favorites);
  const favoriteDrinks = drinks.filter((drink) => favorites.includes(drink.id));

  return (
    <PageContainer className="space-y-6">
      <h1 className="text-3xl font-bold">즐겨찾기</h1>

      {favoriteDrinks.length === 0 ? (
        <p className="text-muted-foreground">아직 저장한 술이 없어요.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {favoriteDrinks.map((drink) => (
            <DrinkCard key={drink.id} drink={drink} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
