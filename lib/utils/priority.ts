// 변경 이유: 할 일 중요도 관련 유틸을 한 곳에서 관리하기 위해 빈 파일 대신 기본 export를 둡니다.
import type { TodoImportance } from "@/types";

export function getPriorityLabel(importance: TodoImportance): string {
  const labels: Record<TodoImportance, string> = {
    1: "낮음",
    2: "중간",
    3: "높음",
  };
  return labels[importance];
}
