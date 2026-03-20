import PageContainer from "@/components/common/page-container";
import BeginnerPicks from "@/features/home/beginner-picks";
import HeroSection from "@/features/home/hero-sction";
import TodayRecommendation from "@/features/home/today-recommendation";

export const revalidate = 300;

export default function HomePage() {
  return (
    <PageContainer className="space-y-12">
      <HeroSection />
      <TodayRecommendation />
      <BeginnerPicks />
    </PageContainer>
  )
}
