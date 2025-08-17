'use client';

import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SceneProvider } from "./context/scene-context";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const hyundaiSans = localFont({
  variable: "--font-hyundai",
  display: "swap",
  src: [
    {
      path: "../public/fonts/HyundaiSansUI_JP_KR_Latin-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/HyundaiSansUI_JP_KR_Latin-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../public/fonts/HyundaiSansUI_JP_KR_Latin-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/HyundaiSansUI_JP_KR_Latin-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/HyundaiSansUI_JP_KR_Latin-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/HyundaiSansUI_JP_KR_Latin-RegularItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/HyundaiSansUI_JP_KR_Latin-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/HyundaiSansUI_JP_KR_Latin-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/HyundaiSansUI_JP_KR_Latin-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/HyundaiSansUI_JP_KR_Latin-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    }
  ],
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
      <body className={`${hyundaiSans.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <SceneProvider>
            {children}
          </SceneProvider>
        </Providers>
      </body>
    </html>
  );
}
