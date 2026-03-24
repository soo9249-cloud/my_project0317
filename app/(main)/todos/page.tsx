// 변경 이유: Supabase 연동(등록/조회/수정/삭제/완료 토글) + 정렬 + 드래그 순서 변경 + 완료율/보상(confetti+모달)을 구현합니다.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Brain, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Todo, TodoImportance } from "@/types";
import SortableTodoItem from "@/components/todos/SortableTodoItem";
import RewardModal from "@/components/todos/RewardModal";

type TodoInsert = {
  user_id: string;
  title: string;
  due_at: string | null;
  due_date: string | null;
  importance: TodoImportance;
  reward: string | null;
  sort_order: number;
};

const MANUAL_IDS_STORAGE_KEY = "manual_todo_ids";

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 오늘(로컬 날짜) + 유저별로 하나만 두는 “90% 달성 보상” 문구 (할 일마다 입력 불필요) */
const DAILY_REWARD_GOAL_STORAGE_KEY = "todo_daily_reward_goal_v1";

type DailyRewardGoalStored = {
  userId: string;
  day: string;
  text: string;
};

function loadDailyRewardGoal(userId: string): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(DAILY_REWARD_GOAL_STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return "";
    const rec = parsed as Partial<DailyRewardGoalStored>;
    const today = formatLocalDateKey(new Date());
    if (rec.userId !== userId || rec.day !== today || typeof rec.text !== "string") return "";
    return rec.text;
  } catch {
    return "";
  }
}

function saveDailyRewardGoal(userId: string, text: string) {
  const today = formatLocalDateKey(new Date());
  const payload: DailyRewardGoalStored = {
    userId,
    day: today,
    text: text.trim(),
  };
  localStorage.setItem(DAILY_REWARD_GOAL_STORAGE_KEY, JSON.stringify(payload));
}

function getTodoDateKey(todo: Pick<Todo, "due_at" | "due_date">): string | null {
  if (todo.due_date) return todo.due_date;
  if (!todo.due_at) return null;
  const d = new Date(todo.due_at);
  if (Number.isNaN(d.getTime())) return null;
  return formatLocalDateKey(d);
}

/**
 * 선택한 날짜·시간을 로컬(브라우저) 기준 순간으로 해석해 UTC ISO 문자열로 반환합니다.
 * 변경 이유: `2025-03-25T12:00:00`처럼 오프셋 없는 문자열은 DB(timestamptz)에서 UTC로 해석되어
 * 한국(UTC+9)에서 12시가 21시로 보이는 문제가 발생합니다.
 */
