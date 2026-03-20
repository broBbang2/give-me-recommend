"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import PageContainer from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import RecommendationCard from "@/components/drink/recommendation-card";
import QuestionCard from "@/features/recommend/question-card";
import { survey } from "@/data/questions";
import { useRecommendationStore } from "@/stores/recommendation-store";
import { Progress } from "@/components/ui/progress";
import type {
  RecommendChatApiRequest,
  RecommendChatApiResponse,
  RecommendChatMessage,
  SurveyAnswer,
} from "@/types/recommendation";

const suggestedQuestions = [
  "달달하고 도수가 낮은 술 추천해줘",
  "혼술할 때 가볍게 마시기 좋은 술 추천해줘",
  "데이트할 때 분위기 좋은 술 추천해줘",
  "와인 입문자가 마시기 좋은 술 추천해줘",
];

type RecommendMode = "chat" | "survey";

function buildSurveyPrompt(answers: SurveyAnswer[]) {
  const answerLines = answers
    .map((answer) => `- ${answer.question}: ${answer.label}`)
    .join("\n");

  return [
    "아래 설문 응답을 바탕으로 사용자의 취향에 맞는 술을 추천해주세요.",
    "각 응답은 이미 확정된 답변이므로 추가 질문 없이 바로 추천해도 됩니다.",
    "설문 응답:",
    answerLines,
  ].join("\n");
}

