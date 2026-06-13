import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CertOS",
  description: "Certificeringsbeheer voor de coördinerende consultant",
  icons: { icon: "/mark.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${archivo.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
