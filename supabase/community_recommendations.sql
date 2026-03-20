create extension if not exists pgcrypto;

create table if not exists public.community_recommendations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prompt_summary text not null,
  user_taste_summary text not null,
  assistant_reply text not null,
  recommendations jsonb not null,
  recommendation_categories text[] not null default '{}',
  primary_drink_id text,
  primary_drink_name text,
  is_public boolean not null default true
);

alter table public.community_recommendations
  add column if not exists recommendation_categories text[] not null default '{}';

update public.community_recommendations
set recommendation_categories = coalesce(
  (
    select array_agg(distinct normalized_category order by normalized_category)
    from (
      select case
        when normalized_key in ('redwine', '레드와인', '적포도주') then '레드와인'
        when normalized_key in ('whitewine', '화이트와인', '백포도주') then '화이트와인'
        when normalized_key in ('sparklingwine', '스파클링와인') then '스파클링와인'
        when normalized_key in ('wine', '와인') then '와인'
        when normalized_key in ('whisky', 'whiskey', '위스키') then '위스키'
        when normalized_key in ('cocktail', '칵테일') then '칵테일'
        when normalized_key in ('liqueur', '리큐르') then '리큐르'
        when normalized_key in ('highball', '하이볼') then '하이볼'
        else raw_category
      end as normalized_category
      from (
        select
          trim(recommendation ->> 'category') as raw_category,
          lower(regexp_replace(trim(recommendation ->> 'category'), '[[:space:]_-]+', '', 'g')) as normalized_key
        from jsonb_array_elements(recommendations) as recommendation
        where coalesce(trim(recommendation ->> 'category'), '') <> ''
      ) categories
    ) normalized_categories
  ),
  '{}'
)
where coalesce(array_length(recommendation_categories, 1), 0) = 0;

create index if not exists community_recommendations_created_at_idx
  on public.community_recommendations (created_at desc);

create index if not exists community_recommendations_is_public_idx
  on public.community_recommendations (is_public);

create index if not exists community_recommendations_recommendations_gin_idx
  on public.community_recommendations
  using gin (recommendations jsonb_path_ops);

create index if not exists community_recommendations_recommendation_categories_gin_idx
  on public.community_recommendations
  using gin (recommendation_categories);

alter table public.community_recommendations enable row level security;

drop policy if exists "Public can read public community recommendations"
  on public.community_recommendations;

create policy "Public can read public community recommendations"
  on public.community_recommendations
  for select
  using (is_public = true);