function buildDueAt(dateISO: string, timeHHmm: string): string | null {
  if (!dateISO) return null;
  const time = timeHHmm || "23:59";
  const parts = dateISO.split("-").map((n) => Number(n));
  const timeParts = time.split(":").map((n) => Number(n));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, mo, da] = parts;
  const h = timeParts[0] ?? 23;
  const mi = timeParts[1] ?? 59;
  if (Number.isNaN(h) || Number.isNaN(mi)) return null;
  const d = new Date(y, mo - 1, da, h, mi, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function splitDueAt(dueAt: string | null): { date: string; time: string } {
  if (!dueAt) return { date: "", time: "" };
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return {
    date: formatLocalDateKey(d),
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

function daysDiffFromToday(dateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateISO + "T00:00:00");
  const ms = d.getTime() - today.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function dueBadgeFor(todo: Pick<Todo, "due_at" | "due_date">): { label: string; bg: string; fg: string } | null {
  const dateKey = getTodoDateKey(todo);
  if (!dateKey) return null;
  const diff = daysDiffFromToday(dateKey);
  const dueTime = splitDueAt(todo.due_at).time;
  if (diff < 0) {
    return { label: dueTime ? `${Math.abs(diff)}일 지남 ${dueTime}` : `${Math.abs(diff)}일 지남`, bg: "rgba(244,166,160,0.20)", fg: "var(--coral-text)" };
  }
  if (diff === 0) {
    return { label: dueTime ? `오늘 ${dueTime}` : "오늘", bg: "rgba(244,166,160,0.20)", fg: "var(--coral-text)" };
  }
  if (diff === 1) {
    return { label: dueTime ? `내일 ${dueTime}` : "내일", bg: "rgba(251,191,36,0.15)", fg: "var(--gold-text)" };
  }
  if (diff === 2) {
    return { label: dueTime ? `모레 ${dueTime}` : "모레", bg: "rgba(251,191,36,0.15)", fg: "var(--gold-text)" };
  }
  return { label: dueTime ? `${diff}일 후 ${dueTime}` : `${diff}일 후`, bg: "rgba(128,222,234,0.15)", fg: "var(--teal-text)" };
}

/** 마감 순 정렬용 타임스탬프(ms). due_at 우선, 없으면 해당일 로컬 23:59, 둘 다 없으면 맨 뒤 */
function dueAtSortKey(todo: Todo): number {
  if (todo.due_at) {
    const t = new Date(todo.due_at).getTime();
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
  }
  if (todo.due_date) {
    const p = todo.due_date.split("-").map((n) => Number(n));
    if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return Number.MAX_SAFE_INTEGER;
    const [y, mo, da] = p;
    return new Date(y, mo - 1, da, 23, 59, 0, 0).getTime();
  }
  return Number.MAX_SAFE_INTEGER;
}

function sortDefault(a: Todo, b: Todo): number {
  const ad = dueAtSortKey(a);
  const bd = dueAtSortKey(b);
  if (ad !== bd) return ad - bd;
  // 같은 순간이면 importance 내림차순 (3 높음 → 1 낮음)
  if (a.importance !== b.importance) return b.importance - a.importance;
  return a.created_at.localeCompare(b.created_at);
}

function loadManualIds(): Set<string> {
  try {
    const raw = localStorage.getItem(MANUAL_IDS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function saveManualIds(ids: Set<string>) {
  localStorage.setItem(MANUAL_IDS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

export default function TodosPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 등록 폼 상태
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [dueTime, setDueTime] = useState<string>("");
  const [importance, setImportance] = useState<TodoImportance>(2);
  /** 오늘 90% 달성 시 보여줄 보상 문구 (할 일마다 입력하지 않음) */
  const [dailyRewardGoal, setDailyRewardGoal] = useState("");
  const [dailyRewardSaving, setDailyRewardSaving] = useState(false);
  const [dailyRewardSaved, setDailyRewardSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // 편집 상태
  const [editing, setEditing] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editDueTime, setEditDueTime] = useState<string>("");
  const [editImportance, setEditImportance] = useState<TodoImportance>(2);
  const [editReward, setEditReward] = useState("");

  // 완료율/보상
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const lastCelebratedRef = useRef<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const manualIds = useMemo(() => (typeof window === "undefined" ? new Set<string>() : loadManualIds()), []);

  async function fetchTodos(uid: string) {
    const { data, error: fetchError } = await supabase
      .from("todos")
      .select("id, user_id, title, due_at, due_date, importance, is_done, reward, sort_order, created_at")
      .eq("user_id", uid);

    if (fetchError) {
      setError(fetchError.message);
      setTodos([]);
      return;
    }

    setError(null);
    setTodos((data ?? []) as Todo[]);
  }

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      const { data, error: userError } = await supabase.auth.getUser();
      if (!mounted) return;
      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        setDailyRewardGoal(loadDailyRewardGoal(uid));
        await fetchTodos(uid);
      }
      setLoading(false);
    }
    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void init();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderedTodos = useMemo(() => {
    const withManualOrder = todos.filter((t) => t.sort_order && t.sort_order > 0).sort((a, b) => a.sort_order - b.sort_order);
    const rest = todos.filter((t) => !t.sort_order || t.sort_order <= 0).sort(sortDefault);
    return [...withManualOrder, ...rest];
  }, [todos]);

  const totalCount = orderedTodos.length;
  const doneCount = orderedTodos.filter((t) => t.is_done).length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const rewardText = useMemo(() => {
    const goal = dailyRewardGoal.trim();
    if (goal) return goal;
    const candidate = orderedTodos.find((t) => t.is_done && t.reward && t.reward.trim());
    return candidate?.reward ?? null;
  }, [orderedTodos, dailyRewardGoal]);

  useEffect(() => {
    if (totalCount === 0) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    const celebrateKey = `${todayKey}:${completionRate}`;
    if (completionRate >= 90 && lastCelebratedRef.current !== celebrateKey) {
      lastCelebratedRef.current = celebrateKey;
      const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const colors =
        theme === "dark"
          ? ["#6b8fff", "#4a72f5", "#67e8f9", "#ffffff", "#fbbf24"]
          : ["#e040fb", "#c400e0", "#a8b4f0", "#ffffff", "#f4a6a0"];

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors,
        gravity: 0.8,
        scalar: 0.9,
      });
      setRewardModalOpen(true);
    }
  }, [completionRate, totalCount]);

  async function handleCreate() {
    if (!userId) return;
    if (!title.trim()) {
      setError("제목은 필수입니다.");
      return;
    }
    setSaving(true);
    const payload: TodoInsert = {
      user_id: userId,
      title: title.trim(),
      due_at: buildDueAt(dueDate, dueTime),
      due_date: dueDate ? dueDate : null,
      importance,
      reward: null,
      sort_order: 0,
    };
    const { error: insertError } = await supabase.from("todos").insert(payload);
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setTitle("");
    setDueDate("");
    setDueTime("");
    setImportance(2);
    setError(null);
    await fetchTodos(userId);
  }

  function openEdit(todo: Todo) {
    setEditing(todo);
    setEditTitle(todo.title);
    const parsed = splitDueAt(todo.due_at);
    setEditDueDate(parsed.date || todo.due_date || "");
    setEditDueTime(parsed.time);
    setEditImportance(todo.importance);
    setEditReward(todo.reward ?? "");
  }

  async function applyEdit() {
    if (!editing) return;
    if (!editTitle.trim()) {
      setError("제목은 필수입니다.");
      return;
    }
    const { error: updateError } = await supabase
      .from("todos")
      .update({
        title: editTitle.trim(),
        due_at: buildDueAt(editDueDate, editDueTime),
        due_date: editDueDate ? editDueDate : null,
        importance: editImportance,
        reward: editReward.trim() ? editReward.trim() : null,
      })
      .eq("id", editing.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditing(null);
    setError(null);
    if (userId) await fetchTodos(userId);
  }

  async function handleDelete(todo: Todo) {
    const ok = window.confirm("정말 삭제할까요?");
    if (!ok) return;
    const { error: delError } = await supabase.from("todos").delete().eq("id", todo.id);
    if (delError) {
      setError(delError.message);
      return;
    }
    setError(null);
    if (userId) await fetchTodos(userId);
  }

  async function toggleDone(todo: Todo) {
    const { error: toggleError } = await supabase
      .from("todos")
      .update({ is_done: !todo.is_done })
      .eq("id", todo.id);
    if (toggleError) {
      setError(toggleError.message);
      return;
    }
    setError(null);
    if (userId) await fetchTodos(userId);
  }

  async function persistSortOrder(next: Todo[]) {
    // 먼저 화면을 즉시 바꿔 체감 지연을 줄이고, 이후 DB 저장 실패 시 재조회로 원복
    setTodos(next);
    // sort_order를 1..n으로 재색인
    const updates = next.map((t, idx) => ({ id: t.id, sort_order: idx + 1 }));
    const results = await Promise.all(
      updates.map((u) => supabase.from("todos").update({ sort_order: u.sort_order }).eq("id", u.id))
    );
    const failed = results.find((r) => !!r.error);
    if (failed?.error) {
      setError(`정렬 저장 실패: ${failed.error.message}`);
      if (userId) await fetchTodos(userId);
      return;
    }
    setError(null);
    if (userId) await fetchTodos(userId);
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedTodos.findIndex((t) => t.id === active.id);
    const newIndex = orderedTodos.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(orderedTodos, oldIndex, newIndex);

    const nextManual = new Set(manualIds);
    nextManual.add(String(active.id));
    saveManualIds(nextManual);

    await persistSortOrder(next);
  }

  function handleSaveDailyRewardGoal() {
    if (!userId) {
      setError("로그인 정보를 확인할 수 없습니다.");
      return;
    }
    setDailyRewardSaving(true);
    saveDailyRewardGoal(userId, dailyRewardGoal);
    setDailyRewardSaving(false);
    setDailyRewardSaved(true);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-nunito text-[16px] font-extrabold" style={{ color: "var(--text-primary)" }}>
            내 할 일
          </h1>
          <p className="mt-1 font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            완료율 90%를 달성하면 아래에 적어 둔 보상 문구가 모달로 열려요. (할 일마다 보상을 넣을 필요 없어요)
          </p>
        </div>
        <Link
          href="/dashboard"
          className="hidden rounded-[9999px] border px-3 py-1 font-poppins text-xs font-medium md:inline-flex"
          style={{
            background: "var(--glass)",
            borderColor: "var(--glass-border)",
            color: "var(--text-primary)",
          }}
        >
          대시보드로
        </Link>
      </div>

      {/* 완료율 프로그레스 바 */}
      <div
        className="rounded-[20px] border p-4"
        style={{
          background: "var(--glass)",
          borderColor: "var(--glass-border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center justify-between">
          <p className="font-nunito text-[12.5px] font-bold" style={{ color: "var(--text-on-card)" }}>
            오늘 완료율
          </p>
          <p className="font-nunito text-[12.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
            {completionRate}%
          </p>
        </div>
        <div
          className="mt-3 h-[3px] w-full overflow-hidden rounded-[9999px]"
          style={{ background: "var(--glass-border-subtle)" }}
        >
          <div
            className="h-full rounded-[9999px]"
            style={{
              width: `${completionRate}%`,
              background: "linear-gradient(90deg, var(--primary), var(--primary-dark))",
            }}
          />
        </div>
      </div>

      {/* 오늘 목표 달성 시 보상 (하루·계정당 하나, localStorage) */}
      <div
        className="rounded-[20px] border p-4"
        style={{
          background: "var(--glass)",
          borderColor: "var(--glass-border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <h2 className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
          오늘의 보상(90% 이상 계획 달성 시)
        </h2>
        <p className="mt-1 font-poppins text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
          하루에 한 번만 정하면 됩니다. 자정이 지나면 다시 입력할 수 있어요.
        </p>
        <label className="mt-3 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          달성하면 나에게 줄 보상
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <input
            value={dailyRewardGoal}
            onChange={(e) => {
              setDailyRewardGoal(e.target.value);
              setDailyRewardSaved(false);
            }}
            placeholder="예: 좋아하는 카페에서 케이크"
            className="min-w-[220px] flex-1 rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
            style={{
              background: "var(--glass-strong)",
              borderColor: "var(--glass-border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="button"
            onClick={handleSaveDailyRewardGoal}
            disabled={dailyRewardSaving || !userId}
            className="rounded-[9999px] px-4 py-2.5 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
          >
            {dailyRewardSaving ? "저장 중..." : "보상 등록"}
          </button>
        </div>
        {dailyRewardSaved && (
          <p className="mt-2 font-poppins text-[11px] font-medium" style={{ color: "var(--teal-text)" }}>
            오늘의 보상이 저장되었습니다.
          </p>
        )}
      </div>

      {/* 등록 폼 */}
      <div
        className="rounded-[20px] border p-5"
        style={{
          background: "var(--glass)",
          borderColor: "var(--glass-border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
            할 일 등록
          </h2>
          <Brain className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              제목 <span style={{ color: "var(--coral)" }}>*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일을 입력하세요"
              className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              마감일
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              마감 시간
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              중요도
            </label>
            <div className="flex gap-2">
              {([
                { v: 1 as const, label: "낮음" },
                { v: 2 as const, label: "중간" },
                { v: 3 as const, label: "높음" },
              ] as const).map((opt) => {
                const active = importance === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setImportance(opt.v)}
                    className="flex-1 rounded-[9999px] border px-3 py-2 font-nunito text-xs font-bold transition-opacity hover:opacity-95"
                    style={{
                      background: active
                        ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                        : "var(--glass-strong)",
                      borderColor: "var(--glass-border)",
                      color: active ? "white" : "var(--text-secondary)",
                      boxShadow: active ? "0 2px 10px var(--primary-glow)" : "none",
                    }}
                    aria-pressed={active}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 font-poppins text-xs font-medium" style={{ color: "var(--coral-text)" }} role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving || loading || !userId}
            className="inline-flex items-center gap-2 rounded-[9999px] px-5 py-2.5 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] transition-[transform,box-shadow] hover:translate-y-[-1px] disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {saving ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>

      {/* 목록 + DnD */}
      <div className="flex items-center justify-between">
        <h2 className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
          할 일 목록
        </h2>
        <p className="font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          드래그로 순서 변경 가능
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          불러오는 중...
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void onDragEnd(e)}>
          <SortableContext items={orderedTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {orderedTodos.map((todo) => (
                <SortableTodoItem
                  key={todo.id}
                  todo={todo}
                  isManual={manualIds.has(todo.id)}
                  dueBadge={dueBadgeFor(todo)}
                  onToggleDone={toggleDone}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* 편집 모달 (간단) */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setEditing(null)}
            aria-label="편집 닫기"
            style={{ background: "rgba(0,0,0,0.25)" }}
          />
          <div
            className="relative w-full max-w-[520px] rounded-[24px] border p-6"
            style={{
              background: "var(--glass-strong)",
              borderColor: "var(--glass-border)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "var(--shadow-card-hover)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="할 일 수정"
          >
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="absolute right-3 top-3 rounded-[10px] p-2 transition-colors hover:bg-[var(--glass)]"
              aria-label="닫기"
            >
              <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
            </button>
            <h3 className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
              할 일 수정
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  제목
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
                  style={{
                    background: "var(--glass)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  마감일
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
                  style={{
                    background: "var(--glass)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  마감 시간
                </label>
                <input
                  type="time"
                  value={editDueTime}
                  onChange={(e) => setEditDueTime(e.target.value)}
                  className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
                  style={{
                    background: "var(--glass)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  중요도
                </label>
                <div className="flex gap-2">
                  {([
                    { v: 1 as const, label: "낮음" },
                    { v: 2 as const, label: "중간" },
                    { v: 3 as const, label: "높음" },
                  ] as const).map((opt) => {
                    const active = editImportance === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setEditImportance(opt.v)}
                        className="flex-1 rounded-[9999px] border px-3 py-2 font-nunito text-xs font-bold"
                        style={{
                          background: active
                            ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                            : "var(--glass)",
                          borderColor: "var(--glass-border)",
                          color: active ? "white" : "var(--text-secondary)",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  개별 보상 (선택)
                </label>
                <p className="mb-1.5 font-poppins text-[10.5px] font-medium" style={{ color: "var(--text-muted)" }}>
                  보통은 위쪽「오늘 90% 달성 보상」만 쓰면 됩니다. 예전 데이터용으로 남겨 둔 필드예요.
                </p>
                <input
                  value={editReward}
                  onChange={(e) => setEditReward(e.target.value)}
                  placeholder="비워 두면 DB에는 비움으로 저장"
                  className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
                  style={{
                    background: "var(--glass)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
            {error && (
              <p className="mt-3 font-poppins text-xs font-medium" style={{ color: "var(--coral-text)" }} role="alert">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-[9999px] border px-5 py-2 font-nunito text-xs font-bold"
                style={{ background: "var(--glass)", borderColor: "var(--glass-border)", color: "var(--text-primary)" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void applyEdit()}
                className="rounded-[9999px] px-5 py-2 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)]"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      <RewardModal open={rewardModalOpen} rewardText={rewardText} onClose={() => setRewardModalOpen(false)} />
    </div>
  );
}
