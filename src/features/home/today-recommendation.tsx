import { drinks } from "@/data/drinks";
import DrinkCard from "@/components/drink/drink-card";
import SectionTitle from "@/components/common/section-title";

export default function TodayRecommendation() {
  const todayDrink = drinks[0];

  return (
    <section>
      <SectionTitle
        title="오늘의 술 추천"
        description="입문자도 부담 없이 시작할 수 있는 한 잔"
      />
      <DrinkCard drink={todayDrink} />
    </section>
  );
}
