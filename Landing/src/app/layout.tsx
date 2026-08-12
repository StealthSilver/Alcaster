import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { createRootMetadata } from "@/lib/metadata";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = createRootMetadata();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.className} flex min-h-full flex-col bg-[#010609] text-white`}>
        {children}
      </body>
    </html>
  );
}
