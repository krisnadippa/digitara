"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCart, CartItem } from "@/context/CartContext";
import { getProductById } from "@/data/products";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Mail,
  Phone,
  User,
  CreditCard,
  QrCode,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Clock,
  MessageCircle,
} from "lucide-react";

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const directProductId = searchParams.get("product");

  const { cartItems, clearCart } = useCart();
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

  // Customer form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const paymentMethod = "qris";

  // Step flow: 'form' -> 'payment' -> 'waiting' -> 'success'
  const [step, setStep] = useState<"form" | "payment" | "waiting" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingToAdmin, setIsConfirmingToAdmin] = useState(false);

  // Active Order state
  const [currentOrder, setCurrentOrder] = useState<{
    orderId: string;
    uniqueCode: number;
    baseAmount: number;
    totalAmount: number;
    activationLink: string;
  } | null>(null);

  const [copiedNominal, setCopiedNominal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize checkout items
  useEffect(() => {
    if (directProductId) {
      const prod = getProductById(directProductId);
      if (prod) {
        setCheckoutItems([
          {
            id: prod.id,
            name: prod.name,
            duration: prod.duration,
            price: prod.price,
            image: prod.image,
            quantity: 1,
          },
        ]);
        return;
      }
    }
    setCheckoutItems(cartItems);
  }, [directProductId, cartItems]);

  const baseAmount = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Submit Form & Create Order with 3-Digit Unique Code on Server
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !whatsapp) {
      alert("Harap lengkapi nama, alamat email, dan nomor WhatsApp.");
      return;
    }
    if (!checkoutItems.length) {
      alert("Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: name,
          buyerEmail: email,
          buyerWhatsapp: whatsapp,
          items: checkoutItems,
          baseAmount,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setCurrentOrder({
          orderId: data.order.orderId,
          uniqueCode: data.order.uniqueCode,
          baseAmount: data.order.baseAmount,
          totalAmount: data.order.totalAmount,
          activationLink: data.order.activationLink,
        });
        setStep("payment");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(data.error || "Gagal membuat pesanan.");
      }
    } catch (err) {
      console.error("Error creating order:", err);
      alert("Terjadi gangguan jaringan saat membuat pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Smart polling with backoff & visibility awareness to prevent hitting Vercel limits
  useEffect(() => {
    if ((step === "payment" || step === "waiting") && currentOrder?.orderId) {
      let checkCount = 0;
      let timeoutId: NodeJS.Timeout | null = null;
      let isDisposed = false;

      const checkStatus = async () => {
        if (isDisposed) return;

        // Skip poll if user switched tabs / document hidden
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
          return;
        }

        try {
          const res = await fetch(`/api/orders/${currentOrder.orderId}/status`);
          const data = await res.json();
          if (data.status === "PAID") {
            setStep("success");
            clearCart();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
        } catch (e) {
          console.error("Polling error:", e);
        }

        checkCount++;

        // Stop polling after ~15 minutes (approx 120 checks) to prevent infinite requests
        if (checkCount > 120) return;

        // Backoff: 4.5s for first 6 checks, 7s for next 10, then 10s
        const nextDelay = checkCount < 6 ? 4500 : checkCount < 16 ? 7000 : 10000;
        if (!isDisposed) {
          timeoutId = setTimeout(checkStatus, nextDelay);
        }
      };

      // Initial schedule
      timeoutId = setTimeout(checkStatus, 4500);

      // On visibility change: immediately check when user tabs back
      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          checkStatus();
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);

      return () => {
        isDisposed = true;
        if (timeoutId) clearTimeout(timeoutId);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }
  }, [step, currentOrder?.orderId, clearCart]);

  // Buyer clicks "Saya Sudah Bayar" -> marks as WAITING_CONFIRMATION
  const handleBuyerConfirmPayment = async () => {
    if (!currentOrder) return;
    setIsConfirmingToAdmin(true);
    try {
      const res = await fetch(`/api/orders/${currentOrder.orderId}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setStep("waiting");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      console.error(e);
      setStep("waiting");
    } finally {
      setIsConfirmingToAdmin(false);
    }
  };

  const copyNominal = () => {
    if (currentOrder) {
      navigator.clipboard.writeText(String(currentOrder.totalAmount));
      setCopiedNominal(true);
      setTimeout(() => setCopiedNominal(false), 2000);
    }
  };

  const copyActivationLink = () => {
    if (currentOrder?.activationLink) {
      navigator.clipboard.writeText(currentOrder.activationLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] text-neutral-900 pb-24 pt-6 sm:pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header / Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200/80">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-600 hover:text-neutral-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Toko</span>
          </Link>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
            <span
              className={`px-3 py-1 rounded-full ${
                step === "form"
                  ? "bg-neutral-950 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              1. Formulir Data
            </span>
            <span className="text-neutral-300">→</span>
            <span
              className={`px-3 py-1 rounded-full ${
                step === "payment"
                  ? "bg-neutral-950 text-white"
                  : step === "waiting"
                  ? "bg-amber-500 text-white"
                  : step === "success"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-neutral-200 text-neutral-500"
              }`}
            >
              2. Bayar QRIS
            </span>
            <span className="text-neutral-300">→</span>
            <span
              className={`px-3 py-1 rounded-full ${
                step === "waiting"
                  ? "bg-amber-500 text-white"
                  : step === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-200 text-neutral-500"
              }`}
            >
              {step === "waiting" ? "3. Menunggu ACC" : "3. Link Dikirim"}
            </span>
          </div>
        </div>

        {/* STEP 1: FORMULIR DATA PEMBELI */}
        {step === "form" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: Customer Data Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
                    Formulir Pemesanan
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                    Isi data Anda dengan benar. Begitu admin meng-ACC pembayaran, link aktivasi akun resmi akan langsung dikirimkan ke email Anda.
                  </p>
                </div>

                <form onSubmit={handleProceedToPayment} className="space-y-4 sm:space-y-5">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Nama Lengkap *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Krisna Aditya"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900 transition-colors bg-white"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Alamat Email Aktif *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama.email@gmail.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900 transition-colors bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Link aktivasi & invoice resmi akan otomatis di-push ke email ini begitu di-ACC admin.
                    </p>
                  </div>

                  {/* No WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Nomor WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="08123456789"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900 transition-colors bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Untuk konfirmasi cepat jika Admin memerlukan informasi tambahan.
                    </p>
                  </div>

                  {/* Metode Pembayaran Selection */}
                  <div className="pt-4 border-t border-neutral-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2.5">
                      Metode Pembayaran
                    </label>
                    <div className="p-3.5 rounded-2xl border-2 border-neutral-950 bg-neutral-50/80 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-neutral-950">QRIS Resmi (DANA & Semua Bank)</span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Aktif</span>
                          </div>
                          <div className="text-[11px] text-neutral-500">Scan via DANA, GoPay, OVO, ShopeePay, BCA, Mandiri, BRI, & Mobile Banking</div>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-neutral-950 hover:bg-neutral-800 active:scale-98 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membuat Pesanan...</span>
                      </>
                    ) : (
                      <>
                        <span>Lanjut ke Pembayaran QRIS</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-neutral-200/80 shadow-xs sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-4 h-4 text-neutral-900" />
                  <h3 className="text-base font-bold text-neutral-950">Ringkasan Pesanan</h3>
                </div>

                {checkoutItems.length === 0 ? (
                  <div className="py-8 text-center text-neutral-400 text-xs">
                    Belum ada produk yang dipilih.{" "}
                    <Link href="/#products" className="text-neutral-900 font-bold underline">
                      Pilih produk sekarang
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 mb-5">
                    {checkoutItems.map((item) => (
                      <div key={item.id} className="py-3.5 flex items-center gap-3">
                        <div className="relative w-14 h-12 rounded-xl bg-neutral-50 border border-neutral-100 overflow-hidden shrink-0 flex items-center justify-center">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-neutral-950 truncate">
                            {item.name}
                          </h4>
                          <span className="text-[11px] text-neutral-500 block">
                            {item.duration} (x{item.quantity})
                          </span>
                        </div>
                        <div className="text-xs font-black text-neutral-950">
                          {formatRupiah(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotal & Total */}
                <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal Produk</span>
                    <span className="font-semibold text-neutral-900">{formatRupiah(baseAmount)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Biaya Pengiriman Link</span>
                    <span className="font-semibold text-emerald-600">Gratis (Email Otomatis)</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-neutral-950 pt-2 border-t border-neutral-200">
                    <span>Estimasi Total</span>
                    <span>{formatRupiah(baseAmount)}</span>
                  </div>
                </div>

                {/* Anti Gravity notice if Gemini Pro present */}
                {checkoutItems.some((i) => i.id.includes("gemini")) && (
                  <div className="mt-5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start gap-2.5 text-[11px] text-neutral-700">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Mendukung Anti Gravity:</strong> Lisensi Google Gemini Pro Anda siap pakai untuk Google Anti Gravity IDE & AI coding agents.
                    </div>
                  </div>
                )}

                {/* Security trust badge */}
                <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Transaksi Aman & Garansi Aktivasi Resmi</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PEMBAYARAN QRIS DANA DENGAN GAMBAR ASLI */}
        {step === "payment" && currentOrder && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-lg text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Langkah Pembayaran
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 mt-3 mb-1">
                Scan QRIS DANA
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mb-5">
                Silakan scan QRIS di bawah ini melalui aplikasi DANA atau Mobile Banking Anda.
              </p>

              {/* Nominal Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-200 mb-6 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider block">
                      Total Pembayaran:
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                      {formatRupiah(currentOrder.totalAmount)}
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Order ID: <strong>#{currentOrder.orderId}</strong>
                    </span>
                  </div>
                  <button
                    onClick={copyNominal}
                    className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedNominal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNominal ? "Tersalin!" : "Salin Nominal"}</span>
                  </button>
                </div>
              </div>

              {/* Large Frameless QRIS Display */}
              <div className="flex flex-col items-center my-6">
                <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px]">
                  <Image
                    src="/images/qris.png"
                    alt="QRIS DANA Lapak Digitara"
                    fill
                    priority
                    className="object-contain"
                  />
                </div>

                <div className="mt-4 text-center">
                  <span className="text-xs font-semibold text-neutral-600 block">
                    Bisa di-scan dari aplikasi DANA, GoPay, OVO, ShopeePay, BCA, Mandiri, BRI, & semua e-wallet
                  </span>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 text-left mb-6 leading-relaxed">
                ℹ️ <strong>Setelah Transfer:</strong> Klik tombol <strong>"Saya Sudah Bayar"</strong> di bawah. Admin akan langsung mengecek dan meng-ACC pesanan Anda. Begitu di-ACC, link aktivasi otomatis langsung masuk ke email Anda.
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBuyerConfirmPayment}
                  disabled={isConfirmingToAdmin}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isConfirmingToAdmin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Melaporkan ke Admin...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Saya Sudah Bayar (Konfirmasi ke Admin)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep("form")}
                  className="w-full py-2.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors font-medium"
                >
                  &larr; Batalkan / Ubah Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2.5: MENUNGGU KONFIRMASI / ACC DARI ADMIN */}
        {step === "waiting" && currentOrder && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-xl text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-9 h-9 animate-pulse" />
              </div>

              <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Menunggu Konfirmasi Admin
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 mt-3 mb-2">
                Pembayaran Anda Sedang Dicek Admin
              </h2>

              <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto mb-6 leading-relaxed">
                Terima kasih, <strong>{name}</strong>! Laporan pembayaran untuk Order <strong>#{currentOrder.orderId}</strong> telah masuk ke antrean Admin.
                <br /><br />
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-block">
                  ⚡ Begitu Admin meng-ACC, link aktivasi akan otomatis masuk ke email Anda: <strong>{email}</strong>
                </span>
              </p>

              {/* Auto polling loader */}
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-neutral-500 mb-6 bg-neutral-50 py-3 px-4 rounded-2xl border border-neutral-200/70 max-w-md mx-auto">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                <span>Halaman ini akan otomatis beralih setelah di-ACC...</span>
              </div>

              {/* Direct WhatsApp Confirmation Button */}
              <div className="space-y-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Halo Admin Lapak Digitara, saya sudah melakukan pembayaran untuk Order #${currentOrder.orderId} atas nama ${name} (${email}) sebesar ${formatRupiah(currentOrder.totalAmount)}. Mohon di-ACC. Terima kasih!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5 fill-white/20" />
                  <span>Kirim Bukti Pembayaran via WhatsApp Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  href="/"
                  className="w-full py-2.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors font-medium block text-center"
                >
                  Kembali ke Beranda (Status tetap tersimpan)
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUKSES VERIFIKASI (ADMIN SUDAH ACC & EMAIL MASUK) */}
        {step === "success" && currentOrder && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-xl text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Pembayaran Berhasil Di-ACC!
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 mt-3 mb-2">
                Link Aktivasi Telah Dikirim ke Email!
              </h2>

              <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto mb-6">
                Admin telah mengonfirmasi pembayaran Anda sebesar <strong>{formatRupiah(currentOrder.totalAmount)}</strong>. Rincian lisensi dan link aktivasi resmi telah masuk ke kotak masuk:
                <br />
                <strong className="text-neutral-950 text-sm font-bold bg-neutral-100 px-2.5 py-0.5 rounded-md inline-block mt-1">
                  {email}
                </strong>
              </p>

              {/* Activation Link Box */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-neutral-950 to-neutral-900 text-white text-left mb-6 shadow-md border border-neutral-800">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider">
                    Order ID #{currentOrder.orderId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    Aktif & Lunas
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-white mb-3">
                  Link Aktivasi Langsung:
                </h4>

                <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-700 rounded-xl p-2.5 sm:p-3 mb-4">
                  <span className="text-xs sm:text-sm font-mono text-emerald-400 truncate flex-1">
                    {currentOrder.activationLink}
                  </span>
                  <button
                    onClick={copyActivationLink}
                    className="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Salin Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <a
                    href={currentOrder.activationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>Buka & Klaim Lisensi Sekarang</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {emailPreviewHtml && (
                    <button
                      onClick={() => setShowEmailPreview(!showEmailPreview)}
                      className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs text-center transition-all"
                    >
                      {showEmailPreview ? "Tutup Preview Email" : "Lihat Email"}
                    </button>
                  )}
                </div>
              </div>

              {/* Email HTML Preview */}
              {showEmailPreview && emailPreviewHtml && (
                <div className="text-left mb-6 animate-in fade-in duration-300">
                  <div className="rounded-2xl border border-neutral-300 overflow-hidden shadow-inner bg-white max-h-[450px] overflow-y-auto">
                    <iframe
                      srcDoc={emailPreviewHtml}
                      title="Preview Email"
                      className="w-full h-[450px] border-0"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Halo Admin Lapak Digitara, pesanan saya untuk Order #${currentOrder.orderId} atas nama ${name} sudah selesai. Terima kasih banyak!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Hubungi WhatsApp Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs sm:text-sm transition-all text-center"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
