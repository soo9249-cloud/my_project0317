"use client";

// 변경 이유: 팀 목록(team_members 기준), 팀 만들기·참여 시 표시 이름(team_members.nickname), 6자리 초대코드, 카드 클릭 시 /teams/[teamId]
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Plus, Trash2, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Team } from "@/types";

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_TEAM_MEMBERS = 10;
const TEAM_DISPLAY_MIN = 1;
const TEAM_DISPLAY_MAX = 30;
const PAGE_SIZE = 20;
type JoinByInviteResult = {
  status: "ok" | "invalid_code" | "team_full" | "already_member" | "unauthenticated";
  team_id: string | null;
};

function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
}

export default function TeamsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Array<Team & { member_count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [lastCreatedInviteCode, setLastCreatedInviteCode] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState("");
  const [joinSaving, setJoinSaving] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [profileDisplayHint, setProfileDisplayHint] = useState("");
  const [createMemberDisplayName, setCreateMemberDisplayName] = useState("");
  const [joinMemberDisplayName, setJoinMemberDisplayName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);

  const fetchMyTeams = useCallback(
    async (uid: string) => {
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", uid);
      if (membersError) {
        setError(membersError.message);
        setTeams([]);
        return;
      }
      const teamIds = (members ?? []).map((m) => m.team_id);
      if (teamIds.length === 0) {
        setTeams([]);
        setError(null);
        return;
      }
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, created_by, invite_code, created_at, confirmed_slot")
        .in("id", teamIds);
      if (teamsError) {
        setError(teamsError.message);
        setTeams([]);
        return;
      }
      const countMap: Record<string, number> = {};
      const { data: countData } = await supabase
        .from("team_members")
        .select("team_id")
        .in("team_id", teamIds);
      (countData ?? []).forEach((r: { team_id: string }) => {
        countMap[r.team_id] = (countMap[r.team_id] ?? 0) + 1;
      });
      setTeams(
        (teamsData ?? []).map((t) => ({
          ...t,
          member_count: countMap[t.id] ?? 0,
        })) as Array<Team & { member_count: number }>
      );
      setError(null);
    },
    [supabase]
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const [, profRes] = await Promise.all([
          fetchMyTeams(uid),
          supabase.from("profiles").select("nickname").eq("id", uid).maybeSingle(),
        ]);
        if (!cancelled) {
          const hint = profRes.data?.nickname?.trim() ?? "";
          setProfileDisplayHint(hint);
          setCreateMemberDisplayName(hint);
          setJoinMemberDisplayName(hint);
        }
      }
      if (!cancelled) setLoading(false);
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [supabase, fetchMyTeams]);

  async function handleCreate() {
    if (!userId) return;
    const name = createName.trim();
    if (!name) {
      setError("팀 이름을 입력하세요.");
      return;
    }
    const memberNick = createMemberDisplayName.trim();
    if (memberNick.length < TEAM_DISPLAY_MIN) {
      setError("팀에서 보일 이름을 입력하세요.");
      return;
    }
    if (memberNick.length > TEAM_DISPLAY_MAX) {
      setError(`표시 이름은 ${TEAM_DISPLAY_MAX}자 이하로 입력하세요.`);
      return;
    }
    setCreateSaving(true);
    setError(null);
    let code = generateInviteCode();
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const { data: existing } = await supabase.from("teams").select("id").eq("invite_code", code).maybeSingle();
      if (!existing) break;
      code = generateInviteCode();
    }
    const { data: team, error: insertError } = await supabase
      .from("teams")
      .insert({ name, created_by: userId, invite_code: code })
      .select("id")
      .single();
    if (insertError) {
      setError(insertError.message);
      setCreateSaving(false);
      return;
    }
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({ team_id: team.id, user_id: userId, nickname: memberNick });
    if (memberError) {
      setError(memberError.message);
      setCreateSaving(false);
      return;
    }
    setCreateOpen(false);
    setCreateName("");
    setCreateMemberDisplayName(profileDisplayHint);
    setLastCreatedInviteCode(code);
    setCreateSaving(false);
    setError(null);
    await fetchMyTeams(userId);
  }

  async function handleJoin() {
    if (!userId) return;
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setError("초대 코드를 입력하세요.");
      return;
    }
    const memberNick = joinMemberDisplayName.trim();
    if (memberNick.length < TEAM_DISPLAY_MIN) {
      setError("팀에서 보일 이름을 입력하세요.");
      return;
    }
    if (memberNick.length > TEAM_DISPLAY_MAX) {
      setError(`표시 이름은 ${TEAM_DISPLAY_MAX}자 이하로 입력하세요.`);
      return;
    }
    setJoinSaving(true);
    setError(null);
    const { data: joinData, error: joinError } = await supabase.rpc("join_team_by_invite_code", {
      p_invite_code: code,
      p_nickname: memberNick,
    });
    if (joinError) {
      setError(`초대 코드 참여 실패: ${joinError.message}`);
      setJoinSaving(false);
      return;
    }
    const first = (joinData as JoinByInviteResult[] | null)?.[0];
    const status = first?.status;
    if (status !== "ok") {
      if (status === "invalid_code") setError("유효하지 않은 초대 코드입니다.");
      else if (status === "team_full") setError(`팀 인원이 가득 찼습니다. (최대 ${MAX_TEAM_MEMBERS}명)`);
      else if (status === "already_member") setError("이미 참여 중인 팀입니다.");
      else if (status === "unauthenticated") setError("로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.");
      else setError("초대 코드 처리 중 알 수 없는 오류가 발생했습니다.");
      setJoinSaving(false);
      return;
    }
    setInviteCode("");
    setJoinMemberDisplayName(profileDisplayHint);
    setJoinSaving(false);
    setError(null);
    await fetchMyTeams(userId);
  }

  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(q) || t.invite_code.toLowerCase().includes(q));
  }, [teams, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const pagedTeams = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTeams.slice(start, start + PAGE_SIZE);
  }, [filteredTeams, currentPage]);

  async function handleDeleteTeam(team: Team) {
    if (!userId) return;
    if (team.created_by !== userId) {
      setError("팀장만 팀을 삭제할 수 있습니다.");
      return;
    }

    const shouldDelete = window.confirm(
      `정말 "${team.name}" 팀을 삭제할까요?\n팀원, 가능 시간, 채팅 기록이 모두 삭제되며 되돌릴 수 없습니다.`
    );
    if (!shouldDelete) return;

    setDeletingTeamId(team.id);
    setError(null);

    const { error: messagesDeleteError } = await supabase.from("messages").delete().eq("team_id", team.id);
    if (messagesDeleteError) {
      setError(`메시지 삭제 실패: ${messagesDeleteError.message}`);
      setDeletingTeamId(null);
      return;
    }

    const { error: availabilityDeleteError } = await supabase.from("availability").delete().eq("team_id", team.id);
    if (availabilityDeleteError) {
      setError(`가능 시간 삭제 실패: ${availabilityDeleteError.message}`);
      setDeletingTeamId(null);
      return;
    }

    const { error: membersDeleteError } = await supabase.from("team_members").delete().eq("team_id", team.id);
    if (membersDeleteError) {
      setError(`팀원 정보 삭제 실패: ${membersDeleteError.message}`);
      setDeletingTeamId(null);
      return;
    }

    const { error: teamDeleteError } = await supabase
      .from("teams")
      .delete()
      .eq("id", team.id)
      .eq("created_by", userId);
    if (teamDeleteError) {
      setError(`팀 삭제 실패: ${teamDeleteError.message}`);
      setDeletingTeamId(null);
      return;
    }

    setDeletingTeamId(null);
    setError(null);
    await fetchMyTeams(userId);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-nunito text-[16px] font-extrabold" style={{ color: "var(--text-primary)" }}>
            팀 목록
          </h1>
          <p className="mt-1 font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            팀을 만들거나 초대 코드로 참여하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setCreateMemberDisplayName(profileDisplayHint);
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-[9999px] border px-4 py-2 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] transition-[transform,box-shadow] hover:translate-y-[-1px]"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            borderColor: "transparent",
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          팀 만들기
        </button>
      </div>

      {/* 초대 코드로 참여 */}
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
          초대 코드로 참여
        </h2>
        <p className="mt-1 font-poppins text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
          팀당 최대 {MAX_TEAM_MEMBERS}명까지 참여할 수 있어요.
        </p>
        <label className="mt-3 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          팀에서 보일 이름
        </label>
        <input
          value={joinMemberDisplayName}
          onChange={(e) => setJoinMemberDisplayName(e.target.value)}
          placeholder="채팅·일정 화면에 표시"
          maxLength={TEAM_DISPLAY_MAX}
          className="mt-1.5 w-full max-w-sm rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
          style={{
            background: "var(--glass-strong)",
            borderColor: "var(--glass-border)",
            color: "var(--text-primary)",
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="예: A3K9PW"
            maxLength={6}
            className="rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
            style={{
              background: "var(--glass-strong)",
              borderColor: "var(--glass-border)",
              color: "var(--text-primary)",
              width: "140px",
            }}
          />
          <button
            type="button"
            onClick={() => void handleJoin()}
            disabled={joinSaving || !userId}
            className="rounded-[9999px] px-4 py-2.5 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
          >
            {joinSaving ? "참여 중..." : "참여하기"}
          </button>
        </div>
      </div>

      {/* 팀 생성 후 초대 코드 표시 */}
      {lastCreatedInviteCode && (
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
                팀이 생성되었습니다
              </p>
              <p className="mt-1 font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                아래 초대 코드를 팀원에게 공유하세요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLastCreatedInviteCode(null)}
              className="rounded-[10px] p-2 hover:bg-[var(--glass-strong)]"
              aria-label="닫기"
            >
              <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div
              className="rounded-[12px] border px-4 py-2 font-nunito text-[16px] font-extrabold tracking-[0.25em]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            >
              {lastCreatedInviteCode}
            </div>
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(lastCreatedInviteCode)}
              className="inline-flex items-center gap-2 rounded-[9999px] border px-4 py-2 font-nunito text-xs font-bold"
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
        </div>
      )}

      {error && (
        <p className="font-poppins text-xs font-medium" style={{ color: "var(--coral-text)" }} role="alert">
          {error}
        </p>
      )}

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
            참여 중인 팀
          </h2>
          <p className="font-poppins text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            총 {filteredTeams.length}개
          </p>
        </div>
        <input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setRequestedPage(1);
          }}
          placeholder="팀 이름 또는 초대 코드 검색"
          className="mt-3 w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
          style={{
            background: "var(--glass-strong)",
            borderColor: "var(--glass-border)",
            color: "var(--text-primary)",
          }}
        />
        <p className="mt-2 font-poppins text-[10.5px] font-medium" style={{ color: "var(--text-muted)" }}>
          현재 목록은 내가 이미 참여한 팀 기준입니다. 다른 팀 탐색 목록은 다음 단계에서 분리 예정입니다.
        </p>
      </div>

      {loading ? (
        <p className="py-8 text-center font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          불러오는 중...
        </p>
      ) : teams.length === 0 ? (
        <div
          className="rounded-[20px] border py-12 text-center"
          style={{
            background: "var(--glass)",
            borderColor: "var(--glass-border)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <Users className="mx-auto h-10 w-10" style={{ color: "var(--text-muted)" }} aria-hidden />
          <p className="mt-3 font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            참여 중인 팀이 없어요. 팀을 만들거나 초대 코드로 참여하세요.
          </p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div
          className="rounded-[20px] border py-10 text-center"
          style={{
            background: "var(--glass)",
            borderColor: "var(--glass-border)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <p className="font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            검색 결과가 없어요.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pagedTeams.map((team) => (
              <li key={team.id}>
                <div
                  className="rounded-[20px] border p-4 transition-[transform,box-shadow] hover:translate-y-[-1px] hover:shadow-[var(--shadow-card-hover)]"
                  style={{
                    background: "var(--glass)",
                    borderColor: "var(--glass-border)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <Link href={`/teams/${team.id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-on-card)" }}>
                        {team.name}
                      </h3>
                      <span
                        className="rounded-[9999px] px-2 py-0.5 font-nunito text-[10px] font-bold"
                        style={{
                          background: team.confirmed_slot
                            ? "rgba(128,222,234,0.18)"
                            : "rgba(251,191,36,0.15)",
                          color: team.confirmed_slot ? "var(--teal-text)" : "var(--gold-text)",
                        }}
                      >
                        {team.confirmed_slot ? "확정" : "미확정"}
                      </span>
                    </div>
                    <p className="mt-2 font-poppins text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                      멤버 {team.member_count}명
                    </p>
                  </Link>

                  {team.created_by === userId && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteTeam(team)}
                      disabled={deletingTeamId === team.id}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-[9999px] border px-3 py-1.5 font-nunito text-[11px] font-bold disabled:opacity-70"
                      style={{
                        background: "rgba(251,113,133,0.12)",
                        borderColor: "rgba(251,113,133,0.35)",
                        color: "var(--coral-text)",
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {deletingTeamId === team.id ? "삭제 중..." : "팀 삭제"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const active = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setRequestedPage(page)}
                    className="rounded-[9999px] border px-3 py-1.5 font-nunito text-xs font-bold"
                    style={{
                      background: active ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--glass)",
                      borderColor: "var(--glass-border)",
                      color: active ? "white" : "var(--text-primary)",
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 팀 만들기 모달 */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setCreateOpen(false)}
            aria-label="닫기"
            style={{ background: "rgba(0,0,0,0.25)" }}
          />
          <div
            className="relative w-full max-w-[400px] rounded-[24px] border p-6"
            style={{
              background: "var(--glass-strong)",
              borderColor: "var(--glass-border)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "var(--shadow-card-hover)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="팀 만들기"
          >
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="absolute right-3 top-3 rounded-[10px] p-2 hover:bg-[var(--glass)]"
              aria-label="닫기"
            >
              <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
            </button>
            <h2 className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
              팀 만들기
            </h2>
            <label className="mt-4 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              팀 이름
            </label>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="예: 1조 프로젝트"
              className="mt-1.5 w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
            <label className="mt-4 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              이 팀에서 보일 이름
            </label>
            <input
              value={createMemberDisplayName}
              onChange={(e) => setCreateMemberDisplayName(e.target.value)}
              placeholder="채팅·일정에 표시 (프로필 닉네임으로 채워짐)"
              maxLength={TEAM_DISPLAY_MAX}
              className="mt-1.5 w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
            <p className="mt-2 font-poppins text-[10.5px] font-medium" style={{ color: "var(--text-muted)" }}>
              생성 시 6자리 초대 코드가 자동 발급됩니다.
            </p>
            {error && (
              <p className="mt-2 font-poppins text-xs font-medium" style={{ color: "var(--coral-text)" }} role="alert">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-[9999px] border px-4 py-2 font-nunito text-xs font-bold"
                style={{ background: "var(--glass)", borderColor: "var(--glass-border)", color: "var(--text-primary)" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={createSaving}
                className="rounded-[9999px] px-4 py-2 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
              >
                {createSaving ? "생성 중..." : "생성"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
