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
import {
  getDisplayRecommendationCategory,
  getRecommendationTagClassName,
  simplifyRecommendationTag,
} from "@/lib/drink-category";
import { toPlainText } from "@/lib/plain-text";
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
          .map((item) => simplifyRecommendationTag(item.category))
          .filter(
            (
              category,
            ): category is Exclude<ReturnType<typeof simplifyRecommendationTag>, null> =>
              Boolean(category),
          ),
      )],
    [recommendation.recommendations],
  );

  return (
    <Card className="h-full overflow-hidden border-border/70">
      <CardHeader className="space-y-4 border-b bg-muted/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className="text-xl leading-snug">{recommendation.promptSummary}</CardTitle>
          <Badge variant="outline" className="shrink-0 self-start">
            {formatDate(recommendation.createdAt)}
          </Badge>
        </div>
        <div className="space-y-2">
          <CardDescription className="leading-6">
            {recommendation.userTasteSummary}
          </CardDescription>
          {categoryTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {categoryTags.map((tag) => (
                <Badge
                  key={`${recommendation.id}-${tag}`}
                  variant="outline"
                  className={getRecommendationTagClassName(tag)}
                >
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
            {toPlainText(recommendation.assistantReply)}
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
                  <Badge
                    key={`${recommendation.id}-${item.name}`}
                    variant="outline"
                    className={getRecommendationTagClassName(
                      getDisplayRecommendationCategory(item.category),
                    )}
                  >
                    {toPlainText(item.name)}
                  </Badge>
                ))}
              </div>

              <div className="space-y-3">
                {recommendation.recommendations.map((item, index) => {
                  const category = getDisplayRecommendationCategory(item.category);

                  return (
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
                            <p className="font-medium">{toPlainText(item.name)}</p>
                            {category && (
                              <Badge
                                variant="outline"
                                className={getRecommendationTagClassName(category)}
                              >
                                {category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {category ? `${category} 추천` : "추천 주류"}
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
