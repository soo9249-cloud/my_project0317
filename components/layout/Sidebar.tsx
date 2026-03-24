"use client";

// 변경 이유: 0317_design.json 사이드바(220px glass) + 네비 + 유저 이메일/로그아웃, 모바일 시 하단 탭바
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  CheckSquare,
  Users,
  CalendarDays,
  UserCircle,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/todos", label: "내 할 일", icon: CheckSquare },
  { href: "/teams", label: "팀 목록", icon: Users },
  { href: "/teams", label: "일정 조율", icon: CalendarDays },
  { href: "/account", label: "내 계정", icon: UserCircle },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/account") return pathname === "/account" || pathname.startsWith("/account/");
  if (href === "/teams") return pathname.startsWith("/teams");
  return pathname === href;
}

export default function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <>
      <Link href="/dashboard" className="flex flex-col items-center gap-3 px-4 pb-6" aria-label="메인 화면으로 이동">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-[12px]"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            boxShadow: "0 4px 14px var(--primary-glow)",
          }}
        >
          <Brain className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
        </div>
        <span
          className="font-nunito text-[14.5px] font-extrabold tracking-tight"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.3px" }}
        >
          정신줄 구조대
        </span>
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = isNavActive(pathname, href);
          return (
            <Link
              key={href + label}
              href={href}
              className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 font-nunito text-[13px] font-semibold transition-colors"
              style={{
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
                background: isActive ? "var(--primary-soft)" : "transparent",
                boxShadow: isActive ? "inset 0 0 0 1px rgba(var(--primary-rgb, 224, 64, 251), 0.2)" : undefined,
              }}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div
        className="border-t px-3 py-4"
        style={{ borderColor: "var(--glass-border-subtle)" }}
      >
        {userEmail && (
          <Link
            href="/account"
            className="mb-2 block truncate font-poppins text-[11px] font-medium underline-offset-2 hover:underline"
            style={{ color: "var(--text-muted)" }}
            title="내 계정"
          >
            {userEmail}
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 font-nunito text-[13px] font-semibold transition-colors hover:bg-[var(--glass-strong)]"
          style={{ color: "var(--text-secondary)" }}
          aria-label="로그아웃"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          로그아웃
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside
        className="hidden w-[220px] min-w-[220px] flex-col py-6 md:flex"
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* 모바일 하단 탭바 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex items-stretch justify-around gap-0.5 border-t px-1 py-2 md:hidden"
        style={{
          background: "var(--sidebar-bg)",
          borderColor: "var(--sidebar-border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = isNavActive(pathname, href);
          return (
            <Link
              key={href + label}
              href={href}
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[12px] px-1 py-2"
              style={{
                color: isActive ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="max-w-full truncate text-center font-poppins text-[9px] font-medium leading-tight sm:text-[10px]">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
