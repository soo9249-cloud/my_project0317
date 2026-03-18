// 변경 이유: 요청된 Google Fonts(Nunito/Poppins)와 ambient orb 배경을 루트 레이아웃에 적용합니다.
import type { Metadata } from "next";
import { Nunito, Poppins } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "정신줄 구조대",
  description: "정신줄 구조대 - 할 일과 팀 일정 조율을 돕는 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="light">
      <body className={`${nunito.variable} ${poppins.variable} antialiased`}>
        <div className="ambient-orb ambient-orb--1" />
        <div className="ambient-orb ambient-orb--2" />
        <div className="ambient-orb ambient-orb--3" />
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
