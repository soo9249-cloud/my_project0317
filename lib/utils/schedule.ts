// 변경 이유: 일정/스케줄 관련 유틸을 한 곳에서 관리하기 위해 빈 파일 대신 기본 export를 둡니다.
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
