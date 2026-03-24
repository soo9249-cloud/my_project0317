"use client";

// 변경 이유: 0317_design.json rewardBanner — 오늘 완료율 90% 기준 문구 + PartyPopper, 보상 받기 버튼
import { useEffect, useMemo, useState } from "react";
import { PartyPopper, Gift, X } from "lucide-react";

type Props = {
  completedToday: number;
  totalToday: number;
  userId: string;
  onClaim?: () => void;
};

const DAILY_REWARD_GOAL_STORAGE_KEY = "todo_daily_reward_goal_v1";

type DailyRewardGoalStored = {
  userId: string;
  day: string;
  text: string;
};

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
    return rec.text.trim();
  } catch {
    return "";
  }
}

export default function RewardBanner({ completedToday, totalToday, userId, onClaim }: Props) {
  const [claimed, setClaimed] = useState(false);
  const [dailyRewardGoal, setDailyRewardGoal] = useState("");
  const [openClaimModal, setOpenClaimModal] = useState(false);
  const rate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 100;
  const reached = rate >= 90;
  const remaining = totalToday - completedToday;
  const rewardMessage = useMemo(
    () => (dailyRewardGoal ? `오늘의 보상: ${dailyRewardGoal}` : "오늘의 보상을 아직 입력하지 않았어요."),
    [dailyRewardGoal]
  );

  useEffect(() => {
    setDailyRewardGoal(loadDailyRewardGoal(userId));
  }, [userId]);

  function handleClaim() {
    if (onClaim) onClaim();
    setClaimed(true);
    setOpenClaimModal(true);
  }

  return (
    <div
      className="relative flex items-center gap-4 overflow-hidden rounded-[20px] px-5 py-4"
      style={{
        background: "var(--banner-bg)",
        boxShadow: "var(--banner-shadow)",
      }}
    >
      <div
        className="absolute right-0 top-0 h-24 w-24 rounded-full opacity-[0.07]"
        style={{ background: "white", transform: "translate(30%, -30%)" }}
      />
      <div
        className="absolute bottom-0 right-12 h-20 w-20 rounded-full opacity-[0.06]"
        style={{ background: "white", transform: "translate(20%, 20%)" }}
      />
      <div className="relative flex h-[22px] w-[22px] shrink-0 items-center justify-center text-white">
        <PartyPopper className="h-[22px] w-[22px]" aria-hidden />
      </div>
      <div className="relative flex-1">
        <p
          className="font-nunito text-[13.5px] font-extrabold text-white"
          style={{ letterSpacing: "-0.3px" }}
        >
          {reached
            ? "오늘 목표 달성! 보상을 받아요"
            : `90% 달성까지 ${remaining}개 남았어요!`}
        </p>
        <p
          className="mt-0.5 font-nunito text-[11.5px] font-medium"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          {reached
            ? "오늘 할 일을 잘 마쳤어요. 보상으로 힘을 채워요."
            : "할 일을 완료하면 보상을 받을 수 있어요."}
        </p>
        <p className="mt-1 font-nunito text-[11px] font-semibold text-white/90">{rewardMessage}</p>
        {reached && claimed && (
          <p className="mt-1 font-nunito text-[11px] font-bold text-white/90">
            보상 수령 완료! 오늘도 화이팅!
          </p>
        )}
      </div>
      {reached && (
        <button
          type="button"
          onClick={handleClaim}
          className="relative flex shrink-0 items-center gap-2 rounded-[9999px] border border-white/40 bg-white/20 px-4 py-1.5 font-nunito text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          <Gift className="h-3 w-3" aria-hidden />
          {claimed ? "수령 완료" : "보상 받기"}
        </button>
      )}

      {openClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setOpenClaimModal(false)}
            aria-label="모달 닫기"
            style={{ background: "rgba(0,0,0,0.25)" }}
          />
          <div
            className="relative w-full max-w-[420px] rounded-[24px] border p-6"
            style={{
              background: "var(--glass-strong)",
              borderColor: "var(--glass-border)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "var(--shadow-card-hover)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="보상 수령"
          >
            <button
              type="button"
              onClick={() => setOpenClaimModal(false)}
              className="absolute right-3 top-3 rounded-[10px] p-2 transition-colors hover:bg-[var(--glass)]"
              aria-label="닫기"
            >
              <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
            </button>
            <h3 className="font-nunito text-[18px] font-extrabold" style={{ color: "var(--text-primary)" }}>
              보상 수령 완료
            </h3>
            <p className="mt-2 font-poppins text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
              {dailyRewardGoal ? `오늘의 보상은 "${dailyRewardGoal}" 입니다.` : "오늘의 보상 문구가 아직 없어요."}
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenClaimModal(false)}
                className="rounded-[9999px] px-5 py-2 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)]"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
