import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mabellen - Loja Virtual",
  description: "Sua moda íntima com elegância e conforto.",
  manifest: "/manifest.json",
  themeColor: "#c9a96e",
  // Essas tags abaixo configuram o que aparece no WhatsApp/Redes Sociais
  openGraph: {
    title: "Mabellen - Loja Virtual",
    description: "Sua moda íntima com elegância e conforto.",
    url: "https://mabellen-loja.vercel.app", // Substitua pela sua URL real depois
    siteName: "Mabellen",
    images: [
      {
        url: "COLE_AQUI_O_LINK_DA_SUA_LOGO", // Coloque o link do Supabase aqui
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
      <head>
        {/* O Next.js gerencia o Head automaticamente via metadata, 
            mas mantemos o suporte para ícones de dispositivo se necessário */}
        <link rel="apple-touch-icon" href="https://hhzqgrnuedzabacarjoi.supabase.co/storage/v1/object/public/logo%20mabellen.jpeg/mabellen-logo.jpeg.jpeg" />
      </head>
      <body>{children}</body>
    </html>
  );
}