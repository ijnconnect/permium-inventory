import "./globals.css";

export const metadata = {
  title: "permium-inventory | IJN CCD Premium Inventory",
  description: "IJN CCD Premium item stock tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="appShell">
          <header className="topBar">
            <div className="brand">
              <div className="brandMark" />
              <div>
                <div className="brandTitle">IJN CCD Premium Inventory</div>
                <div className="brandSub">permium-inventory</div>
              </div>
            </div>
          </header>
          <main className="container">{children}</main>
          <footer className="footer">© {new Date().getFullYear()} IJN</footer>
        </div>
      </body>
    </html>
  );
}
