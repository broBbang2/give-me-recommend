"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getRecommendationTagClassName } from "@/lib/drink-category";

type SortOption = {
  value: "latest" | "oldest" | "most-recommendations";
  label: string;
};

interface CommunityFeedControlsProps {
  initialKeyword: string;
  initialSort: SortOption["value"];
  initialTag: string;
  availableTags: string[];
  sortOptions: readonly SortOption[];
}

export default function CommunityFeedControls({
  initialKeyword,
  initialSort,
  initialTag,
  availableTags,
  sortOptions,
}: CommunityFeedControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(initialKeyword);
  const appliedKeyword = searchParams.get("q")?.trim() ?? initialKeyword;

  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  const currentSort = useMemo(() => {
    const sort = searchParams.get("sort");
    return sortOptions.some((option) => option.value === sort)
      ? (sort as SortOption["value"])
      : initialSort;
  }, [initialSort, searchParams, sortOptions]);

  const currentTag = searchParams.get("tag") ?? initialTag;
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const currentQueryString = searchParams.toString();
    const params = new URLSearchParams(currentQueryString);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    const queryString = params.toString();

    if (queryString === currentQueryString) {
      return;
    }

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const normalizedKeyword = keyword.trim();

    if (normalizedKeyword === appliedKeyword) {
      return;
    }

    const timeout = window.setTimeout(() => {
      updateParams({
        q: normalizedKeyword || null,
        page: null,
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [appliedKeyword, keyword, updateParams]);

  return (
    <section className="rounded-3xl border bg-background p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium" htmlFor="community-search">
              키워드 검색
            </label>
            <Input
              id="community-search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="예: 달달한 술, 혼술, 와인, 데이트"
              className="h-10"
            />
          </div>

          <div className="space-y-2 lg:w-56">
            <label className="text-sm font-medium" htmlFor="community-sort">
              정렬
            </label>
            <select
              id="community-sort"
              value={currentSort}
              onChange={(event) =>
                updateParams({
                  sort: event.target.value,
                  page: null,
                })
              }
              className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">주종 태그</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                updateParams({
                  tag: null,
                  page: null,
                })
              }
            >
              <Badge variant={currentTag ? "outline" : "secondary"}>전체</Badge>
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  updateParams({
                    tag: currentTag === tag ? null : tag,
                    page: null,
                  })
                }
              >
                <Badge
                  variant={currentTag === tag ? "secondary" : "outline"}
                  className={getRecommendationTagClassName(tag)}
                >
                  {tag}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
