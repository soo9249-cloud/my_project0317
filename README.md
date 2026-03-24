# 정신줄 구조대

PRD v1/v2/v3 요구사항을 통합 반영한, 개인 할 일 + 팀 일정 조율 + 실시간 채팅 서비스입니다.

## 1) 서비스 개요

- **서비스명**: 정신줄 구조대
- **한 줄 소개**: 개인 할 일을 정리하고 팀플 일정을 빠르게 맞추는 협업 도구
- **핵심 문제(PRD 반영)**:
  - 개인은 할 일/마감 관리가 분산돼 놓치기 쉽다.
  - 팀은 가능한 시간을 수작업으로 모으느라 소통 비용이 크다.
  - 일정 확정/공유/후속 커뮤니케이션이 한 흐름으로 연결되지 않는다.
- **해결 방향**:
  - 개인 일정 관리 + 오늘 대시보드
  - 팀 가능시간 교집합 추천 + 확정 + 공유문구
  - 팀별 실시간 채팅

## 2) 현재 구현 기능 (최신)

### 인증/계정

- Supabase Auth 이메일/비밀번호 로그인·회원가입
- 회원가입 시 닉네임(2~20자) 입력, `user_metadata.nickname` 저장
- 세션 존재 시 `profiles` upsert
- `/account` 페이지에서 닉네임 저장 + 비밀번호 변경
- `profiles.nickname`이 비어 있으면 메인 레이아웃 상단에 닉네임 입력 배너 노출

### 대시보드 (`/dashboard`)

- 오늘 할 일, 오늘 마감, 예정 팀 회의, 주간 완료율 카드
- 완료율 링(중앙 퍼센트 정렬 보정)
- 오늘 일정/오늘 할 일 패널
- 확정된 팀 회의 목록 패널(`teams.confirmed_slot` 기반)
- 90% 달성 보상 배너 + 보상 수령 모달

### 개인 할 일 (`/todos`)

- 등록: 제목, 마감일, 마감시간, 중요도
- 수정/삭제/완료 토글
- 기본 정렬: 마감 시각 오름차순 + 동률 시 중요도 내림차순
- 드래그 정렬(@dnd-kit): `sort_order` 저장, 수동 정렬 뱃지
- 정렬 저장 안정화: 드래그 직후 UI 반영 + DB 저장 + 재조회
- 오늘 90% 보상 문구(localStorage, 하루 1회) + confetti + 모달
- `due_at` 타임존 보정: 로컬 입력 -> `toISOString()`(UTC 저장)

### 팀 일정 조율 (`/teams`, `/teams/[teamId]`)

- 팀 생성: 6자리 초대코드 자동 생성
- 팀 참여: 표시 이름(`team_members.nickname`, 1~30자) + 초대코드
- 팀 목록: 내 팀만 표시, 검색(팀명/코드), 페이지네이션(20개/페이지)
- 팀 상세:
  - 가능 시간 입력(날짜, 시작/종료, 다중 슬롯)
  - 팀원별 입력 현황
  - 교집합 기반 추천 시간 상위 3개
  - 확정 슬롯 공유 문구 생성/복사
  - 확정 후에도 미입력 팀원이 있으면 `다시 조율하기`로 확정 해제 가능
- 팀장(생성자)만 팀 삭제 가능
- 팀 최대 10명 제한

### 팀 실시간 채팅 (`/teams/[teamId]`)

- `messages` 테이블 INSERT + Realtime 구독
- 메시지 실시간 반영
- 표시명 우선순위:
  1. `team_members.nickname`
  2. `profiles.nickname`
  3. 이메일 앞부분
- 내/상대 말풍선 스타일 분리, 시간 표시

## 3) 기술 스택 (PRD v1/v2/v3 통합)

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling/UI**: Tailwind CSS v3, CSS Variable 기반 테마, lucide-react
- **상태/UX 유틸**: @dnd-kit(core/sortable/utilities), canvas-confetti
- **Backend**: Supabase (Postgres, Auth, Realtime, RLS)
- **개발 도구**: ESLint, PostCSS, npm

## 4) PRD 반영 상태 요약

### PRD v1 반영 포인트

