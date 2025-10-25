export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body style={{ fontFamily: "system-ui, Arial, sans-serif", margin: 0 }}>
        <div style={{ padding: 16, borderBottom: "1px solid #eee", background: "#fff", position: "sticky", top: 0 }}>
          <strong>TP Lite</strong> &nbsp;|&nbsp;
          <a href="/">Upload</a> &nbsp;|&nbsp;
          <a href="/dashboard">Dashboard</a> &nbsp;|&nbsp;
          <a href="/settings">Nastavení</a>
        </div>
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
