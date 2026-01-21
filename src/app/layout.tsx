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
  title: "Alcaster - Advanced Video Streaming Platform",
  description:
    "Experience seamless video streaming with Alcaster. A cutting-edge platform delivering high-quality content with secure and reliable streaming technology.",
  keywords: [
    "video streaming",
    "Alcaster",
    "video platform",
    "streaming service",
    "online video",
  ],
  authors: [{ name: "Alcaster" }],
  creator: "Alcaster",
  publisher: "Alcaster",
  metadataBase: new URL("https://alcaster.com"),
  openGraph: {
    title: "Alcaster - Advanced Video Streaming Platform",
    description:
      "Experience seamless video streaming with Alcaster. A cutting-edge platform delivering high-quality content with secure and reliable streaming technology.",
    type: "website",
    locale: "en_US",
    siteName: "Alcaster",
    images: [
      {
        url: "/alcaster.svg",
        width: 1200,
        height: 630,
        alt: "Alcaster Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alcaster - Advanced Video Streaming Platform",
    description:
      "Experience seamless video streaming with Alcaster. A cutting-edge platform delivering high-quality content with secure and reliable streaming technology.",
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
