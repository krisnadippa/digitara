import React from "react";
import Navbar from "@/components/Navbar";
import { Metadata } from "next";
import OrderHistoryClient from "./OrderHistoryClient";

export const metadata: Metadata = {
  title: "Riwayat Pesanan Saya - Lapak Digitara",
  description: "Cek riwayat pesanan akun AI dan lisensi digital Anda di Lapak Digitara beserta status konfirmasi dan link aktivasi.",
};

export default function RiwayatPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <OrderHistoryClient />
        </div>
      </main>
      <footer className="w-full border-t border-neutral-200/60 py-6 text-center text-xs text-neutral-400 bg-white">
        <p>© {new Date().getFullYear()} Lapak Digitara. Semua hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
