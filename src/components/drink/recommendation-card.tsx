import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecommendedDrinkItem } from "@/types/recommendation";

interface RecommendationCardProps {
  recommendation: RecommendedDrinkItem;
  recommendationCount?: number;
  compact?: boolean;
}

export default function RecommendationCard({
  recommendation,
  recommendationCount,
  compact = false,
}: RecommendationCardProps) {
  return (
    <Card className={compact ? "h-full border-dashed" : "h-full"}>
      <CardHeader className={compact ? "space-y-2 pb-3" : "space-y-3"}>
        <div className="flex flex-wrap items-center gap-2">
          {recommendation.category && (
            <Badge variant="outline">{recommendation.category}</Badge>
          )}
          {typeof recommendationCount === "number" && (
            <Badge variant="secondary">추천 {recommendationCount}회</Badge>
          )}
        </div>
        <CardTitle className={compact ? "text-base" : "text-lg"}>
          {recommendation.name}
        </CardTitle>
        <CardDescription className={compact ? "leading-5" : "leading-6"}>
          {recommendation.reason}
        </CardDescription>
      </CardHeader>
      <CardContent className={compact ? "space-y-2 pt-0" : "space-y-3"}>
        {recommendation.servingTip && (
          <p className="text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">마시는 팁:</span>{" "}
            {recommendation.servingTip}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
