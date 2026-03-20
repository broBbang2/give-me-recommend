import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  getRecommendationFavoriteId,
  toFavoriteRecommendation,
} from "@/lib/recommendation-favorites";
import type {
  FavoriteRecommendation,
  RecommendedDrinkItem,
} from "@/types/recommendation";

interface FavoriteState {
  favorites: FavoriteRecommendation[];
  hydrated: boolean;
  toggleFavorite: (recommendation: RecommendedDrinkItem) => void;
  isFavorite: (recommendation: RecommendedDrinkItem) => boolean;
  removeFavorite: (favoriteId: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      hydrated: false,
      toggleFavorite: (recommendation) =>
        set((state) => {
          const favoriteId = getRecommendationFavoriteId(recommendation);
          const exists = state.favorites.some((item) => item.favoriteId === favoriteId);

          return {
            favorites: exists
              ? state.favorites.filter((item) => item.favoriteId !== favoriteId)
              : [toFavoriteRecommendation(recommendation), ...state.favorites],
          };
        }),
      isFavorite: (recommendation) => {
        const favoriteId = getRecommendationFavoriteId(recommendation);
        return get().favorites.some((item) => item.favoriteId === favoriteId);
      },
      removeFavorite: (favoriteId) =>
        set((state) => ({
          favorites: state.favorites.filter((item) => item.favoriteId !== favoriteId),
        })),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "choice-favorite-recommendations",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favorites: state.favorites,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
