import { create } from "zustand";
import {
  RecommendChatApiResponse,
  RecommendChatMessage,
  RecommendChatRole,
  RecommendWeatherContext,
  RecommendedDrinkItem,
} from "@/types/recommendation";

const initialAssistantMessageContent =
  "안녕하세요. 어떤 분위기에서 마실 술을 찾고 계신가요? 좋아하는 맛이나 도수, 평소 잘 마시는 술이 있다면 편하게 알려주세요.";

function createInitialAssistantMessage(): RecommendChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: initialAssistantMessageContent,
  };
}

interface RecommendationState {
  messages: RecommendChatMessage[];
  recommendations: RecommendedDrinkItem[];
  promptSummary: string;
  userTasteSummary: string;
  weather: RecommendWeatherContext | null;
  communitySaved: boolean;
  status: "idle" | "loading" | "error";
  error: string | null;
  addMessage: (role: RecommendChatRole, content: string) => void;
  startRequest: (userMessage: string) => void;
  finishRequest: (payload: RecommendChatApiResponse) => void;
  failRequest: (error: string) => void;
  setRecommendations: (recommendations: RecommendedDrinkItem[]) => void;
  setPromptSummary: (summary: string) => void;
  setUserTasteSummary: (summary: string) => void;
  setCommunitySaved: (saved: boolean) => void;
  setStatus: (status: RecommendationState["status"]) => void;
  setError: (error: string | null) => void;
  resetConversation: () => void;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  messages: [createInitialAssistantMessage()],
  recommendations: [],
  promptSummary: "",
  userTasteSummary: "",
  weather: null,
  communitySaved: false,
  status: "idle",
  error: null,
  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role,
          content,
        },
      ],
    })),
  startRequest: (userMessage) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: userMessage,
        },
      ],
      recommendations: [],
      promptSummary: "",
      userTasteSummary: "",
      weather: null,
      communitySaved: false,
      status: "loading",
      error: null,
    })),
  finishRequest: (payload) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.reply,
        },
      ],
      recommendations: payload.recommendations,
      promptSummary: payload.promptSummary,
      userTasteSummary: payload.userTasteSummary,
      weather: payload.weather,
      communitySaved: payload.communitySaved,
      status: "idle",
      error: null,
    })),
  failRequest: (error) =>
    set({
      status: "error",
      error,
    }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setPromptSummary: (promptSummary) => set({ promptSummary }),
  setUserTasteSummary: (userTasteSummary) => set({ userTasteSummary }),
  setCommunitySaved: (communitySaved) => set({ communitySaved }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  resetConversation: () =>
    set({
      messages: [createInitialAssistantMessage()],
      recommendations: [],
      promptSummary: "",
      userTasteSummary: "",
      weather: null,
      communitySaved: false,
      status: "idle",
      error: null,
    }),
}));