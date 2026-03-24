// 변경 이유: 팀 상세 — 서버에서 팀/멤버/availability/메시지 조회 후 클라이언트에 전달
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamDetailClient from "@/components/teams/TeamDetailClient";
import type { AvailabilitySlot } from "@/types";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, created_by, invite_code, created_at, confirmed_slot")
    .eq("id", teamId)
    .single();

  if (teamError || !team) redirect("/teams");

  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) redirect("/teams");

  const { data: members } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, nickname, joined_at")
    .eq("team_id", teamId);

  const memberUserIds = (members ?? []).map((m) => m.user_id);
  const memberDisplays: Record<string, { nickname: string | null; email: string | null }> = {};
  (members ?? []).forEach((m) => {
    memberDisplays[m.user_id] = { nickname: m.nickname ?? null, email: null };
  });
  if (memberUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nickname, email")
      .in("id", memberUserIds);
    (profiles ?? []).forEach((p) => {
      memberDisplays[p.id] = {
        nickname: p.nickname ?? memberDisplays[p.id]?.nickname ?? null,
        email: p.email ?? null,
      };
    });
  }

  const { data: availabilityRows } = await supabase
    .from("availability")
    .select("user_id, available_slots")
    .eq("team_id", teamId);

  const availabilityList = (availabilityRows ?? []).map((r) => ({
    user_id: r.user_id,
    available_slots: (r.available_slots ?? []) as AvailabilitySlot[],
  }));

  const { data: messages } = await supabase
    .from("messages")
    .select("id, team_id, user_id, content, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  return (
    <TeamDetailClient
      team={team}
      members={members ?? []}
      availabilityList={availabilityList}
      messages={messages ?? []}
      userId={user.id}
      currentUserEmail={user.email ?? null}
      memberDisplays={memberDisplays}
    />
  );
}
