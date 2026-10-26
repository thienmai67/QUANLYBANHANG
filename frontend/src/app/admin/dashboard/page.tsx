import { redirect } from 'next/navigation';

export default function DashboardPage() {
  redirect('/manager/dashboard');
}
