import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

function getKstDateString(date = new Date()) {
  // en-CA 포맷을 쓰면 YYYY-MM-DD 형태로 안정적으로 들어옵니다.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function getTodayVisitorCount() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return 0;

  const visitedDate = getKstDateString();

  const { count, error } = await supabase
    .from("site_visitors")
    .select("id", { count: "exact" })
    .eq("visited_date", visitedDate);

  if (error) {
    // count 정확도/쿼리 오류가 있어도 UI는 비워서 깨지지 않도록 0으로 fallback합니다.
    return 0;
  }

  return count ?? 0;
}

