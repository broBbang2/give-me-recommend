import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          오늘의 술 추천
        </Link>
        
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/drinks">술 둘러보기</Link>
          <Link href="/recommend">추천 테스트</Link>
          <Link href="/favorites">즐겨찾기</Link>
        </nav>
      </div>
    </header>
  )
}