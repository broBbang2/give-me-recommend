"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/common/page-container";
import { questions } from "@/data/questions";
import QuestionCard from "@/features/recommend/question-card";
import TestProgress from "@/features/recommend/test-progress";
import { useRecommendationStore } from "@/stores/recommendation-store";

export default function RecommendPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const setAnswer = useRecommendationStore((state) => state.setAnswer);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (value: string | number | boolean) => {
    setAnswer(currentQuestion.id, value as never);

    if (currentIndex === questions.length - 1) {
      router.push("/recommend/result");
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <PageContainer className="space-y-6">
      <h1 className="text-3xl font-bold">추천 테스트</h1>
      <TestProgress current={currentIndex + 1} total={questions.length} />
      <QuestionCard question={currentQuestion} onSelect={handleSelect} />
    </PageContainer>
  );
}