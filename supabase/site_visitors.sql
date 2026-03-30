create extension if not exists pgcrypto;

-- 고유 방문자(브라우저/기기)별로 하루 1회만 카운트합니다.
-- visitor_id는 클라이언트(localStorage)에서 생성해 서버로 전달합니다.
create table if not exists public.site_visitors (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  visited_date date not null,
  created_at timestamptz not null default now(),
  unique (visitor_id, visited_date)
);

create index if not exists site_visitors_visited_date_idx
  on public.site_visitors (visited_date);

