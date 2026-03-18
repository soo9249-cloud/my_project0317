// 변경 이유: 브라우저에서 사용할 Supabase 클라이언트를 @supabase/ssr createBrowserClient로 생성합니다.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
