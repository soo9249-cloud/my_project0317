// 변경 이유: (main) 라우트 그룹 레이아웃 — 서버에서 유저 조회 후 클라이언트 레이아웃에 전달
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MainLayoutClient from "@/components/layout/MainLayoutClient";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();
  const needsNicknameSetup = !profile?.nickname?.trim();

  return (
    <MainLayoutClient
      userEmail={user.email ?? null}
      userId={user.id}
      needsNicknameSetup={needsNicknameSetup}
    >
      {children}
    </MainLayoutClient>
  );
}
