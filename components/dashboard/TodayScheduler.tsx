"use client";

// 변경 이유: 0317_design.json timeline — due_at 기준 시간축 표시, 지금 인디케이터, 타임라인/리스트 뷰 토글
import { useState } from "react";
import { List, LayoutList } from "lucide-react";
import type { Todo } from "@/types";

type Props = {
  todos: Todo[];
};

function getVariant(todo: Todo): "primary" | "coral" | "teal" | "periwinkle" | "done" {
  if (todo.is_done) return "done";
  if (todo.importance === 3) return "coral";
  if (todo.importance === 2) return "periwinkle";
  return "primary";
}

const VARIANT_STYLES = {
  primary: {
    bg: "var(--primary-soft)",
    border: "var(--primary)",
  },
  coral: {
    bg: "rgba(244,166,160,0.13)",
    border: "var(--coral)",
  },
  teal: {
    bg: "rgba(128,222,234,0.12)",
    border: "var(--teal)",
  },
  periwinkle: {
    bg: "rgba(168,180,240,0.13)",
    border: "#a8b4f0",
  },
  done: {
    bg: "var(--glass-subtle)",
    border: "var(--text-muted)",
  },
};

function parseDueAt(dueAt: string | null): Date | null {
  if (!dueAt) return null;
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatTime(date: Date | null): string {
  if (!date) return "시간 미정";
  const d = date;
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function TodayScheduler({ todos }: Props) {
  const [view, setView] = useState<"timeline" | "list">("timeline");

  const sorted = [...todos].sort((a, b) => {
    const timeA = parseDueAt(a.due_at)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const timeB = parseDueAt(b.due_at)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return timeA - timeB;
  });

  const hasTimedItems = sorted.some((todo) => parseDueAt(todo.due_at));

  return (
    <div
      className="rounded-[20px] border overflow-hidden"
      style={{
        background: "var(--glass)",
        borderColor: "var(--glass-border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3.5"
        style={{ borderColor: "var(--glass-border-subtle)" }}
      >
        <h2
          className="font-nunito text-[13.5px] font-extrabold"
          style={{ color: "var(--text-primary)" }}
        >
          오늘 일정
        </h2>
        <div
          className="flex rounded-[9999px] border p-0.5"
          style={{
            background: "var(--glass)",
            borderColor: "var(--glass-border)",
          }}
        >
          <button
            type="button"
            onClick={() => setView("timeline")}
            className="rounded-[9999px] p-1.5 transition-colors"
            style={{
              color: view === "timeline" ? "white" : "var(--text-muted)",
              background: view === "timeline" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "transparent",
              boxShadow: view === "timeline" ? "0 2px 10px var(--primary-glow)" : "none",
            }}
            aria-pressed={view === "timeline"}
            aria-label="타임라인 보기"
          >
            <LayoutList className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className="rounded-[9999px] p-1.5 transition-colors"
            style={{
              color: view === "list" ? "white" : "var(--text-muted)",
              background: view === "list" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "transparent",
              boxShadow: view === "list" ? "0 2px 10px var(--primary-glow)" : "none",
            }}
            aria-pressed={view === "list"}
            aria-label="리스트 보기"
          >
            <List className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="max-h-[360px] overflow-y-auto p-4">
        {view === "list" ? (
          <ul className="flex flex-col gap-2">
            {sorted.map((todo) => {
              const style = VARIANT_STYLES[getVariant(todo)];
              return (
                <li
                  key={todo.id}
                  className="rounded-[12px] border-l-2 py-2.5 pl-3 pr-3 transition-transform hover:translate-x-0.5"
                  style={{ background: style.bg, borderLeftColor: style.border, opacity: todo.is_done ? 0.55 : 1 }}
                >
                  <p className="font-nunito text-[12.5px] font-bold" style={{ color: "var(--text-on-card)" }}>
                    {todo.title}
                  </p>
                  <p className="mt-0.5 font-nunito text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                    {formatTime(parseDueAt(todo.due_at))}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="relative">
            {hasTimedItems ? (
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="rounded-[9999px] px-2 py-0.5 font-nunito text-[10px] font-extrabold"
                  style={{ color: "var(--primary)", background: "var(--primary-soft)" }}
                >
                  지금 여기
                </span>
                <span
                  className="h-px flex-1"
                  style={{ background: "linear-gradient(90deg, var(--primary), transparent)" }}
                />
              </div>
            ) : (
              <p className="mb-3 font-poppins text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                현재 일정은 시간 정보 없이 날짜 기준으로 관리됩니다.
              </p>
            )}
            <div className="space-y-3">
              {sorted.map((todo) => {
                const style = VARIANT_STYLES[getVariant(todo)];
                const dueTime = parseDueAt(todo.due_at);
                return (
                  <div
                    key={todo.id}
                    className="flex gap-3"
                  >
                    <div className="w-[42px] shrink-0 pt-1 text-right font-poppins text-[10.5px] font-medium" style={{ color: "var(--text-muted)" }}>
                      {formatTime(dueTime)}
                    </div>
                    <div className="relative flex-1 pl-2">
                      <div
                        className="absolute left-0 top-2 bottom-0 w-px"
                        style={{ background: "var(--tl-line)" }}
                      />
                      <div
                        className="relative rounded-[12px] border-l-2 py-2.5 pl-3 pr-3"
                        style={{ background: style.bg, borderLeftColor: style.border, opacity: todo.is_done ? 0.55 : 1 }}
                      >
                        <p className="font-nunito text-[12.5px] font-bold" style={{ color: "var(--text-on-card)" }}>
                          {todo.title}
                        </p>
                        <p className="mt-0.5 font-nunito text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                          {todo.reward ?? "보상 없음"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {sorted.length === 0 && (
          <p className="py-8 text-center font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            오늘 예정된 할 일이 없어요.
          </p>
        )}
      </div>
    </div>
  );
}
