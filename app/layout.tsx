import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LA MATAMONCHIS S.A. - Sistema POS",
  description: "Sistema de Punto de Venta para LA MATAMONCHIS S.A.",
  generator: "v0.app",
  icons: {
    icon: "/logos/sinfondo.png",
    apple: "/logos/sinfondo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
