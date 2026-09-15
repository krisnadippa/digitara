import React from "react";
import AdminDashboard from "@/components/AdminDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Admin - Lapak Digitara",
  description: "Panel kendali admin Lapak Digitara untuk mengonfirmasi pesanan dan mengirim email aktivasi otomatis.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
