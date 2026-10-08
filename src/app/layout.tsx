import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegistraSW } from "@/components/RegistraSW";

export const metadata: Metadata = {
  title: "Lion ECU — Officine",
  description: "Ritiro, riparazione e garanzia delle centraline dei mezzi pesanti.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icone/icona-192.png", apple: "/icone/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Lion ECU", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#24384d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        {children}
        <RegistraSW />
      </body>
    </html>
  );
}
