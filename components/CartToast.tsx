"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { CheckCircle2, ShoppingBag, ArrowRight, X } from "lucide-react";

export default function CartToast() {
  const { toastMessage, setIsCartOpen, cartCount } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 max-w-sm w-[92vw] sm:w-auto animate-in slide-in-from-bottom-6 fade-in duration-300">
      <div className="bg-neutral-950 text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-neutral-800 flex items-center justify-between gap-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-neutral-100 truncate">
              {toastMessage}
            </p>
            <p className="text-[11px] text-neutral-400">
              Total {cartCount} item di keranjang
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-xs"
        >
          <span>Buka</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
