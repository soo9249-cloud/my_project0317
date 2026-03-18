// 변경 이유: Tailwind CSS v3 + CSS 변수 기반 테마를 프로젝트 전역에서 사용하기 위해 설정 파일을 추가합니다.
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ["var(--font-nunito)", "Nunito", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
        sans: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
      },
      colors: {
        glass: "var(--glass)",
        "glass-strong": "var(--glass-strong)",
        "glass-subtle": "var(--glass-subtle)",
        "glass-border": "var(--glass-border)",
        "glass-border-subtle": "var(--glass-border-subtle)",
        primary: "var(--primary)",
        "primary-dark": "var(--primary-dark)",
        "primary-light": "var(--primary-light)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-on-card": "var(--text-on-card)",
        coral: "var(--coral)",
        teal: "var(--teal)",
        gold: "var(--gold)",
      },
      backgroundImage: {
        "bg-gradient": "var(--bg-gradient)",
      },
    },
  },
  plugins: [],
} satisfies Config;