export default function RecommendPage() {
  const [mode, setMode] = useState<RecommendMode>("chat");
  const [input, setInput] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<
    Record<number, SurveyAnswer>
  >({});
  const {
    messages,
    recommendations,
    promptSummary,
    userTasteSummary,
    communitySaved,
    status,
    error,
    startRequest,
    finishRequest,
    failRequest,
    resetConversation,
  } = useRecommendationStore();
  const currentQuestion = survey[currentQuestionIndex];
  const selectedValue = currentQuestion
    ? answersByQuestionId[currentQuestion.id]?.value
    : undefined;
  const orderedAnswers = useMemo(
    () =>
      survey
        .map((question) => answersByQuestionId[question.id])
        .filter((answer): answer is SurveyAnswer => Boolean(answer)),
    [answersByQuestionId],
  );
  const progressValue =
    survey.length > 0 ? ((currentQuestionIndex + 1) / survey.length) * 100 : 0;

  const requestRecommendation = async (
    nextMessages: RecommendChatApiRequest["messages"],
    userMessage: string,
  ) => {
    startRequest(userMessage);

    try {
      const response = await fetch("/api/recommend/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
        } satisfies RecommendChatApiRequest),
      });

      const data = (await response.json()) as
        | RecommendChatApiResponse
        | { message?: string };

      if (!response.ok) {
        const errorMessage =
          "message" in data
            ? data.message ?? "추천 요청에 실패했습니다."
            : "추천 요청에 실패했습니다.";

        throw new Error(errorMessage);
      }

      const payload = data as RecommendChatApiResponse;

      finishRequest(payload);

      if (payload.recommendations.length > 0) {
        window.requestAnimationFrame(() => {
          setIsResultModalOpen(true);
        });
      }
    } catch (submitError) {
      failRequest(
        submitError instanceof Error
          ? submitError.message
          : "추천 요청에 실패했습니다.",
      );
    }
  };

  const submitChatMessage = async (message: string) => {
    const trimmedInput = message.trim();

    if (!trimmedInput || status === "loading") {
      return;
    }

    const nextMessages: RecommendChatApiRequest["messages"] = [
      ...messages.map(({ role, content }) => ({ role, content })),
      { role: "user", content: trimmedInput },
    ];

    setInput("");
    await requestRecommendation(nextMessages, trimmedInput);
  };

  const submitSurvey = async () => {
    if (orderedAnswers.length !== survey.length || status === "loading") {
      return;
    }

    const surveyPrompt = buildSurveyPrompt(orderedAnswers);
    const nextMessages: RecommendChatApiRequest["messages"] = [
      { role: "user", content: surveyPrompt },
    ];

    await requestRecommendation(nextMessages, "설문 응답을 바탕으로 추천을 요청했어요.");
  };

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitChatMessage(input);
  };

  const handleChatKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!input.trim() || status === "loading") {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  };

  const handleResetConversation = () => {
    resetConversation();
    setIsResultModalOpen(false);
    setInput("");
    setCurrentQuestionIndex(0);
    setAnswersByQuestionId({});
  };

  const handleModeChange = (nextMode: RecommendMode) => {
    if (mode === nextMode) {
      return;
    }

    setMode(nextMode);
    handleResetConversation();
  };

  return (
    <PageContainer className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">추천 테스트</h1>
          <p className="max-w-2xl text-muted-foreground">
            대화형으로 취향을 설명하거나, 설문형으로 빠르게 답을 고른 뒤 추천
            결과를 확인할 수 있어요.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleResetConversation}>
          새 대화 시작
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <CardTitle>추천 방식 선택</CardTitle>
            <CardDescription>
              원하는 방식으로 취향을 알려주면 AI가 결과를 정리해드려요.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "chat" ? "secondary" : "outline"}
              onClick={() => handleModeChange("chat")}
            >
              대화형 추천
            </Button>
            <Button
              type="button"
              variant={mode === "survey" ? "secondary" : "outline"}
              onClick={() => handleModeChange("survey")}
            >
              설문형 추천
            </Button>
          </div>
        </CardHeader>
      </Card>

      {mode === "chat" ? (
        <div className="rounded-2xl border bg-background">
          <div className="space-y-4 p-4 md:p-6">
            {messages.map((message: RecommendChatMessage) => (
              <div
                key={message.id}
                className={
                  message.role === "assistant"
                    ? "flex justify-start"
                    : "flex justify-end"
                }
              >
                <div
                  className={
                    message.role === "assistant"
                      ? "max-w-3xl rounded-2xl bg-muted px-4 py-3 text-sm leading-6"
                      : "max-w-3xl rounded-2xl bg-foreground px-4 py-3 text-sm leading-6 text-background"
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}

            {status === "loading" && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  추천을 정리하고 있어요...
                </div>
              </div>
            )}
          </div>

          <form className="border-t p-4 md:p-6" onSubmit={handleChatSubmit}>
            <label className="sr-only" htmlFor="recommend-message">
              추천 메시지 입력
            </label>
            <textarea
              id="recommend-message"
              rows={4}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleChatKeyDown}
              className="w-full resize-none rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              disabled={status === "loading"}
            />

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <Button
                  key={question}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={status === "loading"}
                  onClick={() => void submitChatMessage(question)}
                >
                  {question}
                </Button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div />
              <Button
                type="button"
                asChild={false}
                onClick={() => void submitChatMessage(input)}
                disabled={status === "loading" || !input.trim()}
              >
                보내기
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <Card>
          <CardHeader className="space-y-4">
            <div className="space-y-2">
              <CardTitle>취향 설문</CardTitle>
              <CardDescription>
                총 {survey.length}문항에 답하면 설문 결과를 바탕으로 바로 추천을
                생성합니다.
              </CardDescription>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {Math.min(currentQuestionIndex + 1, survey.length)} / {survey.length}
                </span>
                <span>{Math.round(progressValue)}%</span>
              </div>
              <Progress value={progressValue} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                selectedValue={selectedValue}
                onSelect={(value) => {
                  const selectedOption = currentQuestion.options.find(
                    (option) => option.value === value,
                  );

                  if (!selectedOption) {
                    return;
                  }

                  setAnswersByQuestionId((current) => ({
                    ...current,
                    [currentQuestion.id]: {
                      questionId: currentQuestion.id,
                      question: currentQuestion.question,
                      label: selectedOption.label,
                      value: selectedOption.value,
                    },
                  }));
                }}
              />
            )}

            {status === "loading" && (
              <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                설문 응답을 바탕으로 추천을 정리하고 있어요...
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCurrentQuestionIndex((current) => Math.max(0, current - 1))
                }
                disabled={currentQuestionIndex === 0 || status === "loading"}
              >
                이전
              </Button>

              {currentQuestionIndex < survey.length - 1 ? (
                <Button
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIndex((current) =>
                      Math.min(survey.length - 1, current + 1),
                    )
                  }
                  disabled={!selectedValue || status === "loading"}
                >
                  다음 질문
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void submitSurvey()}
                  disabled={orderedAnswers.length !== survey.length || status === "loading"}
                >
                  결과 보기
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(promptSummary || userTasteSummary) && (
        <Card>
          <CardHeader>
            <CardTitle>추천 요약</CardTitle>
            <CardDescription>
              {mode === "survey"
                ? "설문 응답을 바탕으로 AI가 정리한 취향과 추천 맥락입니다."
                : "대화 내용을 바탕으로 AI가 정리한 취향과 추천 맥락입니다."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {promptSummary && (
              <div>
                <p className="text-sm font-medium">한 줄 설명</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {promptSummary}
                </p>
              </div>
            )}
            {userTasteSummary && (
              <div>
                <p className="text-sm font-medium">취향 요약</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {userTasteSummary}
                </p>
              </div>
            )}
            {communitySaved && (
              <p className="text-sm text-muted-foreground">
                이 추천 결과는 커뮤니티 피드에 자동 저장되었어요.
              </p>
            )}
            {recommendations.length > 0 && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResultModalOpen(true)}
                >
                  추천 결과 보기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Sheet open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
        <SheetContent
          side="center"
          className="overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>추천 결과</SheetTitle>
            <SheetDescription>
              {mode === "survey"
                ? "이번 설문 응답 기준으로 추천된 주류를 모달에서 확인할 수 있어요."
                : "이번 대화 기준으로 추천된 주류를 모달에서 확인할 수 있어요."}
            </SheetDescription>
          </SheetHeader>

          {recommendations.length > 0 && (
            <div className="space-y-4 px-4 pb-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    AI가 추천한 주류를 카드 형태로 정리해 보여드립니다.
                  </p>
                </div>
                <Button asChild type="button" variant="outline">
                  <Link href="/drinks">전체 술 둘러보기</Link>
                </Button>
              </div>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>추천된 주류</CardTitle>
                  <CardDescription>
                    이번 대화에서 추천된 술 목록입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {recommendations.map((item, index) => (
                    <span
                      key={`${item.name}-badge-${index}`}
                      className="rounded-full border px-3 py-1 text-sm"
                    >
                      {item.name}
                    </span>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {recommendations.map((item, index) => (
                  <RecommendationCard
                    key={`${item.name}-${index}`}
                    recommendation={item}
                  />
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}