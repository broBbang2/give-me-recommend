import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="rounded-3xl border px-6 py-12">
      <h1 className="text-4xl font-bold leading-tight">
        처음 마시는 한 잔,
        <br />
        취향에 맞게 추천해드려요
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        와인, 위스키, 칵테일을 쉽고 가볍게 탑색해보세요.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/recommend"
          className="rounded-xl bg-foreground px-4 py-2 text-background"
        >
          추천 테스트 시작
        </Link>
        <Link href="/drinks" className="rounded-xl border px-4 py-2">
          추천 둘러보기
        </Link>
      </div>
    </section>
  );
}
