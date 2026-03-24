// 변경 이유: 완료율 90% 달성 시 glassmorphism 보상 모달을 표시합니다.
"use client";

import { Trophy, X } from "lucide-react";

type Props = {
  open: boolean;
  rewardText: string | null;
  onClose: () => void;
};

export default function RewardModal({ open, rewardText, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
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
        aria-label="보상"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-[10px] p-2 transition-colors hover:bg-[var(--glass)]"
          aria-label="닫기"
        >
          <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
        </button>

        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[12px]"
            style={{ background: "var(--primary-soft)" }}
          >
            <Trophy className="h-5 w-5" style={{ color: "var(--primary)" }} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2
              className="font-nunito text-[18px] font-extrabold"
              style={{ color: "var(--text-primary)" }}
            >
              오늘 목표 달성
            </h2>
            <p className="mt-1 font-nunito text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
              {rewardText?.trim()
                ? `보상: ${rewardText}`
                : "보상 문구가 없어요. 그래도 오늘은 정말 잘했어요."}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[9999px] px-5 py-2 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] transition-[transform,box-shadow] hover:translate-y-[-1px]"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

