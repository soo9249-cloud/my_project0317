-- profiles RLS — 본인 upsert 허용 + 팀원 프로필 조회(채팅 표시명)
-- 오류: new row violates row-level security policy for table "profiles"
-- → insert/update 정책 없음·조건 불일치일 때 발생. Supabase SQL Editor에서 실행.

-- 팀원 여부(같은 team_id 한 번이라도) — RLS 재귀 방지용
create or replace function public.user_is_teammate_of(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.team_members a
    inner join public.team_members b on a.team_id = b.team_id
    where a.user_id = (select auth.uid())
      and b.user_id = p_user_id
  );
$$;

grant execute on function public.user_is_teammate_of(uuid) to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select_own_or_teammate" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- 조회: 본인 또는 팀원
create policy "profiles_select_own_or_teammate"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.user_is_teammate_of(id)
);

-- 삽입: 본인 id만
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

-- 수정: 본인 행만
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
