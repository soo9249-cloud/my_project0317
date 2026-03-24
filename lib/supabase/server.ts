// 변경 이유: 서버 컴포넌트/Route Handler에서 사용할 Supabase 클라이언트를 createServerClient와 cookies() 연동으로 생성합니다.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서는 set 무시 (미들웨어에서 처리)
          }
        },
      },
    }
  );
}
