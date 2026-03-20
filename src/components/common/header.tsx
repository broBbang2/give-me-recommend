import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-lg font-bold tracking-tight sm:text-xl"
        >
          <span className="truncate">알초추</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
          <Link href="/recommend" className="transition hover:text-foreground">추천 테스트</Link>
          <Link href="/drinks" className="transition hover:text-foreground">추천 둘러보기</Link>
          <Link href="/favorites" className="transition hover:text-foreground">즐겨찾기</Link>
        </nav>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="메뉴 열기"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 border-border/80 bg-card/95">
            <SheetHeader>
              <SheetTitle>메뉴</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 px-4 pb-4">
              <Link href="/drinks" className="rounded-lg px-3 py-2 hover:bg-muted">
                술 둘러보기
              </Link>
              <Link href="/recommend" className="rounded-lg px-3 py-2 hover:bg-muted">
                추천 테스트
              </Link>
              <Link href="/favorites" className="rounded-lg px-3 py-2 hover:bg-muted">
                즐겨찾기
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}