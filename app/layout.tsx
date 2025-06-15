'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SceneProvider } from "./context/scene-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-arp="">
      <head>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="googlebot" content="noindex,nofollow" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SceneProvider>
          {children}
        </SceneProvider>
      </body>
    </html>
  );
}
