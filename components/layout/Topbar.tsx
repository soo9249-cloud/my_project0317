"use client";

// 변경 이유: effect 안에서 setState 금지(ESLint) 회피 — 테마는 useSyncExternalStore로 읽고 DOM만 effect에서 동기화
import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_EVENT = "jeongsingul-data-theme-change";

function readTheme(): "light" | "dark" {
  const stored = localStorage.getItem("data-theme") as "light" | "dark" | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeTheme(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(THEME_EVENT, handler);
  window.addEventListener("storage", handler);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", handler);
  return () => {
    window.removeEventListener(THEME_EVENT, handler);
    window.removeEventListener("storage", handler);
    mq.removeEventListener("change", handler);
  };
}

export default function Topbar() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    localStorage.setItem("data-theme", next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const today = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <header
      className="flex h-[58px] shrink-0 items-center justify-between border-b px-6"
      style={{
        background: "var(--topbar-bg)",
        borderColor: "var(--glass-border-subtle)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        className="rounded-[9999px] border px-3 py-1 font-poppins text-xs font-medium"
        style={{
          background: "var(--glass-strong)",
          borderColor: "var(--glass-border)",
          color: "var(--text-primary)",
        }}
      >
        {today}
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
        className="flex h-9 items-center gap-2 rounded-[9999px] border px-3 py-1 transition-opacity hover:opacity-90"
        style={{
          background: "var(--glass)",
          borderColor: "var(--glass-border)",
          color: "var(--text-primary)",
        }}
      >
        {theme === "light" ? (
          <Moon className="h-4 w-4" aria-hidden />
        ) : (
          <Sun className="h-4 w-4" aria-hidden />
        )}
      </button>
    </header>
  );
}
