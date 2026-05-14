import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import HeaderQyntor from "@/components/HeaderQyntor";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Qyntor — Inteligência quantitativa para investidores",
  description: "Plataforma de inteligência financeira com leitura institucional, consenso de mercado e análise quantitativa.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <HeaderQyntor />
        {children}
        <Analytics />
      </body>
    </html>
  );
}