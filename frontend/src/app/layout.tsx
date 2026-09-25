import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin", "vietnamese"], variable: "--font-display" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#060810" },
  ],
};

export const metadata: Metadata = {
  title: "VLXD TDT | Tổng Kho Vật Liệu Xây Dựng & Thiết Bị Công Trình",
  description: "Tổng kho phân phối vật liệu xây dựng TDT: thép xây dựng Hòa Phát, xi măng Vicem, gạch tuynel Viglacera, cát đá cốt liệu, gạch ốp lát và hóa chất chống thấm chính hãng chuẩn TCVN.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-background text-foreground font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
