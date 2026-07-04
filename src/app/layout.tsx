import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const syne = Syne({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-syne" });

export const metadata: Metadata = {
  title: "Popravki.net — Намери своя майстор",
  description: "Директория на верифицирани майстори в България. ВиК, Електротехник, Бояджия и още 20+ занаята.",
  keywords: "майстор, ремонт, ВиК, електротехник, България",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" className={`${inter.variable} ${syne.variable}`}>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
