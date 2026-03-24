"use client";

// 변경 이유: (main) 레이아웃용 클라이언트 래퍼 — 사이드바 + 메인(탑바 + 컨텐츠) + 닉네임 미설정 배너
import NicknameReminderBar from "@/components/profile/NicknameReminderBar";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainLayoutClient({
  userEmail,
  userId,
  needsNicknameSetup,
  children,
}: {
  userEmail: string | null;
  userId: string;
  needsNicknameSetup: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-gradient)" }}
    >
      <Sidebar userEmail={userEmail} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-6 py-5 pb-24 md:pb-5">
          <div className="flex flex-col gap-4">
            <NicknameReminderBar userId={userId} userEmail={userEmail} show={needsNicknameSetup} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
