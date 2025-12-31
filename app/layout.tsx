import type { Metadata, Viewport } from "next"; // Thêm Viewport
import "./globals.css";

// 1. Cấu hình hiển thị cho Mobile
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Chặn zoom để giống App thật
  themeColor: "#2563eb",
};

// 2. Cấu hình App Apple
export const metadata: Metadata = {
  title: "Lịch Của Tôi",
  description: "App quản lý lịch cá nhân",
  manifest: "/manifest.json", // Link tới file vừa tạo
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lịch Của Tôi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}