"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";

export default function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart } = useCart();

  if (!isCartOpen) return null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const checkoutMessage = encodeURIComponent(
    `Halo Lapak Digitara, saya ingin memesan:\n` +
      cartItems
        .map(
          (item) =>
            `- ${item.name} (${item.duration}) x${item.quantity} = ${formatRupiah(
              item.price * item.quantity
            )}`
        )
        .join("\n") +
      `\n\nTotal: ${formatRupiah(totalPrice)}\nMohon info rekening dan proses aktivasinya.`
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neutral-900" />
            <h3 className="text-lg font-bold text-neutral-950">Keranjang Belanja</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)} item
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-neutral-400">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 text-neutral-400 stroke-1" />
              </div>
              <p className="font-semibold text-neutral-700 mb-1">Keranjang Masih Kosong</p>
              <p className="text-xs text-neutral-400 max-w-xs">
                Pilih produk AI atau digital favorit Anda dan klik tombol masukkan ke keranjang.
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-neutral-50/80 border border-neutral-100 relative group"
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-14 rounded-xl overflow-hidden bg-white shrink-0 flex items-center justify-center border border-neutral-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-1"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-950 truncate">
                    {item.name}
                  </h4>
                  <span className="text-[11px] text-neutral-500 font-medium block">
                    {item.duration}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-neutral-900 mt-0.5 block">
                    {formatRupiah(item.price)}
                  </span>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                    title="Hapus item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 bg-white border border-neutral-200/80 rounded-full px-2 py-0.5 shadow-xs">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="text-neutral-500 hover:text-neutral-900 p-0.5"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-neutral-800 w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="text-neutral-500 hover:text-neutral-900 p-0.5"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Total & Checkout Actions */}
        {cartItems.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-neutral-100 bg-neutral-50/50 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 font-medium">Subtotal</span>
              <span className="text-xl font-black text-neutral-950">
                {formatRupiah(totalPrice)}
              </span>
            </div>

            {/* Primary: Dedicated Checkout Page */}
            <Link
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="w-full py-3.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-sm text-center transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-95"
            >
              <span>Lanjut ke Formulir Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Secondary: Direct WhatsApp Order */}
            <a
              href={`https://wa.me/?text=${checkoutMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-full bg-white hover:bg-neutral-100 text-emerald-700 border border-emerald-300 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>Atau Order Cepat via WhatsApp</span>
            </a>

            <button
              onClick={clearCart}
              className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600 transition-colors py-1"
            >
              Kosongkan Keranjang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
