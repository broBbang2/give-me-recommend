-- upsert + count를 단일 트랜잭션으로 처리하는 RPC 함수
-- API 호출 2번(upsert → count)을 1번으로 줄입니다.
-- Supabase Dashboard > SQL Editor에서 실행하세요.

create or replace function public.track_visitor(
  p_visitor_id text,
  p_visited_date date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into site_visitors (visitor_id, visited_date)
  values (p_visitor_id, p_visited_date)
  on conflict (visitor_id, visited_date) do nothing;

  select count(*)::integer into v_count
  from site_visitors
  where visited_date = p_visited_date;

  return v_count;
end;
$$;
