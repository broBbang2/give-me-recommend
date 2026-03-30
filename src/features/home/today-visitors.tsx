import SectionTitle from "@/components/common/section-title";
import VisitorTracker from "@/features/home/visitor-tracker";
import { getTodayVisitorCount } from "@/lib/site-visitors";

export default async function TodayVisitors({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const count = await getTodayVisitorCount();

  if (variant === "compact") {
    return (
      <div className="w-fit rounded-2xl border border-border/70 bg-background/35 px-3 py-2 text-right">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          오늘의 방문자
        </p>
        <div className="mt-1 flex justify-end">
          <VisitorTracker initialCount={count} size="sm" />
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-border/70 bg-card/45 p-6">
      <SectionTitle
        title="오늘의 방문자"
        description="하루 동안 Choice를 둘러본 고유 방문자를 집계해요."
      />
      <VisitorTracker initialCount={count} />
    </section>
  );
}

