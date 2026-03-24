"use client";

// 변경 이유: 팀 상세 — 좌측 일정조율(가능 시간 폼·추천·확정·공유문구) / 우측 채팅, 모바일 세로 배치
import { useCallback, useMemo, useState } from "react";
import { Copy, CalendarDays, Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTopOverlapSlots, formatDate, formatConfirmedMessage } from "@/lib/utils/schedule";
import type { Team, TeamMember, AvailabilitySlot } from "@/types";
import AvailabilityForm from "./AvailabilityForm";
import TeamChat from "./TeamChat";

type AvailabilityRow = { user_id: string; available_slots: AvailabilitySlot[] };
type MessageWithEmail = { id: string; team_id: string; user_id: string; content: string; created_at: string; email?: string | null };

type Props = {
  team: Team;
  members: TeamMember[];
  availabilityList: AvailabilityRow[];
  messages: MessageWithEmail[];
  userId: string;
  currentUserEmail?: string | null;
  memberDisplays?: Record<string, { nickname: string | null; email: string | null }>;
};

export default function TeamDetailClient({
  team,
  members,
  availabilityList,
  messages,
  userId,
  currentUserEmail,
  memberDisplays = {},
}: Props) {
  const [availList, setAvailList] = useState(availabilityList);
  const [confirmedSlot, setConfirmedSlot] = useState<Team["confirmed_slot"]>(team.confirmed_slot ?? null);
  const supabase = createClient();

  const mySlots = useMemo(
    () => availList.find((a) => a.user_id === userId)?.available_slots ?? [],
    [availList, userId]
  );

  const allSlotsForIntersection = useMemo(
    () => availList.map((a) => a.available_slots).filter((s) => s.length > 0),
    [availList]
  );

  const topSlots = useMemo(
    () => getTopOverlapSlots(allSlotsForIntersection, 3),
    [allSlotsForIntersection]
  );

  const whoSubmitted = useMemo(
    () => availList.filter((a) => a.available_slots.length > 0).map((a) => a.user_id),
    [availList]
  );
  const missingMembers = useMemo(
    () => members.filter((m) => !whoSubmitted.includes(m.user_id)),
    [members, whoSubmitted]
  );

  const refreshAvailability = useCallback(async () => {
    const { data } = await supabase
      .from("availability")
      .select("user_id, available_slots")
      .eq("team_id", team.id);
    setAvailList((data as AvailabilityRow[]) ?? []);
    const { data: teamData } = await supabase
      .from("teams")
      .select("confirmed_slot")
      .eq("id", team.id)
      .single();
    if (teamData?.confirmed_slot) setConfirmedSlot(teamData.confirmed_slot as Team["confirmed_slot"]);
  }, [supabase, team.id]);

  async function handleConfirm(slot: { date: string; start: string; end: string }) {
    await supabase
      .from("teams")
      .update({ confirmed_slot: slot })
      .eq("id", team.id);
    setConfirmedSlot(slot);
  }

  async function handleReopenScheduling() {
    await supabase
      .from("teams")
      .update({ confirmed_slot: null })
      .eq("id", team.id);
    setConfirmedSlot(null);
    await refreshAvailability();
  }

  function copyShareText() {
    if (!confirmedSlot) return;
    const text = formatConfirmedMessage(confirmedSlot);
    void navigator.clipboard.writeText(text);
  }

  const leftColumn = (
    <div className="flex flex-col gap-4">
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
        <h2 className="mb-3 flex items-center gap-2 font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
          <CalendarDays className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
          가능 시간 입력
        </h2>
        <AvailabilityForm
          teamId={team.id}
          userId={userId}
          initialSlots={mySlots}
          onSaved={refreshAvailability}
        />
      </div>

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
        <h2 className="mb-3 font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
          팀원별 입력 현황
        </h2>
        <ul className="flex flex-wrap gap-2">
          {members.map((m) => {
            const submitted = whoSubmitted.includes(m.user_id);
            return (
              <li
                key={m.id}
                className="rounded-[9999px] px-3 py-1 font-poppins text-[11px] font-medium"
                style={{
                  background: submitted ? "rgba(128,222,234,0.18)" : "var(--glass-subtle)",
                  color: submitted ? "var(--teal-text)" : "var(--text-muted)",
                }}
              >
                {m.user_id === userId ? "나" : (m.nickname || "멤버")} {submitted ? "입력함" : "미입력"}
              </li>
            );
          })}
        </ul>
      </div>

      {topSlots.length > 0 && !confirmedSlot && (
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
          <h2 className="mb-3 flex items-center gap-2 font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
            <Trophy className="h-4 w-4" style={{ color: "var(--gold)" }} aria-hidden />
            추천 시간
          </h2>
          <ul className="flex flex-col gap-2">
            {topSlots.map((slot, i) => (
              <li
                key={`${slot.date}-${slot.start}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border p-3"
                style={{ borderColor: "var(--glass-border-subtle)", background: "var(--glass-subtle)" }}
              >
                <div>
                  <p className="font-nunito text-[12.5px] font-bold" style={{ color: "var(--text-on-card)" }}>
                    {formatDate(slot.date)} {slot.start} ~ {slot.end}
                  </p>
                  <p className="font-poppins text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                    {slot.durationMinutes}분
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleConfirm({ date: slot.date, start: slot.start, end: slot.end })}
                  className="rounded-[9999px] px-4 py-2 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)]"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
                >
                  이 시간으로 확정
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmedSlot && (
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
          <h2 className="mb-3 font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
            공유 문구
          </h2>
          {missingMembers.length > 0 && (
            <div
              className="mb-3 rounded-[12px] border p-3"
              style={{ borderColor: "rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.1)" }}
            >
              <p className="font-poppins text-[11px] font-medium" style={{ color: "var(--gold-text)" }}>
                아직 {missingMembers.length}명의 팀원이 가능 시간을 입력하지 않았어요.
              </p>
              <button
                type="button"
                onClick={() => void handleReopenScheduling()}
                className="mt-2 rounded-[9999px] border px-3 py-1.5 font-nunito text-[11px] font-bold"
                style={{
                  background: "var(--glass-strong)",
                  borderColor: "var(--glass-border)",
                  color: "var(--text-primary)",
                }}
              >
                다시 조율하기
              </button>
            </div>
          )}
          <p className="font-poppins text-[12px] font-medium" style={{ color: "var(--text-on-card)" }}>
            {formatConfirmedMessage(confirmedSlot)}
          </p>
          <button
            type="button"
            onClick={copyShareText}
            className="mt-3 inline-flex items-center gap-2 rounded-[9999px] border px-4 py-2 font-nunito text-xs font-bold"
            style={{
              background: "var(--primary-soft)",
              borderColor: "var(--glass-border)",
              color: "var(--primary)",
            }}
          >
            <Copy className="h-4 w-4" aria-hidden />
            복사
          </button>
        </div>
      )}
    </div>
  );

  const rightColumn = (
    <TeamChat
      teamId={team.id}
      userId={userId}
      teamName={team.name}
      initialMessages={messages}
      currentUserEmail={currentUserEmail}
      memberDisplays={memberDisplays}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" style={{ color: "var(--text-muted)" }} aria-hidden />
        <h1 className="font-nunito text-[16px] font-extrabold" style={{ color: "var(--text-primary)" }}>
          {team.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">{leftColumn}</div>
        <div className="md:order-none order-last">{rightColumn}</div>
      </div>
    </div>
  );
}
