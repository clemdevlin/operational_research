import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Operational Research",
  description: "Learn operational research step by step.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <strong>Operational Research</strong>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
