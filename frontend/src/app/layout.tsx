import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "./providers";
import ChatBotWidget from "@/components/chat/ChatBotWidget";
import FloatingContactDock from "@/components/FloatingContactDock";
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
  title: "TDT M&E | Cửa Hàng Vật Tư Điện Nước M&E Chính Hãng",
  description: "Cửa hàng vật tư điện nước M&E chính hãng: ống uPVC/PPR Bình Minh, dây cáp Cadivi, aptomat Panasonic, Schneider chuẩn TCVN.",
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
          <FloatingContactDock />
          <ChatBotWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
