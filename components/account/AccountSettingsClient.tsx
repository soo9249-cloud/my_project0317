"use client";

// 변경 이유: 내 계정 페이지 — 이메일 표시, 닉네임(profiles) 저장, 로그인 세션 기준 비밀번호 변경
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;
const PASSWORD_MIN = 6;

type Props = {
  userId: string;
  email: string;
  initialNickname: string;
};

export default function AccountSettingsClient({ userId, email, initialNickname }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    const n = nickname.trim();
    if (n.length < NICKNAME_MIN) {
      setProfileError(`닉네임은 ${NICKNAME_MIN}자 이상 입력해 주세요.`);
      return;
    }
    if (n.length > NICKNAME_MAX) {
      setProfileError(`닉네임은 ${NICKNAME_MAX}자 이하로 입력해 주세요.`);
      return;
    }
    setProfileSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        nickname: n,
        email: email || undefined,
      },
      { onConflict: "id" }
    );
    setProfileSaving(false);
    if (error) {
      setProfileError(error.message);
      return;
    }
    setProfileMessage("저장했습니다.");
    router.refresh();
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);
    if (!newPassword || !newPasswordConfirm) {
      setPasswordError("새 비밀번호와 확인을 모두 입력해 주세요.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < PASSWORD_MIN) {
      setPasswordError(`비밀번호는 ${PASSWORD_MIN}자 이상이어야 합니다.`);
      return;
    }
    setPasswordSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setNewPassword("");
    setNewPasswordConfirm("");
    setPasswordMessage("비밀번호를 변경했습니다.");
  }

  const cardClass =
    "rounded-[20px] border p-5 md:p-6";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            boxShadow: "0 4px 14px var(--primary-glow)",
          }}
        >
          <UserCircle className="h-6 w-6 text-white" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h1 className="font-nunito text-[16px] font-extrabold" style={{ color: "var(--text-primary)" }}>
            내 계정
          </h1>
          <p className="mt-0.5 font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            로그인 정보와 표시 이름을 관리합니다.
          </p>
        </div>
      </div>

      <section
        className={cardClass}
        style={{
          background: "var(--glass)",
          borderColor: "var(--glass-border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-card)",
        }}
        aria-labelledby="account-profile-heading"
      >
        <h2 id="account-profile-heading" className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
          프로필
        </h2>
        <p className="mt-1 font-poppins text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
          팀 채팅 등에 보이는 이름은 닉네임이 우선입니다.
        </p>
        <form onSubmit={(e) => void handleProfileSave(e)} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              이메일
            </label>
            <p
              className="rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] font-medium"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-muted)",
              }}
            >
              {email || "—"}
            </p>
            <p className="mt-1 font-poppins text-[10.5px] font-medium" style={{ color: "var(--text-muted)" }}>
              이메일 변경은 Supabase 대시보드·지원 정책에 맞춰 별도로 진행해야 합니다.
            </p>
          </div>
          <div>
            <label htmlFor="account-nickname" className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              닉네임
            </label>
            <input
              id="account-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={NICKNAME_MAX}
              className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          {profileError && (
            <p className="font-poppins text-xs font-medium" style={{ color: "var(--coral-text)" }} role="alert">
              {profileError}
            </p>
          )}
          {profileMessage && (
            <p className="font-poppins text-xs font-medium" style={{ color: "var(--teal-text)" }} role="status">
              {profileMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={profileSaving}
            className="self-start rounded-[9999px] px-5 py-2.5 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
          >
            {profileSaving ? "저장 중..." : "프로필 저장"}
          </button>
        </form>
      </section>

      <section
        className={cardClass}
        style={{
          background: "var(--glass)",
          borderColor: "var(--glass-border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-card)",
        }}
        aria-labelledby="account-password-heading"
      >
        <h2 id="account-password-heading" className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
          비밀번호 변경
        </h2>
        <p className="mt-1 font-poppins text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
          현재 로그인된 계정의 비밀번호를 바꿉니다.
        </p>
        <form onSubmit={(e) => void handlePasswordSubmit(e)} className="mt-4 flex flex-col gap-3">
          <div>
            <label htmlFor="account-new-pw" className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              새 비밀번호
            </label>
            <input
              id="account-new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
              className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label htmlFor="account-new-pw2" className="mb-1.5 block font-poppins text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              새 비밀번호 확인
            </label>
            <input
              id="account-new-pw2"
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
              className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          {passwordError && (
            <p className="font-poppins text-xs font-medium" style={{ color: "var(--coral-text)" }} role="alert">
              {passwordError}
            </p>
          )}
          {passwordMessage && (
            <p className="font-poppins text-xs font-medium" style={{ color: "var(--teal-text)" }} role="status">
              {passwordMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordSaving}
            className="self-start rounded-[9999px] border px-5 py-2.5 font-nunito text-xs font-bold disabled:opacity-70"
            style={{
              background: "var(--glass-strong)",
              borderColor: "var(--glass-border)",
              color: "var(--text-primary)",
            }}
          >
            {passwordSaving ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </section>
    </div>
  );
}
