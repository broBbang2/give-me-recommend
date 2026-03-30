import Link from "next/link";
import TodayVisitors from "@/features/home/today-visitors";

export default function HeroSection() {
  return (
    <section className="relative rounded-3xl border border-border/80 bg-card/70 px-6 py-12 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="absolute right-4 top-4 z-10">
        <TodayVisitors variant="compact" />
      </div>
      <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
        처음 마시는 한 잔,
        <br />
        취향에 맞게 추천해드려요
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        조용한 와인바 같은 분위기에서, 오늘 기분에 맞는 와인과 위스키,
        칵테일을 천천히 골라보세요.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/recommend"
          className="rounded-xl bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
        >
          추천 테스트 시작
        </Link>
        <Link
          href="/drinks"
          className="rounded-xl border border-border/80 bg-background/30 px-4 py-2 transition hover:bg-muted/60"
        >
          추천 둘러보기
        </Link>
      </div>
    </section>
  );
}
