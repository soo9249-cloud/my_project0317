// 변경 이유: 로그인 사용자 계정 정보 조회·닉네임 수정·비밀번호 변경 진입점
import { createClient } from "@/lib/supabase/server";
import AccountSettingsClient from "@/components/account/AccountSettingsClient";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AccountSettingsClient
      userId={user.id}
      email={user.email ?? ""}
      initialNickname={profile?.nickname?.trim() ?? ""}
    />
  );
}
