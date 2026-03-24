// 변경 이유: 대시보드 서버 컴포넌트 — Supabase에서 오늘/이번 주 todos 조회 후 RewardBanner, StatCard, 타임라인, 우측 패널 렌더
import { createClient } from "@/lib/supabase/server";
import RewardBanner from "@/components/dashboard/RewardBanner";
import StatCard from "@/components/dashboard/StatCard";
import TodayScheduler from "@/components/dashboard/TodayScheduler";
import TodayTodoList from "@/components/dashboard/TodayTodoList";
import TeamSchedulePanel from "@/components/dashboard/TeamSchedulePanel";
import CompletionRing from "@/components/dashboard/CompletionRing";
import { LayoutDashboard, AlertCircle, Users, Trophy } from "lucide-react";

function getTodayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function getWeekRange(): { start: string; end: string } {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodoDateKey(todo: { due_at: string | null; due_date: string | null }): string | null {
  if (todo.due_date) return todo.due_date;
  if (!todo.due_at) return null;
  const d = new Date(todo.due_at);
  if (Number.isNaN(d.getTime())) return null;
  return toLocalDateKey(d);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const todayISO = getTodayISO();
  const { start: weekStart, end: weekEnd } = getWeekRange();

  const { data: allTodos } = await supabase
    .from("todos")
    .select("id, user_id, title, due_at, due_date, importance, is_done, reward, sort_order, created_at")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  const todos = allTodos ?? [];
  const todayTodos = todos.filter((t) => getTodoDateKey(t) === todayISO);
  const todayTotal = todayTodos.length;
  const todayCompleted = todayTodos.filter((t) => t.is_done).length;
  const weekTodos = todos.filter(
    (t) => {
      const key = getTodoDateKey(t);
      return !!key && key >= weekStart && key <= weekEnd;
    }
  );
  const weekTotal = weekTodos.length;
  const weekCompleted = weekTodos.filter((t) => t.is_done).length;
  const weekRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  const { data: myTeamRows } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);
  const myTeamIds = (myTeamRows ?? []).map((r) => r.team_id);

  type ConfirmedSlot = { date?: string; start?: string; end?: string };
  let teamMeetings: Array<{ teamId: string; teamName: string; date: string; start: string; end: string }> = [];
  if (myTeamIds.length > 0) {
    const { data: myTeams } = await supabase
      .from("teams")
      .select("id, name, confirmed_slot")
      .in("id", myTeamIds);

    teamMeetings = (myTeams ?? [])
      .map((team) => {
        const slot = (team.confirmed_slot ?? null) as ConfirmedSlot | null;
        if (!slot?.date || !slot?.start || !slot?.end) return null;
        return {
          teamId: team.id,
          teamName: team.name,
          date: slot.date,
          start: slot.start,
          end: slot.end,
        };
      })
      .filter((meeting): meeting is { teamId: string; teamName: string; date: string; start: string; end: string } => !!meeting)
      .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  }

  return (
    <>
      <RewardBanner
        completedToday={todayCompleted}
        totalToday={todayTotal}
        userId={user.id}
        onClaim={undefined}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={LayoutDashboard}
          accent="pink"
          value={`${todayCompleted}/${todayTotal}`}
          label="오늘 할 일"
        />
        <StatCard
          icon={AlertCircle}
          accent="coral"
          value={todayTotal - todayCompleted}
          label="오늘 마감 할 일"
        />
        <StatCard
          icon={Users}
          accent="periwinkle"
          value={teamMeetings.length}
          label="예정된 팀 회의"
        />
        <StatCard
          icon={Trophy}
          accent="teal"
          value={`${weekRate}%`}
          label="이번 주 완료율"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayScheduler todos={todayTodos} />
        </div>
        <div
          className="flex flex-col gap-4 rounded-[20px] border p-4"
          style={{
            background: "var(--glass)",
            borderColor: "var(--glass-border)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div>
            <h3
              className="mb-3 font-nunito text-[13.5px] font-extrabold"
              style={{ color: "var(--text-primary)" }}
            >
              완료율
            </h3>
            <CompletionRing
              value={todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0}
              label="오늘"
            />
          </div>
          <div>
            <h3
              className="mb-3 font-nunito text-[13.5px] font-extrabold"
              style={{ color: "var(--text-primary)" }}
            >
              오늘 할 일
            </h3>
            <TodayTodoList todos={todayTodos} />
          </div>
          <TeamSchedulePanel meetings={teamMeetings} />
        </div>
      </div>
    </>
  );
}
