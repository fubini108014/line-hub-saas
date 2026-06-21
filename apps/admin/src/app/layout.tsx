import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LINE Hub — 商家管理後台',
  description: 'LINE OA 模組化商務助手',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
