import { SituationTag } from "./drink";

export interface UserAnswers {
  sweetness: number;
  abv: "low" | "medium" | "high";
  sparkling: boolean | "any";
  situation: SituationTag;
  beginner: boolean | "any";
}

export interface QuestionOption<T = string | number | boolean> {
  label: string;
  value: T;
}

export interface QuestionItem {
  id: keyof UserAnswers;
  question: string;
  options: QuestionOption[];
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
  existingDrinkId: string | null;
}

export interface RecommendChatApiRequest {
  messages: Array<Pick<RecommendChatMessage, "role" | "content">>;
}

export interface RecommendChatApiResponse {
  reply: string;
  needsMoreInfo: boolean;
  followUpQuestion: string | null;
  promptSummary: string;
  userTasteSummary: string;
  recommendations: RecommendedDrinkItem[];
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