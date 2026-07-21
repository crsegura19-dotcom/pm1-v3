import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "PM1 — Primer Movimiento",
  description: "Sistema de intervención conductual. Transforma evitación en acción real.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4269149824958582"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
