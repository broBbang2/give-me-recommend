import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { saveCommunityRecommendation } from "@/lib/community-recommendations";
import type {
  RecommendChatApiRequest,
  RecommendChatApiResponse,
  RecommendedDrinkItem,
} from "@/types/recommendation";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

const responseSchema = z.object({
  reply: z.string(),
  needsMoreInfo: z.boolean(),
  followUpQuestion: z.string().nullable(),
  promptSummary: z.string(),
  userTasteSummary: z.string(),
  recommendations: z
    .array(
      z.object({
        name: z.string(),
        category: z.string().nullable(),
        reason: z.string(),
        servingTip: z.string().nullable(),
        existingDrinkId: z.string().nullable(),
      }),
    )
    .max(3),
});

const systemPrompt = `
당신은 한국어로 대화하는 술 추천 어시스턴트입니다.
사용자의 취향을 파악해 초보자도 이해하기 쉬운 표현으로 추천하세요.

규칙:
1. 항상 한국어로 답변합니다.
2. 정보가 부족하면 한 번에 질문은 하나만 합니다.
3. 충분한 정보가 모이면 추천 3개 이하를 제안합니다.
4. recommendations에는 실제 추천 술을 1~3개 넣습니다.
5. existingDrinkId는 현재 사용하지 않으므로 항상 null로 둡니다.
6. reply는 사용자에게 바로 보여줄 자연스러운 답변이어야 합니다.
7. needsMoreInfo가 true면 recommendations는 빈 배열이어야 합니다.
8. needsMoreInfo가 false면 followUpQuestion은 null이어야 합니다.
9. promptSummary는 커뮤니티 피드 카드에 들어갈 한 줄 요약입니다. 예: "달달하고 도수 낮은 데이트용 술 추천".
10. 각 recommendation의 reason에는 왜 이 술이 어울리는지 구체적으로 적습니다.
11. category와 servingTip은 가능하면 채웁니다.
12. 과도한 음주를 권장하지 말고, 무리 없는 표현을 사용합니다.
`.trim();

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function normalizeRecommendations(
  recommendations: RecommendedDrinkItem[],
  needsMoreInfo: boolean,
) {
  if (needsMoreInfo) {
    return [] satisfies RecommendedDrinkItem[];
  }

  return recommendations
    .map((item) => {
      return {
        ...item,
        name: item.name.trim(),
        category: item.category?.trim() || null,
        reason: item.reason.trim(),
        servingTip: item.servingTip?.trim() || null,
        existingDrinkId: null,
      } satisfies RecommendedDrinkItem;
    })
    .filter((item) => item.name && item.reason)
    .filter(
      (item, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.name.toLowerCase() === item.name.toLowerCase(),
        ) === index,
    )
    .slice(0, 3);
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as RecommendChatApiRequest;
    const { messages } = requestSchema.parse(json);
    const client = getClient();

    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      store: false,
      text: {
        format: zodTextFormat(responseSchema, "drink_recommendation_response"),
      },
    });

    const parsed = response.output_parsed;

    if (!parsed) {
      return NextResponse.json(
        { message: "추천 응답을 해석하지 못했습니다." },
        { status: 502 },
      );
    }

    const normalizedRecommendations = normalizeRecommendations(
      parsed.recommendations,
      parsed.needsMoreInfo,
    );

    const communitySaved = parsed.needsMoreInfo
      ? false
      : await saveCommunityRecommendation({
          promptSummary: parsed.promptSummary,
          userTasteSummary: parsed.userTasteSummary,
          assistantReply: parsed.reply,
          recommendations: normalizedRecommendations,
        });

    const payload: RecommendChatApiResponse = {
      reply: parsed.reply,
      needsMoreInfo: parsed.needsMoreInfo,
      followUpQuestion: parsed.followUpQuestion,
      promptSummary: parsed.promptSummary,
      userTasteSummary: parsed.userTasteSummary,
      recommendations: normalizedRecommendations,
      communitySaved,
    };

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "잘못된 추천 요청 형식입니다." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error &&
      error.message === "OPENAI_API_KEY is not configured."
        ? "서버에 OPENAI_API_KEY가 설정되지 않았습니다."
        : "추천 요청 처리 중 오류가 발생했습니다.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
