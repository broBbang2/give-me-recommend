"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RecommendationCard from "@/components/drink/recommendation-card";
import type { CommunityRecommendation } from "@/types/recommendation";

interface CommunityRecommendationCardProps {
  recommendation: CommunityRecommendation;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export default function CommunityRecommendationCard({
  recommendation,
}: CommunityRecommendationCardProps) {
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [openRecommendationIndex, setOpenRecommendationIndex] = useState<
    number | null
  >(null);
  const categoryTags = useMemo(
    () =>
      [...new Set(
        recommendation.recommendations
          .map((item) => item.category)
          .filter((category): category is string => Boolean(category)),
      )],
    [recommendation.recommendations],
  );

  return (
    <Card className="h-full overflow-hidden border-border/70">
      <CardHeader className="space-y-4 border-b bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">커뮤니티 추천</Badge>
            <Badge variant="outline">익명 사용자</Badge>
          </div>
          <Badge variant="outline">{formatDate(recommendation.createdAt)}</Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl">{recommendation.promptSummary}</CardTitle>
          <CardDescription className="leading-6">
            {recommendation.userTasteSummary}
          </CardDescription>
          {categoryTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {categoryTags.map((tag) => (
                <Badge key={`${recommendation.id}-${tag}`} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">대화 한 줄 요약</p>
          <p className="rounded-xl bg-muted/40 px-3 py-3 text-sm leading-6 text-muted-foreground">
            {recommendation.assistantReply}
          </p>
        </div>

        <div className="rounded-2xl border">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            onClick={() => setIsRecommendationsOpen((prev) => !prev)}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">추천된 주류</p>
              <p className="text-sm text-muted-foreground">
                추천된 주류 목록과 상세 이유를 펼쳐서 볼 수 있어요.
              </p>
            </div>
            {isRecommendationsOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          {isRecommendationsOpen && (
            <div className="space-y-4 border-t p-4">
              <div className="flex flex-wrap gap-2">
                {recommendation.recommendations.map((item) => (
                  <Badge key={`${recommendation.id}-${item.name}`} variant="outline">
                    {item.name}
                  </Badge>
                ))}
              </div>

              <div className="space-y-3">
                {recommendation.recommendations.map((item, index) => (
                  <div
                    key={`${recommendation.id}-${item.name}-${index}`}
                    className="rounded-2xl border"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      onClick={() =>
                        setOpenRecommendationIndex((prev) =>
                          prev === index ? null : index,
                        )
                      }
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{item.name}</p>
                          {item.category && (
                            <Badge variant="outline">{item.category}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.category ? `${item.category} 추천` : "추천 주류"}
                        </p>
                      </div>
                      {openRecommendationIndex === index ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </button>

                    {openRecommendationIndex === index && (
                      <div className="border-t p-3">
                        <RecommendationCard recommendation={item} compact />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
