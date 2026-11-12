import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '晏晓翔 · 1 person + AI = 1 team',
  description:
    '晏晓翔，常州大学计算机硕士，用 AI 与 Agent 把数据、模型与工程做成能用的系统。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Fira+Code:wght@400;500;700&family=Fraunces:ital,wght@0,400;0,900;1,400;1,900&family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
