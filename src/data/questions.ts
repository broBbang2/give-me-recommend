import { SurveyQuestion } from "@/types/recommendation";

export const survey: SurveyQuestion[] = [
  {
    id: 1,
    question: "술을 마시는 목적은 무엇인가요?",
    options: [
      { label: "혼자 힐링", value: "healing" },
      { label: "친구와 가볍게", value: "social" },
      { label: "분위기", value: "mood" },
      { label: "새로운 경험", value: "experience" },
    ],
  },
  {
    id: 2,
    question: "어떤 맛을 선호하시나요?",
    options: [
      { label: "달달한 맛", value: "sweet" },
      { label: "상큼한 맛", value: "fresh" },
      { label: "쌉쌀한 맛", value: "bitter" },
      { label: "잘 모르겠어요", value: "unknown" },
    ],
  },
  {
    id: 3,
    question: "선호하는 도수는?",
    options: [
      { label: "낮은 도수", value: "low" },
      { label: "중간 도수", value: "medium" },
      { label: "상관 없음", value: "high" },
    ],
  },
  {
    id: 4,
    question: "술 경험은 어느 정도인가요?",
    options: [
      { label: "거의 없음", value: "beginner" },
      { label: "가끔 마심", value: "casual" },
      { label: "자주 마심", value: "advanced" },
    ],
  },
  {
    id: 5,
    question: "오늘 마시는 상황은?",
    options: [
      { label: "혼술", value: "alone" },
      { label: "친구", value: "friends" },
      { label: "데이트", value: "date" },
      { label: "파티", value: "party" },
    ],
  },
  {
    id: 6,
    question: "어떤 분위기를 원하세요?",
    options: [
      { label: "감성적인", value: "emotional" },
      { label: "가볍고 시원한", value: "light" },
      { label: "고급스러운", value: "luxury" },
      { label: "재미있는", value: "fun" },
    ],
  },
  {
    id: 7,
    question: "탄산감이 있는 술도 괜찮으신가요?",
    options: [
      { label: "좋아해요", value: "sparkling" },
      { label: "상관없어요", value: "any" },
      { label: "없는 쪽이 좋아요", value: "still" },
    ],
  },
  {
    id: 8,
    question: "어떤 마무리를 원하세요?",
    options: [
      { label: "디저트처럼 부드럽게", value: "dessert" },
      { label: "식사와 잘 어울리게", value: "pairing" },
      { label: "깔끔하게 마시고 싶어요", value: "clean" },
      { label: "향이 인상적이면 좋아요", value: "aroma" },
    ],
  },
];