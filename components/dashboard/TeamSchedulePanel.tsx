// 변경 이유: 대시보드 우측 패널 — 확정된 팀 회의 목록을 실제 데이터로 표시
import { CalendarDays } from "lucide-react";

type TeamMeeting = {
  teamId: string;
  teamName: string;
  date: string;
  start: string;
  end: string;
};

type Props = {
  meetings: TeamMeeting[];
};

function formatDateLabel(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" });
}

export default function TeamSchedulePanel({ meetings }: Props) {
  return (
    <div className="rounded-[12px] border p-3" style={{ borderColor: "var(--glass-border-subtle)" }}>
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
        <h3
          className="font-nunito text-[12.5px] font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          팀플 일정
        </h3>
      </div>
      {meetings.length === 0 ? (
        <p className="mt-3 font-poppins text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
          예정된 팀 회의가 없어요.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {meetings.slice(0, 5).map((meeting) => (
            <li
              key={`${meeting.teamId}-${meeting.date}-${meeting.start}`}
              className="rounded-[10px] border px-2.5 py-2"
              style={{ borderColor: "var(--glass-border-subtle)", background: "var(--glass-subtle)" }}
            >
              <p className="font-nunito text-[11.5px] font-extrabold" style={{ color: "var(--text-on-card)" }}>
                {meeting.teamName}
              </p>
              <p className="mt-0.5 font-poppins text-[10.5px] font-medium" style={{ color: "var(--text-muted)" }}>
                {formatDateLabel(meeting.date)} {meeting.start}~{meeting.end}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
