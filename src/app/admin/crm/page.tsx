import type { Metadata } from "next";
import { AdminDashboard } from "@/components/features/admin-dashboard";

export const metadata: Metadata = {
  title: "CRM — সম্পূর্ণ টুল",
  robots: { index: false, follow: false },
};

export default function AdminCrmPage() {
  return <AdminDashboard />;
}
