import type { Metadata } from "next";
import { AdminDashboard } from "@/components/features/admin-dashboard";

export const metadata: Metadata = {
  title: "কর্মী ড্যাশবোর্ড (CRM)",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
