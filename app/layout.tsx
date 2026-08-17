import type { Metadata } from "next";
import "./globals.css";
import ClientInit from "./ClientInit"; // Importa o componente de inicialização

const LOGO_URL = "/icon-512.png";

export const metadata: Metadata = {
  title: "Doces da Rosa",
  description: "Rosa Confeitaria: bolos no pote, copos da felicidade, sobremesas exclusivas e bolos caseiros feitos com muito carinho.",
  manifest: "/manifest.json",
  themeColor: "#e91e63",
  icons: {
    icon: LOGO_URL,
    apple: LOGO_URL,
  },
  openGraph: {
    title: "Doces da Rosa",
    description: "Rosa Confeitaria: bolos no pote, copos da felicidade, sobremesas exclusivas e bolos caseiros feitos com muito carinho.",

    url: "https://doces-da-rosa-ba2l.vercel.app",
    siteName: "Doces da Rosa",
    images: [
      {
        url: LOGO_URL,
        width: 1200,
        height: 630,
        alt: "Doces da Rosa Logo",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body>
        <ClientInit />
        {children}
      </body>
    </html>
  );
}