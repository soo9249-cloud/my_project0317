"use client";

// 변경 이유: 가능 시간 슬롯 추가/삭제 후 availability 테이블 upsert
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AvailabilitySlot } from "@/types";
import { TIME_OPTIONS_30 } from "@/lib/utils/schedule";

type Props = {
  teamId: string;
  userId: string;
  initialSlots: AvailabilitySlot[];
  onSaved: () => void;
};

export default function AvailabilityForm({ teamId, userId, initialSlots, onSaved }: Props) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(
    initialSlots.length > 0 ? initialSlots : [{ date: "", start: "09:00", end: "10:00" }]
  );
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  function addSlot() {
    setSlots((prev) => [...prev, { date: "", start: "09:00", end: "10:00" }]);
  }

  function removeSlot(i: number) {
    setSlots((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSlot(i: number, field: keyof AvailabilitySlot, value: string) {
    setSlots((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  async function handleSave() {
    const valid = slots.filter((s) => s.date && s.start && s.end && s.start < s.end);
    setSaving(true);
    const { data: existing } = await supabase
      .from("availability")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle();

    const payload = { team_id: teamId, user_id: userId, available_slots: valid };
    if (existing) {
      await supabase.from("availability").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("availability").insert(payload);
    }
    setSaving(false);
    onSaved();
  }

  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-3">
      {slots.map((slot, i) => (
        <div
          key={i}
          className="flex flex-wrap items-end gap-2 rounded-[12px] border p-3"
          style={{ borderColor: "var(--glass-border-subtle)", background: "var(--glass-subtle)" }}
        >
          <div>
            <label className="mb-1 block font-poppins text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
              날짜
            </label>
            <input
              type="date"
              value={slot.date}
              onChange={(e) => updateSlot(i, "date", e.target.value)}
              min={todayISO}
              className="rounded-[12px] border px-2.5 py-2 font-poppins text-[12px] outline-none focus:border-[var(--primary)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label className="mb-1 block font-poppins text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
              시작
            </label>
            <select
              value={slot.start}
              onChange={(e) => updateSlot(i, "start", e.target.value)}
              className="rounded-[12px] border px-2.5 py-2 font-poppins text-[12px] outline-none focus:border-[var(--primary)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            >
              {TIME_OPTIONS_30.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-poppins text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
              종료
            </label>
            <select
              value={slot.end}
              onChange={(e) => updateSlot(i, "end", e.target.value)}
              className="rounded-[12px] border px-2.5 py-2 font-poppins text-[12px] outline-none focus:border-[var(--primary)]"
              style={{
                background: "var(--glass-strong)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            >
              {TIME_OPTIONS_30.filter((t) => t > slot.start).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="24:00">24:00</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => removeSlot(i)}
            className="rounded-[10px] p-2 hover:bg-[var(--glass)]"
            aria-label="시간대 삭제"
          >
            <Trash2 className="h-4 w-4" style={{ color: "var(--text-muted)" }} aria-hidden />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addSlot}
        className="flex items-center justify-center gap-2 rounded-[12px] border border-dashed px-3 py-2 font-poppins text-xs font-medium transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"
        style={{ borderColor: "var(--glass-border)", color: "var(--text-muted)" }}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        시간대 추가
      </button>
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="rounded-[9999px] px-4 py-2 font-nunito text-xs font-bold text-white shadow-[var(--shadow-btn)] disabled:opacity-70"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
