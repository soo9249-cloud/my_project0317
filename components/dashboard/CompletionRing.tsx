// 변경 이유: 0317_design.json completionRing — SVG stroke-dashoffset, 그라디언트, 중앙 퍼센트
type Props = {
  value: number; // 0–100
  label?: string;
};

const SIZE = 72;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function CompletionRing({ value, label = "완료율" }: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[72px] w-[72px]">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--glass-border)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--primary-dark)" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-nunito text-[14px] font-extrabold leading-none sm:text-[15px]"
          style={{ color: "var(--text-primary)" }}
        >
          {clamped}%
        </span>
      </div>
      <span
        className="mt-2 font-nunito text-[9px] font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}
