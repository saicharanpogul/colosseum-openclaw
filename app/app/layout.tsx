import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://app-rosy-mu.vercel.app'),
  title: "Vapor | Prediction Markets for Colosseum Hackathons",
  description: "Trade on which projects will win the Colosseum Agent Hackathon. 116+ markets. On-chain. Built by AI.",
  keywords: ["solana", "prediction markets", "colosseum", "hackathon", "devnet", "defi", "trading", "ai agent"],
  authors: [{ name: "Faahh", url: "https://colosseum.com/agent-hackathon/projects/vapor" }],
  openGraph: {
    title: "Vapor 💨 | Prediction Markets for Colosseum",
    description: "Trade on which projects will win the Colosseum Agent Hackathon. 116+ markets. On-chain. Built by AI.",
    url: "https://app-rosy-mu.vercel.app",
    siteName: "Vapor",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vapor - Colosseum Prediction Markets",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vapor 💨 | Prediction Markets for Colosseum",
    description: "Trade on which projects will win. 116+ markets. On-chain. Built by AI.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletContextProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </WalletContextProvider>
        <Analytics />
      </body>
    </html>
  );
}
