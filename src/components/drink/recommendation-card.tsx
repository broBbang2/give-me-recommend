"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FavoriteButton from "@/components/drink/favoirte-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { drinks } from "@/data/drinks";
import {
  getDisplayRecommendationCategory,
  getRecommendationTagClassName,
} from "@/lib/drink-category";
import { cn } from "@/lib/utils";
import type { PriceRange } from "@/types/drink";
import type { RecommendedDrinkItem } from "@/types/recommendation";

interface RecommendationCardProps {
  recommendation: RecommendedDrinkItem;
  recommendationCount?: number;
  compact?: boolean;
}

function hashStringToSeed(input: string) {
  // FNV-1a 32bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildRandomCardGradient(seedText: string) {
  const rand = mulberry32(hashStringToSeed(seedText));
  const hue1 = 120 + rand() * 70; // 120 ~ 190 (초록~청록 계열)
  const hue2 = 120 + rand() * 70;
  const alpha1 = 0.16 + rand() * 0.22;
  const alpha2 = 0.10 + rand() * 0.18;

  const borderColor = `oklch(0.62 0.14 ${hue1.toFixed(1)} / ${Math.min(
    0.55,
    alpha1 + 0.12,
  ).toFixed(2)})`;

  const backgroundImage = [
    `radial-gradient(900px circle at 20% 0%, oklch(0.62 0.14 ${hue1.toFixed(
      1,
    )} / ${alpha1.toFixed(2)}) 0%, transparent 62%)`,
    `radial-gradient(650px circle at 85% 10%, oklch(0.62 0.14 ${hue2.toFixed(
      1,
    )} / ${alpha2.toFixed(2)}) 0%, transparent 55%)`,
    `linear-gradient(180deg, oklch(0.19 0.028 145 / 0.92) 0%, oklch(0.19 0.028 145 / 1) 100%)`,
  ].join(",");

  return { backgroundImage, borderColor };
}

const categoryToneMap: Record<
  string,
  { card: string; badge: string; title: string }
> = {
  레드와인: {
    card:
      "border border-rose-900/40 bg-gradient-to-br from-rose-950/55 via-card to-card shadow-[0_18px_40px_rgba(68,10,24,0.22)] hover:border-rose-700/55 hover:from-rose-950/75 hover:shadow-[0_22px_48px_rgba(96,16,38,0.28)]",
    badge: "border-rose-700/50 bg-rose-950/60 text-rose-100",
    title: "text-rose-50",
  },
  화이트와인: {
    card:
      "border border-amber-800/35 bg-gradient-to-br from-amber-950/35 via-card to-card shadow-[0_18px_40px_rgba(82,50,10,0.16)] hover:border-amber-700/50 hover:from-amber-950/55 hover:shadow-[0_22px_48px_rgba(120,82,18,0.22)]",
    badge: "border-amber-700/40 bg-amber-950/45 text-amber-100",
    title: "text-amber-50",
  },
  스파클링와인: {
    card:
      "border border-fuchsia-800/30 bg-gradient-to-br from-fuchsia-950/35 via-card to-card shadow-[0_18px_40px_rgba(88,28,135,0.16)] hover:border-fuchsia-700/45 hover:from-fuchsia-950/55 hover:shadow-[0_22px_48px_rgba(109,40,217,0.22)]",
    badge: "border-fuchsia-700/40 bg-fuchsia-950/45 text-fuchsia-100",
    title: "text-fuchsia-50",
  },
  위스키: {
    card:
      "border border-orange-800/35 bg-gradient-to-br from-orange-950/40 via-card to-card shadow-[0_18px_40px_rgba(120,53,15,0.18)] hover:border-orange-700/50 hover:from-orange-950/60 hover:shadow-[0_22px_48px_rgba(154,52,18,0.24)]",
    badge: "border-orange-700/40 bg-orange-950/45 text-orange-100",
    title: "text-orange-50",
  },
  칵테일: {
    card:
      "border border-pink-800/30 bg-gradient-to-br from-pink-950/35 via-card to-card shadow-[0_18px_40px_rgba(131,24,67,0.16)] hover:border-pink-700/45 hover:from-pink-950/55 hover:shadow-[0_22px_48px_rgba(157,23,77,0.22)]",
    badge: "border-pink-700/40 bg-pink-950/45 text-pink-100",
    title: "text-pink-50",
  },
  와인: {
    card:
      "border border-stone-700/40 bg-gradient-to-br from-stone-900/40 via-card to-card shadow-[0_18px_40px_rgba(41,37,36,0.16)] hover:border-stone-500/50 hover:from-stone-900/60 hover:shadow-[0_22px_48px_rgba(68,64,60,0.2)]",
    badge: "border-stone-600/40 bg-stone-900/45 text-stone-100",
    title: "text-stone-50",
  },
};

