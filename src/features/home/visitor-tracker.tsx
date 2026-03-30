"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "choice_site_visitor_id_v1";

function getOrCreateVisitorId() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const created = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, created);
  return created;
}

export default function VisitorTracker({
  initialCount,
  size = "lg",
}: {
  initialCount: number;
  size?: "lg" | "sm";
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        const res = await fetch("/api/site-visitors/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
        });

        if (!res.ok) return;

        const data = (await res.json()) as { ok?: boolean; count?: number };
        if (typeof data.count === "number" && !cancelled) {
          setCount(data.count);
        }
      } catch {
        // 카운트는 UX용이므로 실패해도 페이지가 깨지지 않게 합니다.
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const countClass =
    size === "sm" ? "text-2xl font-bold" : "text-4xl font-bold tracking-tight";
  const unitClass = size === "sm" ? "text-[10px] text-muted-foreground" : "text-sm text-muted-foreground";

  return (
    <div className="flex items-baseline gap-2">
      <span className={countClass}>{count.toLocaleString("ko-KR")}</span>
      <span className={unitClass}>명</span>
    </div>
  );
}

