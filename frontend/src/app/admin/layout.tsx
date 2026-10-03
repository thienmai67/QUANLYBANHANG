import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';

export const metadata = {
  title: 'TDT M&E Admin Control Center',
  description: 'Giao diện quản trị bán hàng vật tư M&E, quản lý BOM & đơn hàng công trình',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
