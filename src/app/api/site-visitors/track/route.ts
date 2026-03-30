import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  visitorId: z.string().trim().min(1).max(200),
});

function getKstDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, count: 0 }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, count: 0 }, { status: 200 });
  }

  const visitedDate = getKstDateString();
  const visitorId = parsed.data.visitorId;

  const { error: upsertError } = await supabase
    .from("site_visitors")
    .upsert(
      { visitor_id: visitorId, visited_date: visitedDate },
      { onConflict: "visitor_id,visited_date" },
    );

  if (upsertError) {
    // 카운트는 UX용이므로 실패해도 전체 흐름이 막히지 않게 합니다.
  }

  const { count, error: countError } = await supabase
    .from("site_visitors")
    .select("id", { count: "exact" })
    .eq("visited_date", visitedDate);

  if (countError) {
    return NextResponse.json({ ok: true, count: 0 }, { status: 200 });
  }

  return NextResponse.json({ ok: true, count: count ?? 0 }, { status: 200 });
}

