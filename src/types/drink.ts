export type DrinkCategory =
  | "red-wine"
  | "white-wine"
  | "whisky"
  | "cocktail"
  | "liqueur"
  | "highball";

export type PriceRange = "low" | "medium" | "high";

export type SituationTag =
  | "date"
  | "home-party"
  | "solo"
  | "gift"
  | "meal";

export type TasteTag =
  | "sweet"
  | "sour"
  | "bitter"
  | "fruity"
  | "smooth"
  | "sparkling"
  | "dry";

export interface Drink {
  id: string;
  name: string;
  englishName: string;
  category: DrinkCategory;
  imageUrl: string;
  abv: number;
  priceRange: PriceRange;
  difficulty: 1 | 2 | 3 | 4 | 5;
  sweetness: number;
  acidity: number;
  bitterness: number;
  body: number;
  sparkling: boolean;
  tasteTags: TasteTag[];
  situationTags: SituationTag[];
  description: string;
  recommendationReason: string;
  foodPairings: string[];
  beginnerTip: string;
}