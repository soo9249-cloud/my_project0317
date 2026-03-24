"use client";

// 변경 이유: 예전에 가입한 유저(profiles.nickname 비어 있음)가 로그인 후 닉네임을 채우면 팀 채팅 등에 반영되도록 함
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;

type Props = {
  userId: string;
  userEmail: string | null;
  /** 서버에서 profiles.nickname 비어 있으면 true */
  show: boolean;
};

export default function NicknameReminderBar({ userId, userEmail, show }: Props) {
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show || dismissed) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = nickname.trim();
    if (n.length < NICKNAME_MIN) {
      setError(`닉네임은 ${NICKNAME_MIN}자 이상 입력해 주세요.`);
      return;
    }
    if (n.length > NICKNAME_MAX) {
      setError(`닉네임은 ${NICKNAME_MAX}자 이하로 입력해 주세요.`);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        nickname: n,
        email: userEmail ?? undefined,
      },
      { onConflict: "id" }
    );
    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setDismissed(true);
  }

  return (
    <div
      className="shrink-0 rounded-[16px] border p-4"
      style={{
        background: "var(--primary-soft)",
        borderColor: "var(--glass-border)",
        boxShadow: "var(--shadow-card)",
      }}
      role="region"
      aria-label="닉네임 설정 안내"
    >
      <p className="font-nunito text-[13px] font-extrabold" style={{ color: "var(--text-primary)" }}>
        표시 이름(닉네임)을 정해 주세요
      </p>
      <p className="mt-1 font-poppins text-[11px] font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
        예전에 가입하신 계정은 프로필 닉네임이 비어 있을 수 있어요. 아래에 입력하면 팀 채팅 등에 이 이름이 우선
        표시됩니다.
      </p>
      <form onSubmit={(e) => void handleSave(e)} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="nickname-reminder" className="sr-only">
            닉네임
          </label>
          <input
            id="nickname-reminder"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={`${NICKNAME_MIN}~${NICKNAME_MAX}자`}
            maxLength={NICKNAME_MAX}
            className="w-full rounded-[12px] border px-3 py-2 font-poppins text-[13px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
            style={{
              background: "var(--glass-strong)",
              borderColor: "var(--glass-border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-[9999px] border px-4 py-2 font-nunito text-xs font-bold"
            style={{
              background: "var(--glass)",
              borderColor: "var(--glass-border)",
              color: "var(--text-primary)",
            }}
          >
            나중에
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[9999px] px-4 py-2 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
      {error && (
        <p className="mt-2 font-poppins text-[11px] font-medium" style={{ color: "var(--coral-text)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
