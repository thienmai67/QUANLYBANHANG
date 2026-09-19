import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TDT Platform • Phân Phối & Báo Giá Cơ Điện M&E",
  description: "Nền tảng báo giá và phân phối vật tư Điện - Nước (Bình Minh, Cadivi, Panasonic)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
