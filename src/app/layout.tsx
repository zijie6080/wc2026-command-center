import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/shared/components/layout/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-mono",
});

export const viewport: Viewport = {
  themeColor: "#05070A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "WC2026 Command Center",
    template: "%s — WC2026",
  },
  description:
    "2026 FIFA World Cup 实时数据指挥中心。实时比分、球队数据、球员统计、AI 预测。",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: "WC2026 Command Center",
    description: "2026 FIFA World Cup 实时数据指挥中心",
    url: "/",
    siteName: "WC2026 Command Center",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WC2026 Command Center",
    description: "2026 FIFA World Cup 实时数据指挥中心",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://api.football-data.org" />
        <link rel="preconnect" href="https://crests.football-data.org" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] antialiased overscroll-none font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
