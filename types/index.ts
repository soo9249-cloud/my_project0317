// 변경 이유: Supabase MCP로 확인한 테이블 구조에 맞춰 앱 전역에서 사용할 타입을 정의합니다.

/** 중요도 1=낮음, 2=중간, 3=높음 */
export type TodoImportance = 1 | 2 | 3;

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  due_at: string | null;
  due_date: string | null;
  importance: TodoImportance;
  is_done: boolean;
  reward: string | null;
  sort_order: number;
  created_at: string;
}

/** 회의 확정 시 저장되는 슬롯 (teams.confirmed_slot) */
export interface ConfirmedSlot {
  date: string;
  start: string;
  end: string;
}

export interface Team {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
  confirmed_slot?: ConfirmedSlot | null;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  nickname: string | null;
  joined_at: string;
}

export interface AvailabilitySlot {
  date: string;
  start: string;
  end: string;
}

export interface Availability {
  id: string;
  team_id: string;
  user_id: string;
  available_slots: AvailabilitySlot[];
  updated_at: string;
}

export interface Message {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
