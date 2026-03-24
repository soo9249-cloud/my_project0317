// 변경 이유: 0317_design.json statCard — glass 카드 + 아이콘 래퍼 + value/label + 하단 accent line
import type { LucideIcon } from "lucide-react";

type Accent = "pink" | "coral" | "periwinkle" | "teal";

const ACCENT_STYLES: Record<
  Accent,
  { iconBg: string; lineColor: string }
> = {
  pink: {
    iconBg: "rgba(224,64,251,0.15)",
    lineColor: "var(--primary)",
  },
  coral: {
    iconBg: "rgba(244,166,160,0.20)",
    lineColor: "var(--coral)",
  },
  periwinkle: {
    iconBg: "rgba(168,180,240,0.20)",
    lineColor: "#a8b4f0",
  },
  teal: {
    iconBg: "rgba(128,222,234,0.20)",
    lineColor: "var(--teal)",
  },
};

type Props = {
  icon: LucideIcon;
  accent: Accent;
  value: string | number;
  label: string;
};

export default function StatCard({ icon: Icon, accent, value, label }: Props) {
  const { iconBg, lineColor } = ACCENT_STYLES[accent];

  return (
    <div
      className="relative overflow-hidden rounded-[20px] border p-4"
      style={{
        background: "var(--glass)",
        borderColor: "var(--glass-border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="mb-3 flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
        style={{ background: iconBg }}
      >
        <Icon className="h-4 w-4" style={{ color: lineColor }} aria-hidden />
      </div>
      <p
        className="font-nunito text-[28px] font-extrabold leading-none"
        style={{
          color: "var(--text-primary)",
          letterSpacing: "-1px",
        }}
      >
        {value}
      </p>
      <p
        className="mt-1 font-nunito text-[11px] font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-[20px]"
        style={{ background: lineColor }}
      />
    </div>
  );
}
