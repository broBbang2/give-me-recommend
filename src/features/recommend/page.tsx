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
import { toPlainText } from "@/lib/plain-text";
import { useRecommendationStore } from "@/stores/recommendation-store";
import type {
  RecommendChatApiRequest,
  RecommendChatApiResponse,
} from "@/types/recommendation";

const suggestedQuestions = [
  "달달하고 도수가 낮은 술 추천해줘",
  "혼술할 때 가볍게 마시기 좋은 술 추천해줘",
  "데이트할 때 분위기 좋은 술 추천해줘",
  "와인 입문자가 마시기 좋은 술 추천해줘",
];

export default function RecommendPage() {
  const [input, setInput] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const messages = useRecommendationStore((state) => state.messages);
  const recommendations = useRecommendationStore(
    (state) => state.recommendations,
  );
  const promptSummary = useRecommendationStore((state) => state.promptSummary);
  const userTasteSummary = useRecommendationStore(
    (state) => state.userTasteSummary,
  );
  const communitySaved = useRecommendationStore((state) => state.communitySaved);
  const status = useRecommendationStore((state) => state.status);
  const error = useRecommendationStore((state) => state.error);
  const addMessage = useRecommendationStore((state) => state.addMessage);
  const setRecommendations = useRecommendationStore(
    (state) => state.setRecommendations,
  );
  const setPromptSummary = useRecommendationStore(
    (state) => state.setPromptSummary,
  );
  const setUserTasteSummary = useRecommendationStore(
    (state) => state.setUserTasteSummary,
  );
  const setCommunitySaved = useRecommendationStore(
    (state) => state.setCommunitySaved,
  );
  const setStatus = useRecommendationStore((state) => state.setStatus);
  const setError = useRecommendationStore((state) => state.setError);
  const resetConversation = useRecommendationStore(
    (state) => state.resetConversation,
  );

  const decoratedRecommendations = useMemo(() => recommendations, [recommendations]);

  const submitMessage = async (message: string) => {
    const trimmedInput = message.trim();

    if (!trimmedInput || status === "loading") {
      return;
    }

    const nextMessages: RecommendChatApiRequest["messages"] = [
      ...messages.map(({ role, content }) => ({ role, content })),
      { role: "user", content: trimmedInput },
    ];

    addMessage("user", trimmedInput);
    setInput("");
    setError(null);
    setRecommendations([]);
    setPromptSummary("");
    setCommunitySaved(false);
    setStatus("loading");

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

      addMessage("assistant", payload.reply);
      setRecommendations(payload.recommendations);
      setPromptSummary(payload.promptSummary);
      setUserTasteSummary(payload.userTasteSummary);
      setCommunitySaved(payload.communitySaved);
      setIsResultModalOpen(payload.recommendations.length > 0);
      setStatus("idle");
    } catch (submitError) {
      setStatus("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "추천 요청에 실패했습니다.",
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitMessage(input);
  };

  const handleResetConversation = () => {
    resetConversation();
    setInput("");
    setIsResultModalOpen(false);
  };

  const handleSuggestedQuestionClick = async (question: string) => {
    setInput("");
    await submitMessage(question);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!input.trim() || status === "loading") {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  };

  return (
    <PageContainer className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">바텐더와 대화</h1>
          <p className="max-w-2xl text-muted-foreground">
            바텐더와 대화하면서 취향을 설명해보세요. 바텐더가 필요한 정보만
            추가로 묻고, 충분히 파악되면 술 추천과 이유를 정리해드립니다.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleResetConversation}>
          새 대화 시작
        </Button>
      </div>

      <div className="rounded-2xl border bg-background">
        <div className="space-y-4 p-4 md:p-6">
          {messages.map((message) => (
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
                {toPlainText(message.content)}
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

        <form className="border-t p-4 md:p-6" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="recommend-message">
            추천 메시지 입력
          </label>
          <textarea
            id="recommend-message"
            rows={4}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
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
                onClick={() => void handleSuggestedQuestionClick(question)}
              >
                {question}
              </Button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div />
            <Button type="submit" disabled={status === "loading" || !input.trim()}>
              보내기
            </Button>
          </div>
        </form>
      </div>

      {(promptSummary || userTasteSummary) && (
        <Card>
          <CardHeader>
            <CardTitle>추천 요약</CardTitle>
            <CardDescription>
              AI가 현재 대화 기준으로 정리한 취향과 추천 맥락입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {promptSummary && (
              <div>
                <p className="text-sm font-medium">한 줄 설명</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {toPlainText(promptSummary)}
                </p>
              </div>
            )}
            {userTasteSummary && (
              <div>
                <p className="text-sm font-medium">취향 요약</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {toPlainText(userTasteSummary)}
                </p>
              </div>
            )}
            {communitySaved && (
              <p className="text-sm text-muted-foreground">
                이 추천 결과는 커뮤니티 피드에 자동 저장되었어요.
              </p>
            )}
            {decoratedRecommendations.length > 0 && (
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
              이번 대화 기준으로 추천된 주류를 모달에서 확인할 수 있어요.
            </SheetDescription>
          </SheetHeader>

          {decoratedRecommendations.length > 0 && (
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
                  {decoratedRecommendations.map((item, index) => (
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
                {decoratedRecommendations.map((item, index) => (
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