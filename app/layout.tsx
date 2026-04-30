import type { Metadata } from "next";
import "./globals.css";

// O link da sua logo que pegamos no Supabase
const LOGO_URL = "https://hhzqgrnuedzabacarjoi.supabase.co/storage/v1/object/public/logo%20mabellen.jpeg/mabellen-logo.jpeg.jpeg";

export const metadata: Metadata = {
  title: "Mabellen - Loja Virtual",
  description: "Sua moda íntima com elegância e conforto.",
  manifest: "/manifest.json",
  themeColor: "#c9a96e",
  // Define o ícone da aba (Favicon) e do iPhone
  icons: {
    icon: LOGO_URL,
    apple: LOGO_URL,
  },
  // Configuração para WhatsApp, Facebook e Instagram
  openGraph: {
    title: "Mabellen - Loja Virtual",
    description: "Sua moda íntima com elegância e conforto.",
    url: "https://mabellen-loja.vercel.app",
    siteName: "Mabellen",
    images: [
      {
        url: LOGO_URL,
        width: 1200,
        height: 630,
        alt: "Mabellen Logo",
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
      <body>{children}</body>
    </html>
  );
}