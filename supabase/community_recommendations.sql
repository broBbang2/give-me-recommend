create extension if not exists pgcrypto;

create table if not exists public.community_recommendations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prompt_summary text not null,
  user_taste_summary text not null,
  assistant_reply text not null,
  recommendations jsonb not null,
  primary_drink_id text,
  primary_drink_name text,
  is_public boolean not null default true
);

create index if not exists community_recommendations_created_at_idx
  on public.community_recommendations (created_at desc);

create index if not exists community_recommendations_is_public_idx
  on public.community_recommendations (is_public);

alter table public.community_recommendations enable row level security;

drop policy if exists "Public can read public community recommendations"
  on public.community_recommendations;

create policy "Public can read public community recommendations"
  on public.community_recommendations
  for select
  using (is_public = true);
