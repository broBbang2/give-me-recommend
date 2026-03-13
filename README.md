# Choice

취향 기반으로 입문자에게 어울리는 술을 추천해주는 Next.js 웹 애플리케이션입니다.  
홈에서 커뮤니티 추천 피드를 둘러보고, AI 추천 화면에서 ChatGPT와 대화하며 취향을 설명한 뒤 추천 결과를 확인하고 즐겨찾기에 저장할 수 있습니다.

## 주요 기능

- 홈 화면에서 오늘의 추천 술과 입문자 추천 목록 확인
- ChatGPT 기반 대화형 술 추천
- Supabase 기반 커뮤니티 추천 피드
- 술 상세 페이지 탐색
- 관심 있는 술 즐겨찾기 저장
- 정적 데이터 기반 빠른 프로토타이핑

## 기술 스택

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- `shadcn/ui`
- `Zustand`

## 시작하기

### 요구 사항

- `Node.js 20+`
- `npm`

### 설치

```bash
npm install
```

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

### 프로덕션 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm run start
```

### 정적 검사

```bash
npm run lint
```

## 라우트

- `/` : 홈
- `/drinks` : 커뮤니티 추천 피드
- `/drinks/[id]` : 술 상세
- `/favorites` : 즐겨찾기
- `/recommend` : AI 추천 채팅
- `/recommend/result` : 기존 경로 호환용 리다이렉트

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
- 최종 추천 결과는 `Supabase`의 `community_recommendations` 테이블에 익명 공개 피드로 저장할 수 있습니다.

## 환경 변수

- `OPENAI_API_KEY` : OpenAI API 호출용 키
- `OPENAI_MODEL` : 선택 사항, 기본값은 `gpt-4o-mini`
- `NEXT_PUBLIC_SUPABASE_URL` : Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : 향후 클라이언트 사용을 위한 공개 키
- `SUPABASE_SERVICE_ROLE_KEY` : 서버에서 커뮤니티 추천 저장/조회에 사용하는 키

`Supabase`에는 `supabase/community_recommendations.sql`의 스키마를 먼저 적용해야 합니다.

## 현재 상태

- `npm run lint` 확인 완료
- `npm run build` 확인 완료

## 알려진 제한 사항

- 자동화 테스트 코드가 아직 없습니다.
- 일부 술 데이터는 이미지 경로를 포함하고 있지만 실제 이미지 파일은 아직 추가되지 않았습니다.
- OpenAI API 키가 없으면 AI 추천 기능을 사용할 수 없습니다.
- Supabase 설정이나 테이블 스키마가 없으면 커뮤니티 추천 저장 및 피드 조회가 동작하지 않습니다.
- 앱 내 데이터에 없는 술은 텍스트 추천 카드로 표시되며, 상세 페이지 연결은 되지 않습니다.

## 개선 아이디어

- 실제 상품 이미지 및 상세 메타데이터 추가
- 테스트 코드 도입
- 로컬 스토리지 기반 즐겨찾기 영속화
- 필터/정렬 기능 확장
- 백엔드 또는 CMS 연동
