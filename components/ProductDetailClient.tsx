"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import {
  ArrowLeft,
  Check,
  ShoppingBag,
  ArrowRight,
  Shield,
  Zap,
  Clock,
  Sparkles,
  CreditCard,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  Code2,
  AlertCircle,
  Boxes,
} from "lucide-react";

import { getClientStockSummary } from "@/lib/clientStock";

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [stockSummary, setStockSummary] = useState<Record<string, { available: number; used: number; total: number }>>({});

  useEffect(() => {
    let isMounted = true;
    getClientStockSummary().then((summary) => {
      if (isMounted) setStockSummary(summary);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const stockCount = stockSummary[product.id]?.available || 0;
  const inStock = stockCount > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart({
      id: product.id,
      name: product.name,
      duration: product.duration,
      price: product.price,
      image: product.image,
    });
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const waOrderMessage = encodeURIComponent(
    `Halo Admin Lapak Digitara, saya ingin memesan:\nProduk: ${product.name}\nDurasi: ${product.duration}\nHarga: ${formatRupiah(product.price)}\n\nMohon info nomor rekening / QRIS dan proses aktivasinya. Terima kasih!`
  );

  return (
    <div className="w-full bg-white pb-20 pt-4 sm:pt-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation / Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 mb-6 sm:mb-8">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-neutral-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <Link href="/#products" className="hover:text-neutral-900 transition-colors font-medium">
            Produk
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <span className="text-neutral-950 font-semibold truncate">{product.name}</span>
        </nav>

        {/* Top Product Hero: 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16 sm:mb-20">
          {/* Left Column: Product Visual Showcase */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="relative w-full aspect-[4/3] max-h-[440px] rounded-3xl border border-neutral-200/80 p-6 sm:p-10 flex items-center justify-center bg-white shadow-xs overflow-hidden group">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
              />

              {/* Anti Gravity Badge Highlight */}
              {product.antiGravityCompatible && (
                <div className="absolute top-4 left-4 bg-neutral-950 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-neutral-700/60 backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Bisa untuk Anti Gravity</span>
                </div>
              )}

              {/* Duration Badge */}
              <div className="absolute top-4 right-4 bg-neutral-100 text-neutral-800 text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200/70">
                {product.duration}
              </div>
            </div>

            {/* Guarantee / Security badges */}
            <div className="grid grid-cols-3 gap-3 w-full mt-4">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex flex-col items-center text-center">
                <Shield className="w-4 h-4 text-neutral-800 mb-1" />
                <span className="text-[11px] font-bold text-neutral-900">100% Akun Privat</span>
                <span className="text-[10px] text-neutral-500">Bukan akun sharing</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex flex-col items-center text-center">
                <Clock className="w-4 h-4 text-neutral-800 mb-1" />
                <span className="text-[11px] font-bold text-neutral-900">Durasi Penuh</span>
                <span className="text-[10px] text-neutral-500">{product.duration} aktif</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex flex-col items-center text-center">
                <Zap className="w-4 h-4 text-neutral-800 mb-1" />
                <span className="text-[11px] font-bold text-neutral-900">Proses Cepat</span>
                <span className="text-[10px] text-neutral-500">Link instan via WA/Email</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Title, Pricing, & Action CTAs */}
          <div className="lg:col-span-6 flex flex-col">
            {/* Category & Status */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {product.category}
              </span>
              <span className="text-neutral-300">•</span>
              {inStock ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Tersedia: {stockCount} link aktivasi siap kirim</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>Stok Habis (Sedang Restock)</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 mb-3">
              {product.name}
            </h1>

            {/* Tagline */}
            {product.tagline && (
              <p className="text-base sm:text-lg font-semibold text-neutral-700 mb-4">
                {product.tagline}
              </p>
            )}

            {/* Description */}
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Special Anti Gravity Banner */}
            {product.antiGravityCompatible && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-950 text-white mb-6 border border-neutral-800 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <Code2 className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-extrabold text-sm sm:text-base text-white">
                        Optimal & Kompatibel untuk Anti Gravity
                      </h4>
                      <span className="bg-amber-400 text-neutral-950 text-[10px] font-black px-1.5 py-0.2 rounded-md uppercase">
                        Support
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Akun Google Gemini Pro ini mendukung penuh integrasi ke <strong>Google Anti Gravity IDE</strong>, AI Agent development, dan API tooling dengan kapasitas konteks hingga 1-2 Juta token untuk analisis kode secara komprehensif.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Price Box */}
            <div className="p-5 rounded-2xl bg-neutral-50/90 border border-neutral-200/80 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-neutral-400 font-medium">
                    Harga Spesial
                  </span>
                  {(product as any).originalPrice && (product as any).originalPrice > product.price && (
                    <span className="text-xs text-neutral-400 line-through">
                      {formatRupiah((product as any).originalPrice)}
                    </span>
                  )}
                  {(product as any).discountPercent && (
                    <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full">
                      Hemat {(product as any).discountPercent}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950">
                    {formatRupiah(product.price)}
                  </span>
                  {product.priceNote && (
                    <span className="text-xs sm:text-sm font-medium text-neutral-500">
                      / {product.duration} ({product.priceNote})
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block text-[11px] font-bold text-neutral-700 bg-white border border-neutral-200 px-2.5 py-1 rounded-full shadow-2xs">
                  Garansi Ganti Link Jika Terkendala
                </span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col gap-2.5 mb-6">
              {inStock ? (
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  {/* Direct Online Checkout with Email Push */}
                  <Link
                    href={`/checkout?product=${product.id}`}
                    className="flex-1 py-4 px-6 rounded-2xl bg-neutral-950 hover:bg-neutral-800 active:scale-98 text-white font-bold text-sm sm:text-base text-center transition-all shadow-md flex items-center justify-center gap-2 group"
                  >
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span>Beli & Kirim Link ke Email</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    className={`py-4 px-6 rounded-2xl font-bold text-sm border transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shrink-0 ${
                      isAdded
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                        : "bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                        <span>Tersimpan! (+1)</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 stroke-[2]" />
                        <span>+ Keranjang</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-200 text-center">
                  <span className="text-sm font-bold text-neutral-500 block mb-1">
                    Stok Link Aktivasi Belum Tersedia
                  </span>
                  <p className="text-xs text-neutral-400">
                    Produk ini sedang dalam antrean restock batch baru. Silakan hubungi Admin via WhatsApp untuk pre-order atau notifikasi ketersediaan.
                  </p>
                </div>
              )}

              {/* WhatsApp Checkout Button */}
              <a
                href={`https://wa.me/?text=${waOrderMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-white hover:bg-neutral-50 active:scale-98 text-emerald-700 border border-emerald-200 font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi WhatsApp Admin ({inStock ? "Pesan Manual" : "Tanya Restock"})</span>
              </a>
            </div>

            {/* Feature Checkmarks */}
            <div className="space-y-2.5 pt-4 border-t border-neutral-200/70">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                Keuntungan yang Anda Peroleh:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5] mt-0.5" />
                    <span className="font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Tahap-Tahap Cara Aktivasi (Step by Step Guide) */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
              Panduan Pemesanan
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 mt-3 tracking-tight">
              Bagaimana Cara Aktivasinya?
            </h2>
            <p className="text-sm sm:text-base text-neutral-500 mt-2">
              Proses aktivasi sangat praktis dalam 4 tahap sederhana tanpa ribet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {product.activationSteps.map((stepItem) => (
              <div
                key={stepItem.step}
                className="relative flex flex-col p-6 rounded-3xl bg-neutral-50/70 border border-neutral-200/80 transition-all hover:bg-white hover:shadow-lg hover:border-neutral-300"
              >
                {/* Step Number Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-950 text-white font-black text-base flex items-center justify-center shadow-xs">
                    0{stepItem.step}
                  </div>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Tahap {stepItem.step}
                  </span>
                </div>

                {/* Step Icon & Title */}
                <div className="mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-950 leading-snug">
                    {stepItem.title}
                  </h3>
                </div>

                {/* Step Description */}
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-auto pt-2">
                  {stepItem.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Delivery Note Box */}
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-neutral-100/70 border border-neutral-200/60 flex items-center gap-3 text-neutral-700 text-xs sm:text-sm">
            <Mail className="w-5 h-5 text-neutral-900 shrink-0" />
            <p>
              <strong>Pengiriman Link:</strong> Setelah pembayaran dikonfirmasi, link aktivasi akan langsung dikirimkan oleh Admin ke <strong>Email pribadi Anda</strong> atau melalui <strong>chat WhatsApp / link di website</strong> dalam waktu hitungan menit.
            </p>
          </div>
        </div>

        {/* Section 3: Spesifikasi Apa Saja yang Didapat */}
        <div className="mb-16 sm:mb-20">
          <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
              Rincian Teknis
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 mt-3 tracking-tight">
              Spesifikasi Lengkap Produk
            </h2>
            <p className="text-sm sm:text-base text-neutral-500 mt-2">
              Segala benefit, kapasitas, dan spesifikasi yang Anda peroleh dari paket ini.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl border border-neutral-200/80 overflow-hidden bg-white shadow-xs">
            <div className="divide-y divide-neutral-100">
              {product.specifications.map((spec, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 hover:bg-neutral-50/60 transition-colors"
                >
                  <div className="font-bold text-xs sm:text-sm text-neutral-900 mb-1 sm:mb-0">
                    {spec.label}
                  </div>
                  <div className="sm:col-span-2 text-xs sm:text-sm text-neutral-600 font-medium">
                    {spec.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Bottom Call to Action */}
        <div className="rounded-3xl bg-neutral-950 text-white p-8 sm:p-12 text-center max-w-4xl mx-auto relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-full inline-block mb-3">
              Order Mudah & Cepat
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 text-white">
              Siap Menggunakan {product.name}?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto mb-6">
              Dapatkan link aktivasi resmi sekarang dan maksimalkan produktivitas AI Anda hari ini.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/?text=${waOrderMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>Pesan Sekarang ({formatRupiah(product.price)})</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={handleAddToCart}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Tambah ke Keranjang</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
