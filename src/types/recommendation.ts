import { SituationTag } from "./drink";

export interface UserAnswers {
  sweetness: number;
  abv: "low" | "medium" | "high";
  sparkling: boolean | "any";
  situation: SituationTag;
  beginner: boolean | "any";
}

export interface QuestionOption<T = string> {
  label: string;
  value: T;
}

export interface SurveyQuestion {
  id: number;
  question: string;
  options: QuestionOption<string>[];
}

export interface SurveyAnswer {
  questionId: number;
  question: string;
  label: string;
  value: string;
}

export type RecommendChatRole = "user" | "assistant";

export interface RecommendChatMessage {
  id: string;
  role: RecommendChatRole;
  content: string;
}

export interface RecommendedDrinkItem {
  name: string;
  category: string | null;
  reason: string;
  servingTip: string | null;
  foodPairing: string | null;
  pairingReason: string | null;
  existingDrinkId: string | null;
}

export interface FavoriteRecommendation extends RecommendedDrinkItem {
  favoriteId: string;
  savedAt: string;
}

export interface RecommendWeatherContext {
  locationLabel: string;
  todaySummary: string;
  tomorrowSummary: string;
}

export interface RecommendChatApiRequest {
  messages: Array<Pick<RecommendChatMessage, "role" | "content">>;
  weather?: RecommendWeatherContext | null;
}

export interface RecommendChatApiResponse {
  reply: string;
  needsMoreInfo: boolean;
  followUpQuestion: string | null;
  promptSummary: string;
  userTasteSummary: string;
  recommendations: RecommendedDrinkItem[];
  weather: RecommendWeatherContext | null;
  communitySaved: boolean;
}

export interface CommunityRecommendation {
  id: string;
  createdAt: string;
  promptSummary: string;
  userTasteSummary: string;
  assistantReply: string;
  recommendations: RecommendedDrinkItem[];
  primaryDrinkId: string | null;
  primaryDrinkName: string | null;
  isPublic: boolean;
}

export interface PopularRecommendationItem extends RecommendedDrinkItem {
  recommendationCount: number;
}