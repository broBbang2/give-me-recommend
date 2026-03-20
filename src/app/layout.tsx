import "./globals.css";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";

export const metadata = {
  title: "오늘의 추천",
  description: "입문자를 위한 취향 기반 술 추천 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}