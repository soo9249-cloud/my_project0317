"use client";

// 변경 이유: 대시보드 우측 패널 — 오늘 할 일 상위 5개, 클릭 시 완료 토글 (0317_design.json todoItem)
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Todo, TodoImportance } from "@/types";

type Props = {
  todos: Todo[];
};

function getImportanceColor(importance: TodoImportance): string {
  if (importance === 3) return "var(--coral)";
  if (importance === 2) return "var(--gold)";
  return "var(--text-muted)";
}

export default function TodayTodoList({ todos }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function toggleDone(id: string, current: boolean) {
    await supabase.from("todos").update({ is_done: !current }).eq("id", id);
    router.refresh();
  }

  const displayList = todos.slice(0, 5);
  if (displayList.length === 0) {
    return (
      <p
        className="py-4 font-poppins text-xs font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        오늘 할 일이 없어요.
      </p>
    );
  }

  return (
    <ul className="divide-y" style={{ borderColor: "var(--glass-border-subtle)" }}>
      {displayList.map((todo) => (
        <li key={todo.id}>
          <button
            type="button"
            onClick={() => toggleDone(todo.id, todo.is_done)}
            className="flex w-full items-center gap-3 px-2 py-2.5 text-left transition-colors hover:bg-[var(--primary-soft)]"
          >
            <span
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
              style={{
                borderColor: todo.importance === 3 ? "var(--coral)" : "var(--glass-border)",
                background: todo.is_done
                  ? "linear-gradient(135deg, var(--primary), #9b59b6)"
                  : "transparent",
              }}
            >
              {todo.is_done && <Check className="h-2.5 w-2.5 text-white" aria-hidden />}
            </span>
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: getImportanceColor(todo.importance) }}
              aria-hidden
            />
            <span
              className="flex-1 truncate font-nunito text-[12.5px] font-bold"
              style={{
                color: "var(--text-on-card)",
                textDecoration: todo.is_done ? "line-through" : "none",
                opacity: todo.is_done ? 0.7 : 1,
              }}
            >
              {todo.title}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
