"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type RecommendationReadyDetail = {
  at: number;
};

const STORAGE_KEY = "choice_recommendation_ready_v1";

function safeParseJSON<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export default function RecommendationReadyNotifier() {
  const [visible, setVisible] = useState(false);
  const [readyAt, setReadyAt] = useState<number | null>(null);

  useEffect(() => {
    const readFromStorage = () => {
      const parsed = safeParseJSON<RecommendationReadyDetail>(
        window.localStorage.getItem(STORAGE_KEY),
      );
      if (!parsed?.at) return;
      setReadyAt(parsed.at);
      setVisible(true);
    };

    readFromStorage();

    const onReady = (event: Event) => {
      const detail = (event as CustomEvent<RecommendationReadyDetail>).detail;
      if (!detail?.at) return;
      setReadyAt(detail.at);
      setVisible(true);
    };

    window.addEventListener("recommendation-ready", onReady as EventListener);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      readFromStorage();
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(
        "recommendation-ready",
        onReady as EventListener,
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center p-3">
      <div className="w-full max-w-2xl rounded-2xl border bg-background/90 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-medium">추천 결과가 준비됐어요.</p>
            {readyAt ? (
              <p className="text-xs text-muted-foreground">
                {new Date(readyAt).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {"에"} 확인할 수 있어요.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                window.localStorage.removeItem(STORAGE_KEY);
                setVisible(false);
              }}
            >
              닫기
            </Button>

            <Button asChild type="button" size="sm">
              <Link
                href="/recommend"
                onClick={() => {
                  setVisible(false);
                }}
              >
                결과 보기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

