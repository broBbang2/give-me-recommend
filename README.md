# Choice

취향 기반으로 입문자에게 어울리는 술을 추천해주는 Next.js 웹 애플리케이션입니다.  
홈에서 커뮤니티 추천 피드를 둘러보고, AI 추천 화면에서 ChatGPT와 대화하며 취향을 설명한 뒤 추천 결과를 확인하고 즐겨찾기에 저장할 수 있습니다.

## 주요 기능

- 홈 화면에서 오늘의 추천 술과 입문자 추천 목록 확인
- ChatGPT 기반 대화형 술 추천
- Supabase 기반 커뮤니티 추천 피드
- 추천 상세 페이지 탐색
- 관심 있는 술 즐겨찾기 저장

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
이미 테이블을 만든 상태라면 같은 SQL을 다시 실행해서 `recommendation_categories` 컬럼, 백필, 인덱스까지 반영해야 태그 검색 최적화가 동작합니다.

## 현재 상태

- `npm run lint` 확인 완료
- `npm run build` 확인 완료

## 커뮤니티 태그 검색 최적화

커뮤니티 피드에서 태그 검색 시 렌더링이 느렸던 주된 이유는, 태그 필터링이 데이터베이스가 아니라 서버 애플리케이션 코드에서 후처리로 이루어지고 있었기 때문입니다.
기존에는 `community_recommendations` 테이블에서 추천 목록을 먼저 읽어온 뒤, `src/lib/community-recommendations.ts`에서 다시 `map`, `filter`, `sort`, `slice`를 거치며 태그와 키워드를 걸러냈습니다.
또 `/drinks` 페이지에서 목록 조회와 태그 목록 생성을 위해 비슷한 데이터를 반복 조회하고 있어, 검색 조건이 들어올수록 불필요한 연산과 네트워크 비용이 누적되는 구조였습니다.

처음에는 `recommendations jsonb` 컬럼에 직접 `contains` 조건을 걸어 태그 검색을 데이터베이스로 내리려고 했지만, PostgREST가 `jsonb` 배열 조건을 처리하는 과정에서 `22P02 invalid input syntax for type json` 오류가 발생했습니다.
즉, 성능 문제를 줄이기 위해 필터링을 DB로 옮기던 과정에서 `recommendations` 배열 구조와 쿼리 문법이 맞지 않아 서버 콘솔 에러가 함께 발생했습니다.

이 문제를 해결하기 위해 태그 검색 전용 컬럼인 `recommendation_categories text[]`를 추가했습니다.
이 컬럼에는 추천 결과 저장 시 정규화된 카테고리 문자열 배열을 함께 저장하고, 기존 데이터는 `supabase/community_recommendations.sql`의 백필 쿼리로 한 번에 채우도록 구성했습니다.
이후 태그 검색은 더 이상 `jsonb recommendations`를 직접 해석하지 않고, `recommendation_categories` 컬럼과 GIN 인덱스를 통해 빠르게 처리하도록 변경했습니다.

추가로 다음 최적화도 함께 적용했습니다.

- `src/app/drinks/page.tsx`에서 목록 조회와 태그 조회를 병렬 처리하도록 변경
- `src/app/api/recommend/chat/route.ts`의 추천 정규화 로직을 여러 번 순회하던 방식에서 단일 루프로 단순화
- `src/lib/recommendation.ts`의 `getRecommendedDrinks()`를 전체 정렬 후 자르던 구조에서 상위 3개만 유지하는 방식으로 변경
- DB migration이 아직 적용되지 않은 환경에서도 동작하도록 fallback 로직 추가


기존 코드를 수정하기전 렌더링 시간이 `2.007ms`이였는데 코드 수정 후  `262ms`로 변경되었습니다.

실제 성능 개선 효과는 `supabase/community_recommendations.sql` 마이그레이션이 적용된 환경에서 확인해야 합니다(미적용 시 fallback 로직으로 동작).

## 커뮤니티(`/drinks`) 첫 진입 초기 로딩 지연: 원인과 해결

`/drinks` 페이지를 처음 열 때(첫 로딩) 느렸던 이유는, 첫 화면 구성을 위해 필요한 데이터 요청과 후처리 비용이 누적되는 구조였기 때문입니다.

- 초기 진입 시 `count`/`tag 후보`를 받은 뒤에야 `추천 피드`를 조회하는 대기 흐름이 있어 Supabase 호출 대기가 합산되었습니다.
- 태그 목록 생성을 위해 최근 레코드를 더 많이 읽은 뒤(`getCommunityRecommendationTags`) JS에서 파싱/중복제거/정렬을 수행해서 초기 응답 크기와 런타임 후처리 시간이 늘어났습니다.
- `range(offset, ...)`로 페이지 단위를 이미 잘라오는데도 일부 분기에서 추가 `slice(offset, ...)`가 적용되어 불필요한 처리/정합성 리스크가 있었습니다.

해결 방법:

- `src/app/drinks/page.tsx`에서 `page === 1`인 경우 `count + tags + recommendations`를 `Promise.all`로 병렬 조회하도록 변경해서 왕복 대기 시간을 줄였습니다.
- `src/lib/community-recommendations.ts`에서 `latest/oldest`는 `range`로 이미 잘려있으므로 추가 `slice`를 제거했습니다.
- `src/lib/community-recommendations.ts`에서 태그 후보 조회량을 `limit 200`에서 `limit 100`으로 줄여 초기 로딩 비용을 완화했습니다.


## 개선 아이디어

- 실제 상품 이미지 및 상세 메타데이터 추가
- 로컬 스토리지 기반 즐겨찾기 영속화
- 백엔드 또는 CMS 연동
