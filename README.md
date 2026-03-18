# 정신줄 구조대

할 일 관리와 팀 일정 조율을 돕는 서비스입니다.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS v3
- **백엔드/인증**: Supabase (Auth, Database)
- **기타**: lucide-react, canvas-confetti, @dnd-kit (드래그 앤 드롭)

## 폴더 구조

```
app/
  (auth)/          # 로그인·회원가입 (로그인 전 전용)
    login/
    signup/
  (main)/          # 로그인 후 메인 영역
    layout.tsx
    dashboard/
    todos/
    teams/
      [teamId]/
  page.tsx         # 루트 → /dashboard 리다이렉트
  globals.css
  layout.tsx
components/
  dashboard/
  todos/
  teams/
  ui/
lib/
  supabase/        # Supabase 클라이언트 (브라우저/서버)
  utils/           # priority, schedule 등 유틸
types/
  index.ts         # Todo, Team, TeamMember, Availability, Message 등 타입
middleware.ts     # Supabase 세션 갱신 + 인증 라우트 리다이렉트
```

## 환경 변수

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 설정하세요.

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon(public) 키

Supabase 대시보드 → Settings → API에서 확인할 수 있습니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속합니다. 루트는 `/dashboard`로 리다이렉트되며, 로그인하지 않았을 경우 `/login`으로 이동합니다.

---

⚠️ 새 기능 추가 또는 구조 변경 시 README.md를 최신 상태로 업데이트할 것.
