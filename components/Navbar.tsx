"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, History } from "lucide-react";
import { useCart } from "@/context/CartContext";
import OrderHistoryModal from "@/components/OrderHistoryModal";
import { getUserSavedOrders } from "@/lib/userHistory";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const { cartCount, setIsCartOpen } = useCart();

  const updateHistoryCount = () => {
    const list = getUserSavedOrders();
    setHistoryCount(list.length);
  };

  useEffect(() => {
    updateHistoryCount();
    window.addEventListener("lapakdigitara_orders_updated", updateHistoryCount);
    return () => window.removeEventListener("lapakdigitara_orders_updated", updateHistoryCount);
  }, []);

  return (
    <>
      <header className="w-full bg-white/95 backdrop-blur-sm sticky top-0 z-40 border-b border-neutral-100 transition-all">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="relative flex items-center justify-between h-20">
            {/* Left: Hamburger Menu Button */}
            <div className="flex items-center gap-2 z-10">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-full text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all duration-200"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 stroke-[1.75]" />
                ) : (
                  <Menu className="w-6 h-6 stroke-[1.75]" />
                )}
              </button>
            </div>

            {/* Center: Brand Logo DIGITARA (Strictly Centered) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
              <Link
                href="/"
                className="group flex items-center gap-1 select-none cursor-pointer"
              >
                <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.22em] text-neutral-950 font-sans uppercase group-hover:opacity-80 transition-opacity">
                  DIGITARA
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 inline-block self-end mb-1.5 ml-0.5" />
              </Link>
            </div>

            {/* Right: Order History & Shopping Cart */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 z-10">
              {/* Order History Button */}
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 active:scale-95 transition-all relative group/history text-xs font-bold border border-transparent hover:border-neutral-200/80"
                aria-label="Buka Riwayat Pesanan"
                title="Riwayat Pesanan Saya"
              >
                <History className="w-4 h-4 stroke-[2] group-hover/history:rotate-[-20deg] transition-transform" />
                <span className="hidden sm:inline">Riwayat</span>
                {historyCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-neutral-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in duration-200 shadow-2xs">
                    {historyCount}
                  </span>
                )}
              </button>

              {/* Shopping Cart connected to localStorage */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2.5 rounded-full text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all relative group/cart"
                aria-label="Buka Keranjang Belanja"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.75] group-hover/cart:scale-105 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-neutral-950 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in duration-200 shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-100 bg-white px-6 py-5 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-3 text-base font-medium text-neutral-700">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsHistoryModalOpen(true);
                }}
                className="flex items-center justify-between text-left py-2 font-bold text-neutral-950 border-b border-neutral-100"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span>Riwayat Pesanan Saya</span>
                </div>
                {historyCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-950 text-white text-xs font-bold">
                    {historyCount}
                  </span>
                )}
              </button>

              <Link
                href="/#products"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-neutral-950 py-1 transition-colors"
              >
                Semua Produk AI
              </Link>
              <Link
                href="/#gemini"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-neutral-950 py-1 transition-colors"
              >
                Google Gemini
              </Link>
              <Link
                href="/#chatgpt"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-neutral-950 py-1 transition-colors"
              >
                ChatGPT Plus
              </Link>
              <Link
                href="/#duolingo"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-neutral-950 py-1 transition-colors"
              >
                Duolingo Super
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </>
  );
}
