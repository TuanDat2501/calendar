import type { Metadata, Viewport } from "next";
import "./globals.scss";

// 1. Config Viewport (Chặn zoom)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

// 2. Config Metadata cơ bản
export const metadata: Metadata = {
  title: "Lịch Của Tôi",
  description: "App quản lý lịch trình",
  // Không cần dòng manifest ở đây nữa, Next.js tự tìm file manifest.ts
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lịch Của Tôi",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/Calendar1.png'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        {/* --- DÒNG CODE "ÉP" IOS ẨN THANH URL (Legacy Support) --- */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lịch Của Tôi" />
      </head>
      <body>{children}</body>
    </html>
  );
}