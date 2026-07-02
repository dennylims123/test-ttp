import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Plus Jakarta Sans is the closest free Google Font to Aptos (Permata Group's font)
// Aptos is a Microsoft proprietary font not available on Google Fonts.
const aptos = Plus_Jakarta_Sans({
  variable: "--font-aptos",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const aptosDisplay = Plus_Jakarta_Sans({
  variable: "--font-aptos-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Permata Group — Form TTP",
  description: "Form TTP (Traceability to Plantation) — Permata Group. Sistem kemamputelusuran TBS ke kebun untuk Pabrik Kelapa Sawit.",
  keywords: ["TTP", "Traceability", "Permata Group", "Palm Oil", "PKS", "TBS", "FFB"],
  icons: {
    icon: "/permatagroup-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${aptos.variable} ${aptosDisplay.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
