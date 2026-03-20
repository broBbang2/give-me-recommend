import RecommendationCard from "@/components/drink/recommendation-card";
import SectionTitle from "@/components/common/section-title";
import { getCommunityRecommendations } from "@/lib/community-recommendations";
import { drinks } from "@/data/drinks";
import { fetchWeatherContext, weatherRegionOptions } from "@/lib/weather";
import TodayWeatherTabs from "@/features/home/today-weather-tabs";
import type { Drink } from "@/types/drink";
import type { RecommendedDrinkItem } from "@/types/recommendation";

function getRotatingRecommendation(recommendations: RecommendedDrinkItem[]) {
  if (recommendations.length === 0) {
    return null;
  }

  const intervalMs = 5 * 60 * 1000;
  const currentBucket = Math.floor(Date.now() / intervalMs);
  const recommendationIndex = currentBucket % recommendations.length;

  return recommendations[recommendationIndex] ?? null;
}

function buildWeatherRecommendation(drink: Drink, reason: string): RecommendedDrinkItem {
  const foodPairing = drink.foodPairings[0] ?? null;

  return {
    name: drink.name,
    category: drink.category,
    reason,
    servingTip: drink.beginnerTip,
    foodPairing,
    pairingReason: foodPairing
      ? `${foodPairing}처럼 부담이 적은 안주와 함께하면 지금 날씨에 더 편하게 즐기기 좋아요.`
      : null,
    existingDrinkId: drink.id,
  };
}

function getWeatherBasedRecommendation(summary: string) {
  if (summary.includes("강한 비") || summary.includes("비 가능성이 높습니다")) {
    return {
      drink: drinks.find((drink) => drink.id === "jameson") ?? drinks[2],
      reason:
        "오늘처럼 비 기운이 느껴지는 날엔 제임슨처럼 부드럽지만 따뜻한 인상이 있는 술이 편안하게 어울려요.",
    };
  }

  if (summary.includes("눈") || summary.includes("추운 날씨")) {
    return {
      drink: drinks.find((drink) => drink.id === "baileys") ?? drinks[4],
      reason:
        "추운 날씨에는 베일리스처럼 크리미하고 달콤한 스타일이 디저트처럼 편안하게 느껴질 수 있어요.",
    };
  }

  if (summary.includes("더운 날씨") || summary.includes("따뜻한 날씨")) {
    return {
      drink: drinks.find((drink) => drink.id === "mojito") ?? drinks[1],
      reason:
        "따뜻하거나 더운 날씨엔 모히또처럼 민트와 라임의 청량감이 살아 있는 칵테일이 훨씬 시원하게 느껴져요.",
    };
  }

  if (summary.includes("선선한 날씨") || summary.includes("쌀쌀한 날씨")) {
    return {
      drink: drinks.find((drink) => drink.id === "moscato-dasti") ?? drinks[0],
      reason:
        "선선한 날엔 모스카토 다스티처럼 향긋하고 가볍게 즐길 수 있는 와인이 부담 없이 잘 맞아요.",
    };
  }

  return {
    drink: drinks.find((drink) => drink.id === "highball") ?? drinks[3],
    reason:
      "오늘 같은 날엔 하이볼처럼 산뜻하고 가볍게 마실 수 있는 술이 식사 전후로도 잘 어울려요.",
  };
}

export default async function TodayRecommendation() {
  const defaultRegion = weatherRegionOptions[0];
  let weatherTabs:
    | {
        locationLabel: string;
        items: Array<{
          key: "today" | "tomorrow";
          day: Awaited<ReturnType<typeof fetchWeatherContext>>["today"];
          recommendation: RecommendedDrinkItem;
        }>;
      }
    | null = null;
  let todayRecommendation: RecommendedDrinkItem | null = null;

  try {
    const weatherContext = await fetchWeatherContext({
      latitude: defaultRegion.latitude,
      longitude: defaultRegion.longitude,
      locationLabel: defaultRegion.label,
    });
    const todayPick = getWeatherBasedRecommendation(weatherContext.todaySummary);
    const tomorrowPick = getWeatherBasedRecommendation(weatherContext.tomorrowSummary);

    weatherTabs = {
      locationLabel: defaultRegion.label,
      items: [
        {
          key: "today",
          day: weatherContext.today,
          recommendation: buildWeatherRecommendation(todayPick.drink, todayPick.reason),
        },
        {
          key: "tomorrow",
          day: weatherContext.tomorrow,
          recommendation: buildWeatherRecommendation(tomorrowPick.drink, tomorrowPick.reason),
        },
      ],
    };
    todayRecommendation = weatherTabs.items[0]?.recommendation ?? null;
  } catch {
    const recentRecommendations = await getCommunityRecommendations({ limit: 12 });
    const rotatingRecommendations = [...new Map(
      recentRecommendations
        .flatMap((item) => item.recommendations)
        .map((recommendation) => [recommendation.name.trim().toLowerCase(), recommendation]),
    ).values()];

    todayRecommendation = getRotatingRecommendation(rotatingRecommendations);
  }

  return (
    <section className="rounded-3xl border border-border/70 bg-card/45 p-6">
      <SectionTitle
        title="오늘의 추천"
        description={weatherTabs ? "오늘과 내일 날씨를 나눠서 보여드려요." : "최근 추천 결과를 보여드려요."}
      />
      {todayRecommendation ? (
        weatherTabs ? (
          <TodayWeatherTabs
            locationLabel={weatherTabs.locationLabel}
            items={weatherTabs.items}
          />
        ) : (
          <RecommendationCard recommendation={todayRecommendation} />
        )
      ) : (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          아직 저장된 추천 결과가 없어요. AI 추천을 완료하면 이곳에 최신 추천이
          표시됩니다.
        </div>
      )}
    </section>
  );
}
