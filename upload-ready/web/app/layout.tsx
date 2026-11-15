export const metadata = { title: '洞见 · Agent', description: '单接口 Agent 后端' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 24, background: '#04080D', color: '#E6F4FA' }}>
        {children}
      </body>
    </html>
  );
}
