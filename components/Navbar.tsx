"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();

  return (
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

          {/* Right: Shopping Cart connected to localStorage */}
          <div className="flex items-center gap-2 sm:gap-3 z-10">
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
          <nav className="flex flex-col gap-4 text-base font-medium text-neutral-700">
            <Link
              href="#products"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-neutral-950 py-1 transition-colors"
            >
              Semua Produk AI
            </Link>
            <Link
              href="#gemini"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-neutral-950 py-1 transition-colors"
            >
              Google Gemini
            </Link>
            <Link
              href="#chatgpt"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-neutral-950 py-1 transition-colors"
            >
              ChatGPT Plus
            </Link>
            <Link
              href="#duolingo"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-neutral-950 py-1 transition-colors"
            >
              Duolingo Super
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
