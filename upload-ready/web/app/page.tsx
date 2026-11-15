export default function Home() {
  return (
    <main style={{ maxWidth: 680, margin: '40px auto', lineHeight: 1.9 }}>
      <h1 style={{ fontSize: 22 }}>洞见 · Agent 后端</h1>
      <p>只有一个接口：<code>POST /api/agent</code></p>
      <pre style={{ background: 'rgba(255,255,255,.06)', padding: 14, borderRadius: 10, overflow: 'auto' }}>{`{
  "question": "求 lim(x→0) sinx/x",
  "work": "我用了洛必达，得 1",
  "candidates": [{ "id": "limit", "label": "极限", "code": "1.3", "level": "uni" }]
}`}</pre>
      <p>mode=stream 时返回流式讲解文本。健康检查：<code>GET /api/agent</code></p>
    </main>
  );
}
