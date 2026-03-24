// 변경 이유: @dnd-kit sortable로 할 일 아이템을 드래그 가능한 컴포넌트로 분리합니다.
"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Check, Pencil, Pin, Trash2 } from "lucide-react";
import type { Todo, TodoImportance } from "@/types";

type Props = {
  todo: Todo;
  isManual: boolean;
  dueBadge: { label: string; bg: string; fg: string } | null;
  onToggleDone: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
};

function importanceDotColor(importance: TodoImportance): string {
  if (importance === 3) return "var(--coral)";
  if (importance === 2) return "var(--gold)";
  return "var(--text-muted)";
}

export default function SortableTodoItem({
  todo,
  isManual,
  dueBadge,
  onToggleDone,
  onEdit,
  onDelete,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.85 : 1,
      }}
      className="group"
    >
      <div
        className="flex items-center gap-3 rounded-[14px] border px-3 py-2.5"
        style={{
          background: "var(--glass)",
          borderColor: "var(--glass-border-subtle)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <button
          type="button"
          onClick={() => onToggleDone(todo)}
          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-opacity hover:opacity-90"
          style={{
            borderColor: todo.importance === 3 ? "var(--coral)" : "var(--glass-border)",
            background: todo.is_done
              ? "linear-gradient(135deg, var(--primary), #9b59b6)"
              : "transparent",
          }}
          aria-label={todo.is_done ? "완료 취소" : "완료 처리"}
        >
          {todo.is_done && <Check className="h-2.5 w-2.5 text-white" aria-hidden />}
        </button>

        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: importanceDotColor(todo.importance) }}
          aria-hidden
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className="truncate font-nunito text-[12.5px] font-bold"
              style={{
                color: "var(--text-on-card)",
                textDecoration: todo.is_done ? "line-through" : "none",
                opacity: todo.is_done ? 0.55 : 1,
              }}
            >
              {todo.title}
            </p>

            {isManual && (
              <span
                className="inline-flex items-center gap-1 rounded-[9999px] px-2 py-0.5 font-nunito text-[10px] font-bold"
                style={{
                  background: "var(--glass-strong)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-muted)",
                }}
                title="드래그로 직접 순서를 설정한 항목"
              >
                <Pin className="h-3 w-3" aria-hidden />
                직접 설정
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {dueBadge && (
              <span
                className="rounded-[9999px] px-2 py-0.5 font-nunito text-[10px] font-bold"
                style={{ background: dueBadge.bg, color: dueBadge.fg }}
              >
                {dueBadge.label}
              </span>
            )}
            {todo.reward && (
              <span
                className="truncate font-nunito text-[11px] font-medium"
                style={{ color: "var(--text-muted)" }}
                title={todo.reward}
              >
                {todo.reward}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(todo)}
            className="rounded-[10px] p-2 transition-colors hover:bg-[var(--glass-strong)]"
            aria-label="할 일 수정"
          >
            <Pencil className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(todo)}
            className="rounded-[10px] p-2 transition-colors hover:bg-[var(--glass-strong)]"
            aria-label="할 일 삭제"
          >
            <Trash2 className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
          </button>
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing rounded-[10px] p-2 transition-colors hover:bg-[var(--glass-strong)]"
            aria-label="드래그로 순서 변경"
            {...attributes}
            {...listeners}
          >
            <span className="block h-4 w-4" aria-hidden>
              <span
                className="block h-full w-full"
                style={{
                  background:
                    "linear-gradient(var(--text-muted) 0 0) left 3px top 4px/10px 1.5px no-repeat, linear-gradient(var(--text-muted) 0 0) left 3px top 8px/10px 1.5px no-repeat, linear-gradient(var(--text-muted) 0 0) left 3px top 12px/10px 1.5px no-repeat",
                  opacity: 0.9,
                }}
              />
            </span>
          </button>
        </div>
      </div>
    </li>
  );
}

