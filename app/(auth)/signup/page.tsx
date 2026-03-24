"use client";

// 변경 이유: 0317_design.json 기준 로그인과 동일한 디자인 톤 + 닉네임·Supabase Auth 회원가입, 세션 있을 때 profiles upsert
import { useState } from "react";
import Link from "next/link";
import { Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    const nick = nickname.trim();
    if (nick.length < NICKNAME_MIN) {
      setError(`닉네임은 ${NICKNAME_MIN}자 이상 입력해 주세요.`);
      return;
    }
    if (nick.length > NICKNAME_MAX) {
      setError(`닉네임은 ${NICKNAME_MAX}자 이하로 입력해 주세요.`);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data: signData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/dashboard`,
        data: { nickname: nick },
      },
    });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }
    // 이메일 인증을 끈 경우 세션이 있으면 즉시 profiles 반영
    if (signData.user && signData.session) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: signData.user.id,
          nickname: nick,
          email: signData.user.email ?? email,
        },
        { onConflict: "id" }
      );
      if (profileError) {
        setLoading(false);
        setError(`가입은 되었으나 프로필 저장에 실패했습니다: ${profileError.message}`);
        return;
      }
    }
    setLoading(false);
    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div
          className="w-full max-w-[400px] rounded-[20px] border p-8 shadow-[var(--shadow-card)]"
          style={{
            background: "var(--glass)",
            borderColor: "var(--glass-border)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div className="mb-6 flex flex-col items-center gap-4">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[12px]"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                boxShadow: "0 4px 14px var(--primary-glow)",
              }}
            >
              <Brain className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
            </div>
            <h1
              className="font-nunito text-[14.5px] font-extrabold tracking-tight"
              style={{ color: "var(--text-on-card)", letterSpacing: "-0.3px" }}
            >
              정신줄 구조대
            </h1>
          </div>
          <p
            className="mb-6 text-center font-poppins text-xs font-medium leading-relaxed"
            style={{ color: "var(--text-on-card)" }}
          >
            회원가입 요청이 완료되었습니다. <strong style={{ color: "var(--primary)" }}>{email}</strong> 로
            인증 메일을 보냈습니다. 메일의 링크를 클릭한 뒤 로그인해 주세요.
            <span className="mt-2 block text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              이메일 인증을 켜 두면 가입 직후 세션이 없을 수 있어, 닉네임은 DB에서 자동 생성 트리거로 넣거나 로그인
              후 프로필을 완성하는 흐름을 추가하면 됩니다.
            </span>
          </p>
          <Link
            href="/login"
            className="block w-full rounded-[9999px] px-6 py-2.5 text-center font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] transition-[transform,box-shadow] hover:translate-y-[-1px]"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            }}
          >
            로그인으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
      <div
        className="w-full max-w-[400px] rounded-[20px] border p-8 shadow-[var(--shadow-card)]"
        style={{
          background: "var(--glass)",
          borderColor: "var(--glass-border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="mb-8 flex flex-col items-center gap-4">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[12px]"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              boxShadow: "0 4px 14px var(--primary-glow)",
            }}
          >
            <Brain className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
          </div>
          <h1
            className="font-nunito text-[14.5px] font-extrabold tracking-tight"
            style={{ color: "var(--text-on-card)", letterSpacing: "-0.3px" }}
          >
            정신줄 구조대
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="signup-email"
              className="mb-1.5 block font-poppins text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              이메일
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              autoComplete="email"
              className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label
              htmlFor="signup-nickname"
              className="mb-1.5 block font-poppins text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              닉네임
            </label>
            <input
              id="signup-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={`${NICKNAME_MIN}~${NICKNAME_MAX}자, 채팅 등에 표시`}
              required
              minLength={NICKNAME_MIN}
              maxLength={NICKNAME_MAX}
              autoComplete="nickname"
              className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label
              htmlFor="signup-password"
              className="mb-1.5 block font-poppins text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              비밀번호
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label
              htmlFor="signup-password-confirm"
              className="mb-1.5 block font-poppins text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              비밀번호 확인
            </label>
            <input
              id="signup-password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 다시 입력"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-[12px] border px-3.5 py-2.5 font-poppins text-[13px] outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {error && (
            <p
              className="font-poppins text-xs font-medium"
              style={{ color: "var(--coral-text)" }}
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-[9999px] px-6 py-2.5 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] transition-[transform,box-shadow] hover:translate-y-[-1px] disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            }}
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p
          className="mt-6 text-center font-poppins text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-semibold underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            style={{ color: "var(--primary)" }}
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
