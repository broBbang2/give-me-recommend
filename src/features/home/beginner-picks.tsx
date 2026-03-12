import { drinks } from "@/data/drinks";
import DrinkCard from "@/components/drink/drink-card";
import SectionTitle from "@/components/common/section-title";

export default function BeginnerPicks() {
  const beginnerDrinks = drinks.filter((drink) => drink.difficulty <= 2);

  return (
    <section>
      <SectionTitle title="입문자 추천" />
      <div className="grid gap-4 md:grid-clos-2 xl:grid-clos-3">
        {beginnerDrinks.map((drinks) => (
          <DrinkCard key={drinks.id} drink={drinks} />
        ))}
      </div>
    </section>
  );
}
