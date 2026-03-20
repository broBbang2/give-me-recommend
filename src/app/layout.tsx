import "./globals.css";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";

export const metadata = {
  title: "알초추",
  description: "초보들을 위한 알코올 추천과 안주 추천을 해드려요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}