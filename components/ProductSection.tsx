"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, AlertCircle, ShoppingBag, Sparkles, Boxes } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { products, Product } from "@/data/products";
import { getClientStockSummary } from "@/lib/clientStock";

export default function ProductSection() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<"all" | "ready" | "out">("all");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [stockSummary, setStockSummary] = useState<Record<string, { available: number; used: number; total: number }>>({});

  const { addToCart } = useCart();

  // Fetch real-time stock summary with client cache
  useEffect(() => {
    let isMounted = true;
    getClientStockSummary().then((summary) => {
      if (isMounted) setStockSummary(summary);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const getProductStockCount = (productId: string): number => {
    return stockSummary[productId]?.available || 0;
  };

  const isProductInStock = (product: Product): boolean => {
    return (stockSummary[product.id]?.available || 0) > 0;
  };

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isProductInStock(product)) return;

    addToCart({
      id: product.id,
      name: product.name,
      duration: product.duration,
      price: product.price,
      image: product.image,
    });
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((cur) => (cur === product.id ? null : cur));
    }, 1400);
  };

  const filteredProducts = products.filter((p) => {
    const inStock = isProductInStock(p);
    if (activeFilter === "ready") return inStock;
    if (activeFilter === "out") return !inStock;
    return true;
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <section id="products" className="w-full py-12 sm:py-16 lg:py-20 bg-white">
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-950">
              Our Products
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-neutral-500 max-w-xl">
              Pilihan akun AI dan layanan digital premium berkualitas, cepat, dan terpercaya. Setiap akun memiliki link aktivasi resmi yang siap dikirim langsung setelah pembayaran.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/60 self-start md:self-auto text-xs font-semibold">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeFilter === "all"
                  ? "bg-white text-neutral-950 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Semua ({products.length})
            </button>
            <button
              onClick={() => setActiveFilter("ready")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeFilter === "ready"
                  ? "bg-white text-neutral-950 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Tersedia ({products.filter((p) => isProductInStock(p)).length})
            </button>
            <button
              onClick={() => setActiveFilter("out")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeFilter === "out"
                  ? "bg-white text-neutral-950 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Habis Stock ({products.filter((p) => !isProductInStock(p)).length})
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {filteredProducts.map((product) => {
            const inStock = isProductInStock(product);
            const stockCount = getProductStockCount(product.id);

            return (
              <div
                key={product.id}
                onClick={() => router.push(`/product/${product.id}`)}
                className={`group/card cursor-pointer relative flex flex-col justify-between rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-5 lg:p-6 transition-all duration-300 border select-none ${
                  inStock
                    ? "bg-white border-neutral-200/80 hover:border-neutral-400 shadow-xs hover:shadow-xl hover:-translate-y-1.5"
                    : "bg-white border-neutral-200/50 opacity-80"
                }`}
              >
                <div>
                  {/* Card Top: Duration, Anti Gravity & Live Stock Status */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 sm:mb-4">
                    <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                      {product.duration}
                    </span>

                    {product.antiGravityCompatible && (
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-neutral-950 text-white shadow-2xs">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                        Anti Gravity
                      </span>
                    )}

                    {inStock ? (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Stok: {stockCount}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200/60">
                        <AlertCircle className="w-3 h-3 text-neutral-500" />
                        <span>Habis Stock</span>
                      </span>
                    )}
                  </div>

                  {/* Product Thumbnail Frame */}
                  <div className="relative w-full h-[95px] sm:h-[135px] md:h-[155px] rounded-xl sm:rounded-2xl overflow-hidden bg-transparent mb-2.5 sm:mb-4 flex items-center justify-center">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className={`object-contain p-1 transition-transform duration-500 group-hover/card:scale-105 ${
                        inStock ? "" : "grayscale opacity-60"
                      }`}
                    />
                  </div>

                  {/* Product Title & Category */}
                  <div className="mb-1.5 sm:mb-2">
                    <span className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                      {product.category}
                    </span>
                    <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-neutral-950 mt-0.5 leading-snug line-clamp-2 group-hover/card:text-neutral-700 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-2 mb-3 leading-relaxed hidden sm:block">
                    {product.description}
                  </p>

                  {/* Key Features Bullet List */}
                  <div className="space-y-1.5 mb-4 sm:mb-6 pt-2.5 sm:pt-3 border-t border-neutral-200/60 hidden sm:block">
                    {product.features.slice(0, 3).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-neutral-600">
                        <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0 stroke-[2.5]" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Price & Order Action */}
                <div className="pt-2.5 sm:pt-3 border-t border-neutral-200/60">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-2 sm:mb-3">
                    <div>
                      <span className="text-[10px] sm:text-xs text-neutral-400 block font-medium hidden sm:block">
                        Harga
                      </span>
                      <span className="text-sm sm:text-xl lg:text-2xl font-black text-neutral-950 tracking-tight">
                        {formatRupiah(product.price)}
                      </span>
                    </div>
                    {product.priceNote && (
                      <span className="text-[9px] sm:text-[11px] text-neutral-500 font-medium sm:text-right leading-tight truncate mt-0.5 sm:mt-0">
                        {product.priceNote}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {inStock ? (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/product/${product.id}`);
                        }}
                        className="flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-full bg-neutral-950 text-white font-semibold text-xs sm:text-sm hover:bg-neutral-800 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1 shadow-xs group/order"
                      >
                        <span>
                          Detail<span className="hidden sm:inline"> & Pesan</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/order:translate-x-0.5 shrink-0" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product, e);
                        }}
                        className={`relative p-2 sm:p-2.5 rounded-full border transition-all duration-200 flex items-center justify-center shrink-0 active:scale-90 ${
                          addedProductId === product.id
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-105"
                            : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200/80"
                        }`}
                        title="Tambah ke Keranjang"
                        aria-label={`Tambah ${product.name} ke keranjang`}
                      >
                        {addedProductId === product.id ? (
                          <Check className="w-4 h-4 text-white stroke-[3] animate-in zoom-in duration-200" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 stroke-[2]" />
                        )}

                        {/* Animated +1 badge */}
                        {addedProductId === product.id && (
                          <span className="absolute -top-3 -right-1 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-bounce">
                            +1
                          </span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2 sm:py-2.5 rounded-full bg-neutral-100 text-neutral-400 font-semibold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <span>Habis Stock (Segera Restock)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
