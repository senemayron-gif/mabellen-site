import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mabellen Store",
  description: "Loja Virtual",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}