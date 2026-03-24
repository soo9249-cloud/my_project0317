"use client";

// 변경 이유: 팀 실시간 채팅 — Supabase Realtime 구독, 작성자/시간 표시, 내 메시지 우측·primary, 상대방 좌측·glass-strong, 팀 채팅 제목+팀 이름
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types";

type Props = {
  teamId: string;
  userId: string;
  teamName: string;
  initialMessages: Message[];
  currentUserEmail?: string | null;
  memberDisplays?: Record<string, { nickname: string | null; email: string | null }>;
};

/** 팀원 모두 동일 규칙: team_members·profiles에서 합친 닉네임 → 프로필 이메일 앞부분 → (본인만) 로그인 이메일 앞부분 */
function getDisplayName(
  uid: string,
  currentUserId: string,
  currentUserEmail: string | null | undefined,
  memberDisplays: Record<string, { nickname: string | null; email: string | null }>
): string {
  const d = memberDisplays[uid];
  if (d?.nickname?.trim()) return d.nickname.trim();
  if (d?.email) {
    const prefix = d.email.split("@")[0];
    if (prefix) return prefix;
  }
  if (uid === currentUserId && currentUserEmail) {
    const prefix = currentUserEmail.split("@")[0];
    return prefix || "내 계정";
  }
  return uid === currentUserId ? "내 계정" : "멤버";
}

function formatMessageTime(createdAt: string): string {
  const d = new Date(createdAt);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) + " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function TeamChat({
  teamId,
  userId,
  teamName,
  initialMessages,
  currentUserEmail,
  memberDisplays = {},
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${teamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `team_id=eq.${teamId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, teamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = content.trim();
    if (!text || sending) return;
    setSending(true);
    await supabase.from("messages").insert({ team_id: teamId, user_id: userId, content: text });
    setContent("");
    setSending(false);
  }

  return (
    <div
      className="flex h-[360px] flex-col rounded-[20px] border overflow-hidden"
      style={{
        background: "var(--glass)",
        borderColor: "var(--glass-border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="flex flex-col gap-0.5 border-b px-4 py-3"
        style={{ borderColor: "var(--glass-border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden />
          <h3 className="font-nunito text-[13.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>
            팀 채팅
          </h3>
        </div>
        <p className="font-poppins text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
          {teamName}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="font-poppins text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            아직 메시지가 없어요.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => {
              const isMe = m.user_id === userId;
              return (
                <li
                  key={m.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="flex max-w-[85%] flex-col rounded-[12px] px-3 py-2"
                    style={{
                      background: isMe
                        ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                        : "var(--glass-strong)",
                      border: isMe ? "none" : "1px solid var(--glass-border)",
                    }}
                  >
                    <p
                      className="font-nunito text-[11px] font-bold"
                      style={{ color: isMe ? "rgba(255,255,255,0.9)" : "var(--primary)" }}
                    >
                      {getDisplayName(m.user_id, userId, currentUserEmail, memberDisplays)}
                    </p>
                    <p
                      className="mt-0.5 font-poppins text-[12px] font-medium leading-snug"
                      style={{ color: isMe ? "white" : "var(--text-on-card)" }}
                    >
                      {m.content}
                    </p>
                    <p
                      className="mt-1 font-poppins text-[10.5px] font-medium"
                      style={{ color: isMe ? "rgba(255,255,255,0.75)" : "var(--text-muted)" }}
                    >
                      {formatMessageTime(m.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-2" style={{ borderColor: "var(--glass-border-subtle)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex gap-2"
        >
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="메시지 입력..."
            className="flex-1 rounded-[12px] border px-3 py-2 font-poppins text-[12px] outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)]"
            style={{
              background: "var(--glass-strong)",
              borderColor: "var(--glass-border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] text-white shadow-[var(--shadow-btn)] transition-opacity disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
            aria-label="전송"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}
