'use client';

import { usePathname } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SceneProvider } from "./context/scene-context";
import Providers from "./providers";
import FullscreenToggle from "./components/ui/fullscreen-toggle";

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
  // manifest 는 문서당 하나만 유효하다(브라우저는 head 의 첫 rel=manifest 만 읽는다).
  // 그래서 라우트별로 파일을 갈아끼운다 — 태블릿에서 /review 를 홈 화면에 추가하면
  // 그 아이콘이 /review 를 열어야 하기 때문이다(Android Chrome 은 manifest 의
  // start_url 을 따른다. iOS 는 추가 시점의 현재 URL 을 쓰므로 어느 쪽이든 무관).
  const pathname = usePathname();
  const manifestHref = pathname?.startsWith("/review")
    ? "/manifest-review.webmanifest"
    : "/manifest.webmanifest";

  return (
    <html lang="en" data-arp="">
      <head>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="googlebot" content="noindex,nofollow" />
        {/* 태블릿에서 데스크톱 폭(980px)으로 축소 렌더되지 않게 한다.
            user-scalable=no: 전시용이라 관람객이 핀치줌으로 레이아웃을 깨지 않도록.
            viewport-fit=cover: iPad 노치/홈인디케이터 영역까지 화면을 채운다. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        {/* 홈 화면에 추가(Add to Home Screen) 시 주소창 없이 뜨게 한다.
            iPhone Safari 는 Fullscreen API 자체가 없어서 이 경로가 유일한 전체화면 수단이고,
            iPad 도 이쪽이 더 안정적이다. Android Chrome 은 manifest 의 display 를 따른다. */}
        <link rel="manifest" href={manifestHref} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FutureCar" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${hyundaiSans.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <SceneProvider>
            {/* 전역 전체화면 트리거(좌하단 3연속 탭 / Ctrl+Cmd+Shift+F). 렌더 결과는 없다. */}
            <FullscreenToggle />
            {children}
          </SceneProvider>
        </Providers>
      </body>
    </html>
  );
}
