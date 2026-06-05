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
import NavLink from "@/components/common/nav-link";

const navItems = [
  { href: "/recommend", label: "추천 테스트" },
  { href: "/drinks", label: "추천 둘러보기" },
  { href: "/favorites", label: "즐겨찾기" },
];

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
          {navItems.map(({ href, label }) => (
            <NavLink key={href} href={href} className="transition hover:text-foreground">
              {label}
            </NavLink>
          ))}
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
              {navItems.map(({ href, label }) => (
                <NavLink
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-2 hover:bg-muted"
                  activeClassName="bg-muted font-medium text-foreground"
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}