"use client";

import PageContainer from "@/components/common/page-container";
import DrinkCard from "@/components/drink/drink-card";
import { drinks } from "@/data/drinks";
import { getRecommendedDrinks } from "@/lib/recommendation";
import { useRecommendationStore } from "@/stores/recommendation-store";
import { UserAnswers } from "@/types/recommendation";

export default function RecommendResultPage() {
  const answers = useRecommendationStore((state) => state.answers);

  const isComplete =
    answers.sweetness !== undefined &&
    answers.abv !== undefined &&
    answers.sparkling !== undefined &&
    answers.situation !== undefined &&
    answers.beginner !== undefined;

  if (!isComplete) {
    return (
      <PageContainer>
        <p>추천 결과를 보려면 먼저 테스트를 진행해주세요.</p>
      </PageContainer>
    );
  }

  const result = getRecommendedDrinks(drinks, answers as UserAnswers);

  return (
    <PageContainer className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">추천 결과</h1>
        <p className="mt-2 text-muted-foreground">
          입력한 취향을 바탕으로 어울리는 술을 추천했어요.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {result.map((drink) => (
          <DrinkCard key={drink.id} drink={drink} />
        ))}
      </div>
    </PageContainer>
  );
}