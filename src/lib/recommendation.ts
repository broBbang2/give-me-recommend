import { Drink } from "@/types/drink";
import { UserAnswers } from "@/types/recommendation";

export function calculateDrinkScore(drink: Drink, answers: UserAnswers) {
  let score = 0;

  score += 5 - Math.abs(drink.sweetness - answers.sweetness);

  if (answers.sparkling !== "any" && drink.sparkling === answers.sparkling) {
    score += 3;
  }
  if (drink.situationTags.includes(answers.situation)) {
    score += 4;
  }
  if (answers.beginner === true && drink.difficulty <= 2) {
    score += 4;
  }
  if (answers.beginner === false && drink.difficulty >= 3) {
    score += 2;
  }

  if (answers.abv === "low" && drink.abv <= 15) score += 4;
  if (answers.abv === "medium" && drink.abv > 15 && drink.abv <= 25) score += 4;
  if (answers.abv === "high" && drink.abv > 25) score += 4;

  return score;
}

export function getRecommendedDrinks(drinks: Drink[], answers: UserAnswers) {
  const topRecommendations: Array<Drink & { score: number }> = [];

  for (const drink of drinks) {
    const scoredDrink = {
      ...drink,
      score: calculateDrinkScore(drink, answers),
    };

    const insertIndex = topRecommendations.findIndex(
      (item) => scoredDrink.score > item.score,
    );

    if (insertIndex === -1) {
      topRecommendations.push(scoredDrink);
    } else {
      topRecommendations.splice(insertIndex, 0, scoredDrink);
    }

    if (topRecommendations.length > 3) {
      topRecommendations.length = 3;
    }
  }

  return topRecommendations;
}
