"use client";

import { QuestionItem } from "@/types/recommendation";

interface QuestionCardProps {
  question: QuestionItem;
  onSelect: (value: string | number | boolean) => void;
}

export default function QuestionCard({
  question,
  onSelect
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
            className="rounded-xl border px-4 py-3 text-left hover:bg-muted"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}