- 개인 생산성 중심 MVP(로그인/할 일/대시보드/팀 조율) 방향 유지
- 문제 정의/목표/KPI 구조를 현재 기능·검증 플로우에 반영

### PRD v2 반영 포인트

- Phase 4~6(할 일/팀 조율/실시간 채팅) 핵심 기능 대부분 구현
- 팀 채팅 Realtime, 팀 확정 공유 문구 포함

### PRD v3 반영 포인트

- 디자인 톤(글래스모피즘, 라운드 카드, 강조 그라데이션) 반영
- DB 구조(`todos`, `teams`, `team_members`, `availability`, `messages`)를 코드에 매핑
- 대시보드 보강(확정 회의 수/목록, 보상 모달)

## 5) 알려진 제약 / 다음 단계

- 팀 목록은 현재 **내가 참여한 팀** 기준입니다.  
  (다른 사람이 만든 팀 탐색 공개 목록은 별도 정책/UX 설계 필요)
- 초대코드 참여는 클라이언트 직접 `teams` 조회 대신 RPC 사용을 권장합니다.
- Realtime 동작은 Supabase Realtime 게시/권한 설정 상태에 의존합니다.

## 6) 폴더 구조

```txt
app/
  (auth)/
    login/
    signup/
  (main)/
    account/
    dashboard/
    teams/
      [teamId]/
    todos/
    layout.tsx
  globals.css
  layout.tsx
  page.tsx

components/
  account/
  dashboard/
  layout/
  profile/
  teams/
  todos/
  ui/

lib/
  supabase/
  utils/

supabase/
  profiles-rls.sql
  join-team-rpc.sql

types/
  index.ts

middleware.ts
supabase-editing-prompt.md
scripts/
  clean.cjs
```

## 7) 환경 변수

루트 `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 8) Supabase SQL 가이드

### A. 닉네임 저장 시 `profiles` RLS 오류

오류: `new row violates row-level security policy for table "profiles"`  
해결: `supabase/profiles-rls.sql` 실행

### B. 초대코드 참여가 RLS에 막히는 경우

해결: `supabase/join-team-rpc.sql` 실행  
(기존 정책 유지 + 초대코드 참여만 SECURITY DEFINER 함수로 처리)

### C. 마감시간 마이그레이션 (`todos.due_at`)

```sql
alter table public.todos
add column if not exists due_at timestamptz null;

update public.todos
set due_at = (due_date::text || 'T23:59:00')::timestamptz
where due_date is not null
  and due_at is null;
```

## 9) 실행 방법

```bash
npm install
npm run dev
```

기본 접속: [http://localhost:3000](http://localhost:3000)  
루트(`/`)는 `/dashboard`로 리다이렉트됩니다.

## 10) 로컬 캐시/용량 정리

- `.next/`, `node_modules/`는 Git에 포함되지 않습니다.
- Vercel은 원격에서 매번 새 빌드를 수행하므로 로컬 `.next` 크기와 배포 용량은 별개입니다.
- 정리 명령:

```bash
npm run clean
```

(`.next`, `node_modules/.cache` 삭제)

## 11) 사용자 테스트 플로우

1. `/signup` 또는 `/login`으로 로그인
2. `/account`에서 닉네임 설정 확인
3. 팀장 계정으로 `/teams`에서 팀 생성
4. 팀원 계정으로 초대코드 참여
5. `/teams/[teamId]`에서 가능 시간 입력/추천/확정/재조율
6. 팀 채팅 실시간 반영 확인
7. `/todos`에서 등록/완료/드래그 정렬/보상 모달 확인

## 12) 체크리스트 (현재)

- [x] 인증/회원가입/로그인
- [x] 프로필 닉네임 관리
- [x] 대시보드 핵심 카드/패널/보상 배너
- [x] 할 일 CRUD + 마감시간 + 드래그 정렬
- [x] 팀 생성/참여/삭제/최대 인원
- [x] 일정 조율 추천/확정/공유문구
- [x] 실시간 채팅 + 닉네임 우선 표시
- [x] 팀 목록 검색 + 페이지네이션(20개)
- [ ] 공개 팀 탐색 목록(내 팀 외 팀 카드 브라우징)

---

기능/정책/경로가 바뀌면 README도 함께 업데이트합니다.

