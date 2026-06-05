"use client";

import { useEffect } from "react";

const STORAGE_KEY = "choice_site_visitor_id_v1";

function getOrCreateVisitorId() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const created = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, created);
  return created;
}

export default function VisitorTracker() {
  useEffect(() => {
    const run = async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        await fetch("/api/site-visitors/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
        });
      } catch {
        // 카운트는 UX용이므로 실패해도 페이지에 영향을 주지 않습니다.
      }
    };

    void run();
  }, []);

  return null;
}
