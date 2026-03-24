// 변경 이유: 일정 조율 — 팀원 가능 시간 교집합 계산, 가장 긴 연속 구간 상위 N개 추천
import type { AvailabilitySlot } from "@/types";

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "HH:mm"을 분 단위로 */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 두 슬롯이 같은 날이고 겹치는 구간 반환 (날짜+시작+끝). 없으면 null */
function overlap(
  a: { date: string; start: string; end: string },
  b: { date: string; start: string; end: string }
): { date: string; start: string; end: string } | null {
  if (a.date !== b.date) return null;
  const aS = toMinutes(a.start);
  const aE = toMinutes(a.end);
  const bS = toMinutes(b.start);
  const bE = toMinutes(b.end);
  const start = Math.max(aS, bS);
  const end = Math.min(aE, bE);
  if (start >= end) return null;
  return { date: a.date, start: toHHMM(start), end: toHHMM(end) };
}

/** 두 슬롯 배열의 교집합(겹치는 구간들) */
function intersectTwo(
  slotsA: AvailabilitySlot[],
  slotsB: AvailabilitySlot[]
): AvailabilitySlot[] {
  const result: AvailabilitySlot[] = [];
  for (const a of slotsA) {
    for (const b of slotsB) {
      const o = overlap(a, b);
      if (o) result.push(o);
    }
  }
  return result;
}

/** 같은 날짜 내 겹치는 구간 병합 */
function mergeSameDay(slots: AvailabilitySlot[]): AvailabilitySlot[] {
  const byDate = new Map<string, Array<{ s: number; e: number }>>();
  for (const { date, start, end } of slots) {
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push({ s, e });
  }
  const merged: AvailabilitySlot[] = [];
  byDate.forEach((ranges, date) => {
    ranges.sort((x, y) => x.s - y.s);
    let [curS, curE] = [ranges[0].s, ranges[0].e];
    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i].s <= curE) {
        curE = Math.max(curE, ranges[i].e);
      } else {
        merged.push({ date, start: toHHMM(curS), end: toHHMM(curE) });
        curS = ranges[i].s;
        curE = ranges[i].e;
      }
    }
    merged.push({ date, start: toHHMM(curS), end: toHHMM(curE) });
  });
  return merged;
}

/**
 * 모든 팀원의 available_slots 교집합(모두가 겹치는 시간대) 계산 후,
 * 가장 긴 연속 구간 상위 limit개 반환
 */
export function getTopOverlapSlots(
  allMembersSlots: AvailabilitySlot[][],
  limit: number = 3
): Array<{ date: string; start: string; end: string; durationMinutes: number }> {
  if (allMembersSlots.length === 0) return [];
  let acc: AvailabilitySlot[] = allMembersSlots[0];
  for (let i = 1; i < allMembersSlots.length; i++) {
    acc = intersectTwo(acc, allMembersSlots[i]);
  }
  const merged = mergeSameDay(acc);
  const withDuration = merged.map((s) => ({
    ...s,
    durationMinutes: toMinutes(s.end) - toMinutes(s.start),
  }));
  withDuration.sort((a, b) => b.durationMinutes - a.durationMinutes);
  return withDuration.slice(0, limit);
}

/**
 * 회의 시간 확정 후 공유 문구 생성
 * 예: "이번 팀플 회의는 수요일 오후 3시로 확정되었습니다."
 */
export function formatConfirmedMessage(slot: {
  date: string;
  start: string;
  end: string;
}): string {
  const d = new Date(slot.date + "T" + slot.start);
  const weekday = d.toLocaleDateString("ko-KR", { weekday: "long" });
  const timeStr = d.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `이번 팀플 회의는 ${weekday} ${timeStr}로 확정되었습니다.`;
}

/** 30분 단위 옵션 00:00 ~ 23:30 */
export const TIME_OPTIONS_30: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m === 30) break;
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();
