import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alcaster - Preserve What Matters. Forever.",
  description:
    "A blockchain-secured family vault where ownership, trust, and access are passed down over time. Preserve family documents, memories, and secrets across generations with Alcaster's decentralized storage.",
  keywords: [
    "family vault",
    "blockchain storage",
    "decentralized family vault",
    "digital legacy",
    "family tree",
    "document vault",
    "memory archive",
    "succession planning",
    "Solana blockchain",
    "encrypted storage",
  ],
  authors: [{ name: "Alcaster" }],
  creator: "Alcaster",
  publisher: "Alcaster",
  metadataBase: new URL("https://alcaster.com"),
  openGraph: {
    title: "Alcaster - Preserve What Matters. Forever.",
    description:
      "A blockchain-secured family vault where ownership, trust, and access are passed down over time. Join thousands of families preserving their most important documents, memories, and secrets across generations.",
    type: "website",
    locale: "en_US",
    siteName: "Alcaster",
    images: [
      {
        url: "/alcaster.svg",
        width: 1200,
        height: 630,
        alt: "Alcaster - Decentralized Family Vault",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alcaster - Preserve What Matters. Forever.",
    description:
      "Blockchain-secured family vault for preserving documents, memories, and secrets across generations. Built on Solana with hierarchical access control.",
    images: ["/alcaster.svg"],
    creator: "@alcaster",
  },
  icons: {
    icon: "/alcaster.svg",
    shortcut: "/alcaster.svg",
    apple: "/alcaster.svg",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