const priceRangeLabelMap: Record<PriceRange, string> = {
  low: "약 1만 원대",
  medium: "약 3만 원대",
  high: "약 5만 원 이상",
};

export default function RecommendationCard({
  recommendation,
  recommendationCount,
  compact = false,
}: RecommendationCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const category = getDisplayRecommendationCategory(recommendation.category);
  const tone = category ? categoryToneMap[category] : null;
  const gradientSeed = recommendation.existingDrinkId
    ? `id:${recommendation.existingDrinkId}`
    : `name:${recommendation.name}`;
  const cardGradient = useMemo(
    () => buildRandomCardGradient(gradientSeed),
    [gradientSeed],
  );
  const drinkDetail = useMemo(() => {
    const normalizedName = recommendation.name.trim().toLowerCase();

    if (recommendation.existingDrinkId) {
      return drinks.find((drink) => drink.id === recommendation.existingDrinkId) ?? null;
    }

    return drinks.find((drink) => drink.name.trim().toLowerCase() === normalizedName) ?? null;
  }, [recommendation.existingDrinkId, recommendation.name]);

  const detailDescription = drinkDetail?.description ?? recommendation.reason;
  const detailPriceLabel = drinkDetail ? priceRangeLabelMap[drinkDetail.priceRange] : null;

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    setIsDetailOpen(true);
  };

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setIsDetailOpen(true)}
        onKeyDown={handleCardKeyDown}
        className={cn(
          "h-full cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          compact && "border-dashed",
          "border border-border/50 bg-transparent",
        )}
        style={{
          backgroundImage: cardGradient.backgroundImage,
          borderColor: cardGradient.borderColor,
        }}
      >
        <CardHeader className={compact ? "space-y-2 pb-3" : "space-y-3"}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <Badge
                  variant="outline"
                  className={cn(getRecommendationTagClassName(category), tone?.badge)}
                >
                  {category}
                </Badge>
              )}
              {typeof recommendationCount === "number" && (
                <Badge variant="secondary">추천 {recommendationCount}회</Badge>
              )}
            </div>
            <FavoriteButton recommendation={recommendation} />
          </div>
          <CardTitle className={cn(compact ? "text-base" : "text-lg", tone?.title)}>
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
          {recommendation.foodPairing && (
            <p className="text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">어울리는 안주:</span>{" "}
              {recommendation.foodPairing}
            </p>
          )}
          {recommendation.pairingReason && (
            <p className="text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">페어링 포인트:</span>{" "}
              {recommendation.pairingReason}
            </p>
          )}
        </CardContent>
      </Card>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="center" className="overflow-y-auto p-0">
          <SheetHeader className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <Badge
                  variant="outline"
                  className={cn(getRecommendationTagClassName(category), tone?.badge)}
                >
                  {category}
                </Badge>
              )}
              {detailPriceLabel && <Badge variant="secondary">{detailPriceLabel}</Badge>}
              {drinkDetail && <Badge variant="outline">도수 {drinkDetail.abv}%</Badge>}
            </div>
            <SheetTitle className="pr-10 text-xl">{recommendation.name}</SheetTitle>
            <SheetDescription className="pr-10 leading-6">
              {detailDescription}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-5 pb-5">
            {drinkDetail && (
              <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">영문 이름</p>
                  <p className="mt-1 text-sm">{drinkDetail.englishName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">가격대</p>
                  <p className="mt-1 text-sm">{detailPriceLabel}</p>
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
              <div>
                <p className="text-sm font-medium">추천 이유</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {recommendation.reason}
                </p>
              </div>
              {recommendation.servingTip && (
                <div>
                  <p className="text-sm font-medium">마시는 팁</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {recommendation.servingTip}
                  </p>
                </div>
              )}
              {recommendation.foodPairing && (
                <div>
                  <p className="text-sm font-medium">어울리는 안주</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {recommendation.foodPairing}
                  </p>
                </div>
              )}
              {recommendation.pairingReason && (
                <div>
                  <p className="text-sm font-medium">페어링 포인트</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {recommendation.pairingReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
