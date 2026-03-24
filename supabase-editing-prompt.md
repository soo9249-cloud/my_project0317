# Supabase SQL·RLS 편집용 LLM 프롬프트

아래 블록 전체를 복사해 다른 AI(또는 Cursor)에 붙여넣고, 원하는 수정(예: RLS 오류 해결, 트리거 추가)을 요청하세요.

---

## 용어: SQL이 뭔가요?

**SQL**은 **Structured Query Language**(구조화된 질의 언어)의 약자입니다. 관계형 데이터베이스(PostgreSQL 등)에 **테이블 정의·데이터 조회/삽입/수정·권한(RLS)·함수·트리거** 같은 것을 적을 때 쓰는 언어입니다. Supabase 대시보드의 **SQL Editor**에 실행하는 코드가 대부분 SQL(및 PostgreSQL 확장)입니다.

---

## 컨텍스트 (프로젝트)

- 스택: **Next.js 15 (App Router)**, **Supabase Auth + Postgres + Realtime**
- 클라이언트에서 쓰는 주요 테이블:
  - `public.profiles` — 컬럼 예: `id` (uuid, `auth.users.id`와 동일), `nickname` (text, nullable), `email` (text, nullable)
  - `public.teams` — `id`, `name`, `created_by`, `invite_code`, `confirmed_slot`, …
  - `public.team_members` — `team_id`, `user_id`, **`nickname`** (팀 채팅 등 팀 내 표시명), …
  - `public.messages`, `public.availability` 등
- 앱 동작:
  - **회원가입** 시 닉네임 입력 → 가능하면 `profiles`에 `upsert` (`id`, `nickname`, `email`). 이메일 인증만 켜져 있으면 가입 직후 세션이 없을 수 있어, 그때는 DB **트리거**로 `auth.users` 가입 시 `profiles` 행 생성을 권장.
  - **팀 만들기 / 초대 코드 참여** 시 `team_members` insert 시 **`nickname`(표시 이름)** 함께 저장.

## 현재 `teams` RLS (참고용 — 사용자 제공 스냅샷)

```sql
-- 1. 무한 참조(재귀) 방지용 함수
create or replace function public.user_is_member_of_team(p_team_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from team_members
    where team_id = p_team_id
    and user_id = auth.uid()
  );
end;
$$;

alter table public.teams enable row level security;

drop policy if exists "teams_select_member_or_creator" on public.teams;
drop policy if exists "teams_insert_owner" on public.teams;
drop policy if exists "teams_update_owner" on public.teams;
drop policy if exists "teams_delete_owner" on public.teams;
drop policy if exists "teams: 본인 생성만" on public.teams;

create policy "teams_select_member_or_creator"
on public.teams
for select
using (
  created_by = auth.uid()
  or public.user_is_member_of_team(id)
);

create policy "teams_insert_owner"
on public.teams
for insert
to authenticated
with check (
  created_by = auth.uid()
);

create policy "teams_update_owner"
on public.teams
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "teams_delete_owner"
on public.teams
for delete
to authenticated
using (created_by = auth.uid());
```

## 요청 시 LLM에게 맡길 작업 예시

1. **`public.profiles`**: 테이블·컬럼이 없으면 생성 마이그레이션. RLS 켜기. `authenticated` 사용자가 **본인 행만** `select/insert/update` 가능한 정책.
2. **`public.team_members`**: `nickname` 컬럼 존재 확인. INSERT 시 본인을 멤버로 넣는 경우·팀 소유자가 멤버를 추가하는 경우 등 **앱 플로우에 맞는** RLS. 기존 정책이 `teams`/`team_members`를 서로 참조해 **무한 재귀** 나지 않게 `security definer` 함수로 분리.
3. **회원가입 직후 `profiles` 없음**: `auth.users` INSERT 후 `public.profiles`에 `(id, email, nickname)` 넣는 **트리거 + 함수** (닉네임은 `raw_user_meta_data->>'nickname'` 등에서 읽기).
4. 중복 정책·이름 충돌 시 **`drop policy if exists`** 후 재생성.
5. 모든 SQL은 **한 번에 실행 가능한 순서**로 정리하고, **위험한 `disable row level security`**는 피하고 이유를 주석으로 설명.

## 내가 지금 해결하고 싶은 문제 (여기에 직접 적기)

- 예: `profiles` upsert 시 RLS 오류 코드 `42501`
- 예: 팀 생성 시 `teams` insert 거부
- 예: `team_members` insert 시 정책 오류

---

(위 빈칸에 증상·에러 메시지·스크린샷 요약을 적은 뒤 그대로 요청하면 됩니다.)

---

## 기존 가입자 닉네임 처리

1. **앱**: 로그인 후 `(main)` 레이아웃 상단에 **닉네임 입력 배너**가 뜨도록 구현되어 있습니다 (`profiles.nickname`이 비어 있을 때). 사용자가 저장하면 이후 팀 채팅 등에 반영됩니다.
2. **운영자 일괄 보정(선택)**: Supabase **SQL Editor**(보통 서비스 역할)에서 한 번 실행. 스키마에 맞게 조정하세요.

```sql
-- nickname만 비어 있는 profiles: 이메일 앞부분으로 임시 채움
update public.profiles p
set nickname = split_part(coalesce(p.email, ''), '@', 1)
where (p.nickname is null or trim(p.nickname) = '')
  and coalesce(p.email, '') <> ''
  and length(split_part(p.email, '@', 1)) >= 2;

-- team_members.nickname 백필: profiles.nickname 우선, 없으면 auth 이메일 앞부분
update public.team_members tm
set nickname = coalesce(
  (select nullif(trim(pr.nickname), '') from public.profiles pr where pr.id = tm.user_id),
  split_part((select u.email from auth.users u where u.id = tm.user_id limit 1), '@', 1)
)
where tm.nickname is null or trim(tm.nickname) = '';
```

`profiles` 행 자체가 없는 유저는 트리거로 생성하거나, 앱 배너·회원가입 플로우로 채우는 편이 안전합니다.
