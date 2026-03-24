"use client";

// 변경 이유: 0317_design.json 기준 글래스모피즘 카드 + Supabase Auth 로그인 폼 구현
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setError(signInError.message);
      }
      return;
    }
    router.push("/dashboard");
    router.refresh();
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
              htmlFor="login-email"
              className="mb-1.5 block font-poppins text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              이메일
            </label>
            <input
              id="login-email"
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
              htmlFor="login-password"
              className="mb-1.5 block font-poppins text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              required
              autoComplete="current-password"
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
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p
          className="mt-6 text-center font-poppins text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="font-semibold underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            style={{ color: "var(--primary)" }}
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
