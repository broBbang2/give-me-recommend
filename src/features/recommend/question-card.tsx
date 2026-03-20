"use client";

import { cn } from "@/lib/utils";
import { SurveyQuestion } from "@/types/recommendation";

interface QuestionCardProps {
  question: SurveyQuestion;
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export default function QuestionCard({
  question,
  selectedValue,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="rounded-2xl border p-6">
      <h2 className="text-xl font-semibold">{question.question}</h2>

      <div className="mt-4 grid gap-3">
        {question.options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition hover:bg-muted",
              selectedValue === option.value &&
                "border-primary bg-primary/10 text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}