"use client";

import { useState } from "react";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  Snowflake,
  Sun,
} from "lucide-react";
import RecommendationCard from "@/components/drink/recommendation-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WeatherDaySnapshot } from "@/lib/weather";
import type { RecommendedDrinkItem } from "@/types/recommendation";

interface WeatherTabItem {
  key: "today" | "tomorrow";
  day: WeatherDaySnapshot;
  recommendation: RecommendedDrinkItem;
}

interface TodayWeatherTabsProps {
  locationLabel: string;
  items: WeatherTabItem[];
}

function WeatherIcon({
  iconKey,
  className,
}: {
  iconKey: WeatherDaySnapshot["iconKey"];
  className?: string;
}) {
  if (iconKey === "sunny") {
    return <Sun className={className} />;
  }

  if (iconKey === "rainy") {
    return <CloudRain className={className} />;
  }

  if (iconKey === "snowy") {
    return <Snowflake className={className} />;
  }

  if (iconKey === "stormy") {
    return <CloudLightning className={className} />;
  }

  if (iconKey === "foggy") {
    return <CloudFog className={className} />;
  }

  return <Cloud className={className} />;
}

function TemperatureRange({ day }: { day: WeatherDaySnapshot }) {
  if (day.minTemperature === null || day.maxTemperature === null) {
    return <span>-</span>;
  }

  return (
    <span>
      {day.minTemperature} - {day.maxTemperature}°
    </span>
  );
}

export default function TodayWeatherTabs({
  locationLabel,
  items,
}: TodayWeatherTabsProps) {
  const [activeTab, setActiveTab] = useState<WeatherTabItem["key"]>("today");
  const activeItem =
    items.find((item) => item.key === activeTab) ?? items[0];

  if (!activeItem) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-background/60 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {locationLabel}
          </p>
          <div className="inline-flex rounded-xl border border-border/70 bg-muted/40 p-1">
            {items.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant={activeTab === item.key ? "secondary" : "ghost"}
                size="sm"
                className="rounded-lg"
                onClick={() => setActiveTab(item.key)}
              >
                {item.day.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-card/70">
            <WeatherIcon
              iconKey={activeItem.day.iconKey}
              className="size-6 text-primary"
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{activeItem.day.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/70 px-2 py-1">
                <TemperatureRange day={activeItem.day} />
              </span>
              <span className="rounded-full border border-border/70 px-2 py-1">
                {activeItem.day.mood}
              </span>
              {activeItem.day.precipitationProbability !== null && (
                <span className="rounded-full border border-border/70 px-2 py-1">
                  비 {activeItem.day.precipitationProbability}%
                </span>
              )}
            </div>
          </div>
          <div
            className={cn(
              "hidden rounded-full border px-3 py-1 text-xs text-muted-foreground sm:block",
            )}
          >
            {activeItem.day.label}
          </div>
        </div>
      </div>

      <RecommendationCard recommendation={activeItem.recommendation} />
    </div>
  );
}
