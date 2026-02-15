import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientShell } from "@/components/ClientShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Modulo - Autonomous Merchant Infrastructure",
  description: "Multi-agent orchestration for automated on-chain settlements and splits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
