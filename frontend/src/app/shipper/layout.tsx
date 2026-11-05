import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#f8f8f8',
};

export const metadata: Metadata = {
  title: 'TDT Ship',
  description: 'Ứng dụng giao hàng TDT Ship dành cho nhân viên giao vận',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TDT Ship',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'TDT Ship',
  },
};

export default function ShipperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
