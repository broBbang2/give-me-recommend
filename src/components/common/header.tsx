import Image from "next/image";
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
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-lg font-bold sm:text-xl"
        >
          <Image
            src="/images/breadee.png"
            alt="빵이의 추천 로고"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
          />
          <span className="truncate">빵이의 추천</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link href="/drinks">추천 둘러보기</Link>
          <Link href="/recommend">추천 테스트</Link>
          <Link href="/favorites">즐겨찾기</Link>
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
          <SheetContent side="right" className="w-72">
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