// 변경 이유: 루트 페이지를 요구사항대로 `/dashboard`로 즉시 리다이렉트합니다.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
