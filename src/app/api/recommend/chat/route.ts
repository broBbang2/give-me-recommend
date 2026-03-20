import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { normalizeRecommendationCategory } from "@/lib/drink-category";
import { toPlainText } from "@/lib/plain-text";
import { saveCommunityRecommendation } from "@/lib/community-recommendations";
import type {
  RecommendChatApiRequest,
  RecommendChatApiResponse,
  RecommendWeatherContext,
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
  weather: z
    .object({
      locationLabel: z.string().trim().min(1).max(100),
      todaySummary: z.string().trim().min(1).max(300),
      tomorrowSummary: z.string().trim().min(1).max(300),
    })
    .nullable()
    .optional(),
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
        foodPairing: z.string().nullable(),
        pairingReason: z.string().nullable(),
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
12. 각 recommendation에는 술과 함께 곁들이기 좋은 안주를 foodPairing에 1개씩 적고, pairingReason에 잘 어울리는 이유를 짧게 적습니다.
13. category는 다음 중 가장 알맞은 한국어 표현으로만 작성합니다: 레드와인, 화이트와인, 스파클링와인, 와인, 위스키, 칵테일.
14. 화이트 와인 계열은 절대 "와인"으로 뭉뚱그리지 말고 반드시 "화이트와인"으로 작성합니다.
15. 레드 와인 계열은 반드시 "레드와인"으로 작성합니다.
16. 하이볼과 리큐르 계열은 category를 따로 만들지 말고 반드시 "칵테일"로 작성합니다.
17. weather 정보가 주어지면 오늘과 내일 날씨 차이를 자연스럽게 반영해 추천합니다.
18. 답변에는 마크다운 문법을 사용하지 않습니다. 제목, 목록 기호, 굵은 글씨, 코드 블록 없이 순수 텍스트로만 작성합니다.
19. reply에는 category:, reason:, servingTip:, foodPairing:, pairingReason: 같은 필드명이나 구조화된 나열을 쓰지 않고 자연스러운 문장으로만 설명합니다.
20. 추천 상세 이유, 마시는 팁, 안주 페어링은 recommendations 필드에 작성하고, reply는 짧고 부드러운 안내 문장 위주로 작성합니다.
21. 과도한 음주를 권장하지 말고, 무리 없는 표현을 사용합니다.
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

  const normalizedRecommendations: RecommendedDrinkItem[] = [];
  const seenNames = new Set<string>();

  for (const item of recommendations) {
    const name = toPlainText(item.name);
    const reason = toPlainText(item.reason);

    if (!name || !reason) {
      continue;
    }

    const normalizedName = name.toLowerCase();

    if (seenNames.has(normalizedName)) {
      continue;
    }

    seenNames.add(normalizedName);
    normalizedRecommendations.push({
      ...item,
      name,
      category: normalizeRecommendationCategory(item.category),
      reason,
      servingTip: toPlainText(item.servingTip) || null,
      foodPairing: toPlainText(item.foodPairing) || null,
      pairingReason: toPlainText(item.pairingReason) || null,
      existingDrinkId: null,
    });

    if (normalizedRecommendations.length === 3) {
      break;
    }
  }

  return normalizedRecommendations;
}

function hasStructuredReplyFormat(reply: string) {
  return /\b(category|reason|servingTip|foodPairing|pairingReason|existingDrinkId)\s*:/i.test(reply);
}

function trimSentence(text: string) {
  return text.replace(/[.!?。]+\s*$/g, "").trim();
}

function buildPlainReply(recommendations: RecommendedDrinkItem[]) {
  if (recommendations.length === 0) {
    return "";
  }

  if (recommendations.length === 1) {
    const [item] = recommendations;
    const reason = trimSentence(toPlainText(item.reason));
    const servingTip = trimSentence(toPlainText(item.servingTip));

    return `${item.name}을 추천드릴게요. ${reason}${servingTip ? ` ${servingTip}` : ""}`;
  }

  const names = recommendations.map((item) => item.name).join(", ");
  const descriptions = recommendations
    .map((item) => `${item.name}은 ${trimSentence(toPlainText(item.reason))}`)
    .join(" ");

  return `추천드릴 만한 술은 ${names}입니다. ${descriptions} 마음에 가는 스타일이 있으면 그쪽으로 더 좁혀드릴게요.`;
}

function normalizeReply(
  reply: string,
  recommendations: RecommendedDrinkItem[],
  needsMoreInfo: boolean,
) {
  const plainReply = toPlainText(reply);

  if (needsMoreInfo || recommendations.length === 0) {
    return plainReply;
  }

  if (hasStructuredReplyFormat(plainReply)) {
    return buildPlainReply(recommendations);
  }

  return plainReply;
}

function normalizeWeatherContext(
  weather: RecommendChatApiRequest["weather"],
): RecommendWeatherContext | null {
  if (!weather) {
    return null;
  }

  return {
    locationLabel: toPlainText(weather.locationLabel),
    todaySummary: toPlainText(weather.todaySummary),
    tomorrowSummary: toPlainText(weather.tomorrowSummary),
  };
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as RecommendChatApiRequest;
    const { messages, weather } = requestSchema.parse(json);
    const client = getClient();
    const normalizedWeather = normalizeWeatherContext(weather);
    const weatherContextMessage = normalizedWeather
      ? `참고할 날씨 정보:
위치: ${normalizedWeather.locationLabel}
${normalizedWeather.todaySummary}
${normalizedWeather.tomorrowSummary}`
      : null;

    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...(weatherContextMessage
          ? [
              {
                role: "system" as const,
                content: weatherContextMessage,
              },
            ]
          : []),
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
    const normalizedReply = normalizeReply(
      parsed.reply,
      normalizedRecommendations,
      parsed.needsMoreInfo,
    );

    const communitySaved = parsed.needsMoreInfo
      ? false
      : await saveCommunityRecommendation({
          promptSummary: toPlainText(parsed.promptSummary),
          userTasteSummary: toPlainText(parsed.userTasteSummary),
          assistantReply: normalizedReply,
          recommendations: normalizedRecommendations,
        });

    const payload: RecommendChatApiResponse = {
      reply: normalizedReply,
      needsMoreInfo: parsed.needsMoreInfo,
      followUpQuestion: toPlainText(parsed.followUpQuestion) || null,
      promptSummary: toPlainText(parsed.promptSummary),
      userTasteSummary: toPlainText(parsed.userTasteSummary),
      recommendations: normalizedRecommendations,
      weather: normalizedWeather,
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
