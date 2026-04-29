import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mabellen",
  description: "Loja de Roupas",
  manifest: "/manifest.json",
  themeColor: "#c9a96e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}