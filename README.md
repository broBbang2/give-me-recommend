# 🍶 Choice

취향 기반으로 입문자에게 어울리는 술을 추천해주는 Next.js 웹 애플리케이션입니다.
홈에서 커뮤니티 추천 피드를 둘러보고, AI 추천 화면에서 ChatGPT와 대화하며 취향을 설명한 뒤 추천 결과를 확인하고 즐겨찾기에 저장할 수 있습니다.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)

## 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [라우트](#라우트)
- [프로젝트 구조](#프로젝트-구조)
- [데이터와 상태 관리](#데이터와-상태-관리)
- [환경 변수](#환경-변수)
- [성능 개선 로그](#성능-개선-로그)
- [현재 상태](#현재-상태)

## 주요 기능

- 홈 화면에서 오늘의 추천 술과 입문자 추천 목록 확인
- ChatGPT 기반 대화형 술 추천
- Supabase 기반 커뮤니티 추천 피드
- 추천 상세 페이지 탐색
- 관심 있는 술 즐겨찾기 저장

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | `Next.js 16`, `React 19` |
| 언어 | `TypeScript` |
| 스타일·UI | `Tailwind CSS v4`, `shadcn/ui` |
| 상태 관리 | `Zustand` |
| 백엔드·AI | `Supabase`, `OpenAI API` |

## 시작하기

### 요구 사항

- `Node.js 20+`
- `npm`

### 설치

```bash
npm install
```

### 환경 변수 설정

`.env.local` 파일을 만들고 아래 값을 설정합니다.

```bash
OPENAI_API_KEY=your_openai_api_key
# 선택 사항
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속합니다.

### 프로덕션 빌드 & 실행

```bash
npm run build
npm run start
```

### 정적 검사

```bash
npm run lint
```

## 라우트

| 경로 | 설명 |
|------|------|
| `/` | 홈 |
| `/drinks` | 커뮤니티 추천 피드 |
| `/drinks/[id]` | 술 상세 |
| `/favorites` | 즐겨찾기 |
| `/recommend` | AI 추천 채팅 |
| `/recommend/result` | 기존 경로 호환용 리다이렉트 |

## 프로젝트 구조

```text
src
├── app             # App Router 라우트
├── components      # 공통 컴포넌트 및 UI 컴포넌트
├── data            # 술 데이터, 질문 데이터
├── features        # 화면 단위 기능 모음
├── lib             # 추천 로직, 유틸 함수
├── stores          # Zustand 상태 저장소
└── types           # 공통 타입 정의
```

## 데이터와 상태 관리

- 추천 대상 술 데이터는 `src/data/drinks.ts`에 정의되어 있습니다.
- 추천 질문 데이터는 `src/data/questions.ts`에 남아 있으며, 현재는 참고용 데이터입니다.
- AI 추천 대화 상태는 `src/stores/recommendation-store.ts`에서 관리합니다.
- 즐겨찾기 상태는 `src/stores/favorite-store.ts`에서 관리합니다.
- 앱 내 술 데이터는 정적 데이터로 유지되며, AI 추천은 `src/app/api/recommend/chat/route.ts`에서 OpenAI API를 호출해 처리합니다.
- 최종 추천 결과는 Supabase의 `community_recommendations` 테이블에 익명 공개 피드로 저장할 수 있습니다.

## 환경 변수

| 변수 | 설명 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API 호출용 키 |
| `OPENAI_MODEL` | 선택 사항, 기본값은 `gpt-4o-mini` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 향후 클라이언트 사용을 위한 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버에서 커뮤니티 추천 저장/조회에 사용하는 키 |

> Supabase에는 `supabase/community_recommendations.sql`의 스키마를 먼저 적용해야 합니다.
> 이미 테이블을 만든 상태라면 같은 SQL을 다시 실행해서 `recommendation_categories` 컬럼, 백필, 인덱스까지 반영해야 태그 검색 최적화가 동작합니다.

## 성능 개선 로그

### 커뮤니티 태그 검색 최적화

- **문제**: 커뮤니티 피드에서 태그 검색 시 렌더링이 느렸습니다. 태그 필터링이 DB가 아닌 서버 애플리케이션 코드(`src/lib/community-recommendations.ts`)에서 `map` → `filter` → `sort` → `slice` 순으로 후처리되었고, `/drinks` 페이지도 목록 조회와 태그 목록 생성을 위해 유사한 데이터를 반복 조회하고 있었습니다.
- **시도와 오류**: `recommendations jsonb` 컬럼에 `contains` 조건을 걸어 필터링을 DB로 내리려 했으나, PostgREST가 `jsonb` 배열 조건을 처리하는 과정에서 `22P02 invalid input syntax for type json` 오류가 발생했습니다.
- **해결**: 태그 검색 전용 컬럼 `recommendation_categories text[]`를 추가해 정규화된 카테고리 배열을 함께 저장하고, 기존 데이터는 `supabase/community_recommendations.sql`의 백필 쿼리로 채웠습니다. 이후 태그 검색은 `recommendation_categories` 컬럼과 GIN 인덱스로 처리됩니다.
- **추가 최적화**
  - `src/app/drinks/page.tsx`: 목록 조회와 태그 조회를 병렬 처리
  - `src/app/api/recommend/chat/route.ts`: 여러 번 순회하던 추천 정규화 로직을 단일 루프로 단순화
  - `src/lib/recommendation.ts`: `getRecommendedDrinks()`가 전체 정렬 후 자르던 방식 → 상위 3개만 유지하도록 변경
  - DB 마이그레이션이 아직 적용되지 않은 환경을 위한 fallback 로직 추가
- **결과**: 렌더링 시간이 `2,007ms` → `262ms`로 개선되었습니다.

### `/drinks` 첫 진입 초기 로딩 지연

- **원인**
  - 초기 진입 시 `count`/`태그 후보`를 받은 뒤에야 추천 피드를 조회하는 순차 흐름이라 Supabase 호출 대기 시간이 합산되었습니다.
  - 태그 목록 생성을 위해 최근 레코드를 과도하게 읽은 뒤(`getCommunityRecommendationTags`) JS에서 파싱/중복 제거/정렬을 수행해 응답 크기와 런타임 후처리 시간이 늘어났습니다.
  - `range(offset, ...)`로 이미 페이지 단위를 잘라오는데도 일부 분기에서 추가 `slice(offset, ...)`가 적용되어 불필요한 처리가 있었습니다.
- **해결**
  - `src/app/drinks/page.tsx`: `page === 1`인 경우 `count + tags + recommendations`를 `Promise.all`로 병렬 조회
  - `src/lib/community-recommendations.ts`: `range`로 이미 잘려 있는 `latest`/`oldest`의 중복 `slice` 제거
  - `src/lib/community-recommendations.ts`: 태그 후보 조회량을 `limit 200` → `limit 100`으로 축소

## 현재 상태

- [x] `npm run lint` 확인 완료
- [x] `npm run build` 확인 완료
