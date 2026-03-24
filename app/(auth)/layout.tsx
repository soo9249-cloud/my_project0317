// 변경 이유: 로그인/회원가입 첫 화면에서 브랜드(로고+서비스명)를 공통으로 보여 인지성을 높입니다.
import Link from "next/link";
import { Brain } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-[980px] items-center px-4 py-5">
          <Link href="/login" className="inline-flex items-center gap-2.5 rounded-[9999px] px-2 py-1">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[10px]"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                boxShadow: "0 4px 14px var(--primary-glow)",
              }}
              aria-hidden
            >
              <Brain className="h-4.5 w-4.5 text-white" strokeWidth={2} />
            </span>
            <span
              className="font-nunito text-[14px] font-extrabold tracking-tight"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.3px" }}
            >
              정신줄 구조대
            </span>
          </Link>
        </div>
      </header>
      <div className="pt-6">{children}</div>
    </div>
  );
}
