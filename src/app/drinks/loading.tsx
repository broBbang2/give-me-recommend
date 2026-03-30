import PageContainer from "@/components/common/page-container";

function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return <div className={`animate-pulse rounded-2xl bg-muted/50 ${className}`} />;
}

export default function DrinksLoading() {
  return (
    <PageContainer className="space-y-8">
      <section className="rounded-3xl border bg-muted/20 p-6">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-9 w-56 md:w-72" />
          <SkeletonBlock className="h-4 w-full max-w-2xl" />
          <SkeletonBlock className="h-4 w-4/5 max-w-xl" />
        </div>
      </section>

      <section className="rounded-3xl border bg-background p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2 lg:w-56">
              <SkeletonBlock className="h-4 w-12" />
              <SkeletonBlock className="h-10 w-full rounded-lg" />
            </div>
          </div>

          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-16" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonBlock
                  key={`tag-skeleton-${index}`}
                  className="h-6 w-16 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <section
            key={`feed-skeleton-${index}`}
            className="overflow-hidden rounded-3xl border bg-background"
          >
            <div className="space-y-4 border-b bg-muted/20 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <SkeletonBlock className="h-7 w-48 md:w-72" />
                  <SkeletonBlock className="h-4 w-64 md:w-96" />
                </div>
                <SkeletonBlock className="h-6 w-28 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 2 }).map((_, badgeIndex) => (
                  <SkeletonBlock
                    key={`feed-tag-${index}-${badgeIndex}`}
                    className="h-6 w-16 rounded-full"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-20 w-full rounded-xl" />
              </div>
              <div className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <SkeletonBlock className="h-4 w-20" />
                    <SkeletonBlock className="h-4 w-56" />
                  </div>
                  <SkeletonBlock className="size-4 rounded-full" />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <nav className="flex items-center justify-center gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock
            key={`page-skeleton-${index}`}
            className="h-10 w-10 rounded-lg"
          />
        ))}
      </nav>
    </PageContainer>
  );
}
