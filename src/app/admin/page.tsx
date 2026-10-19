import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "নির্বাচনী কমান্ড সেন্টার",
  description: "মহাদান ইউনিয়ন নির্বাচনী প্রচারণার কমান্ড সেন্টার — কভারেজ, দল, ব্যয় ও কনটেন্ট।",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminShell />;
}
