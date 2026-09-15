import React, { Suspense } from "react";
import Navbar from "@/components/Navbar";
import CheckoutClient from "@/components/CheckoutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout & Pembayaran - Lapak Digitara",
  description: "Selesaikan pemesanan akun AI & layanan digital premium dengan aktivasi instan langsung ke email Anda.",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="w-full min-h-[60vh] flex items-center justify-center text-sm text-neutral-400">
              Memuat formulir checkout...
            </div>
          }
        >
          <CheckoutClient />
        </Suspense>
      </main>
      <footer className="w-full border-t border-neutral-200/60 py-6 text-center text-xs text-neutral-400 bg-white">
        <p>© {new Date().getFullYear()} Lapak Digitara. Semua hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
