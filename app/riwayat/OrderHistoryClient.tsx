"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  History,
  Clock,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Mail,
  Trash2,
  MessageCircle,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import {
  getUserSavedOrders,
  removeUserOrder,
  syncUserOrderWithServer,
  UserSavedOrder,
  saveUserOrder,
} from "@/lib/userHistory";

export default function OrderHistoryClient() {
  const [orders, setOrders] = useState<UserSavedOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [manualOrderId, setManualOrderId] = useState("");
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const loadOrders = () => {
    const list = getUserSavedOrders();
    setOrders(list);
  };

  useEffect(() => {
    loadOrders();
    const list = getUserSavedOrders();
    const needSync = list.filter(
      (o) => o.status === "PENDING" || o.status === "WAITING_CONFIRMATION"
    );
    if (needSync.length > 0) {
      setIsSyncing(true);
      Promise.all(needSync.map((o) => syncUserOrderWithServer(o.orderId))).finally(() => {
        setIsSyncing(false);
        loadOrders();
      });
    }
  }, []);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const copyText = (text: string, type: "id" | "link", val: string) => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(val);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedLink(val);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = manualOrderId.trim().toUpperCase();
    if (!cleanId) return;

    setIsSearchingManual(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/orders/${cleanId}/status`);
      const data = await res.json();
      if (data.status) {
        saveUserOrder({
          orderId: cleanId,
          status: data.status,
          activationLink: data.activationLink,
          totalAmount: data.totalAmount || 0,
          buyerEmail: data.buyerEmail || "",
          buyerName: data.buyerName || "",
          items: data.items || [],
          createdAt: data.createdAt || new Date().toISOString(),
          paidAt: data.paidAt,
        });
        setManualOrderId("");
        loadOrders();
      } else {
        setSearchError("Nomor Order ID tidak ditemukan di server.");
      }
    } catch (err) {
      setSearchError("Gagal menghubungi server untuk cek order.");
    } finally {
      setIsSearchingManual(false);
    }
  };

  const handleRefreshAll = async () => {
    setIsSyncing(true);
    await Promise.all(orders.map((o) => syncUserOrderWithServer(o.orderId)));
    setIsSyncing(false);
    loadOrders();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-xs">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950">
                Riwayat Pesanan Saya
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500">
                Pesanan yang pernah Anda buat di Lapak Digitara tersimpan di browser ini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleRefreshAll}
              disabled={isSyncing || orders.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors border border-neutral-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
              <span>Perbarui Status</span>
            </button>
          </div>
        </div>

        {/* Spam Notice Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-3 leading-relaxed">
          <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold mb-0.5">Catatan Penting Pengecekan Email Aktivasi:</strong>
            Setelah pembayaran Anda di-ACC admin, link aktivasi akan otomatis dikirimkan ke alamat email Anda. Jika email belum terlihat di Kotak Masuk (Inbox) utama, mohon selalu periksa folder <strong>Spam</strong> atau <strong>Promosi</strong> email Anda.
          </div>
        </div>

        {/* Manual Order ID Search */}
        <form onSubmit={handleManualSearch} className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={manualOrderId}
              onChange={(e) => setManualOrderId(e.target.value.toUpperCase())}
              placeholder="Cari & simpan Order ID lain (misal: DIGI-123456)"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-xs font-mono font-bold placeholder:font-sans placeholder:font-normal text-neutral-900 focus:outline-hidden focus:border-neutral-950 bg-neutral-50/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingManual || !manualOrderId.trim()}
            className="px-5 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isSearchingManual ? "Mencari..." : "Cari & Simpan"}
          </button>
        </form>

        {searchError && (
          <p className="text-xs text-rose-600 font-medium mt-2">{searchError}</p>
        )}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/80 shadow-xs">
          <History className="w-14 h-14 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800 mb-1">
            Belum Ada Transaksi Tersimpan
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mb-5 leading-relaxed">
            Semua pesanan baru yang Anda buat akan otomatis dicatat di sini. Jika admin sedang memproses pesanan Anda, Anda bisa menutup tab ini dan kembali kapan saja.
          </p>
          <Link
            href="/#products"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-neutral-950 text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Belanja Produk Sekarang</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const isPaid = ord.status === "PAID";
            const isWaiting = ord.status === "WAITING_CONFIRMATION";
            const isPending = ord.status === "PENDING";
            const isRejected = ord.status === "REJECTED";

            return (
              <div
                key={ord.orderId}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col gap-4"
              >
                {/* Order Top Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3.5 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs sm:text-sm text-neutral-950 bg-neutral-100 px-3 py-1 rounded-xl">
                      #{ord.orderId}
                    </span>
                    <button
                      onClick={() => copyText(ord.orderId, "id", ord.orderId)}
                      className="p-1 rounded-md text-neutral-400 hover:text-neutral-700"
                      title="Salin Order ID"
                    >
                      {copiedId === ord.orderId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-xs text-neutral-400">
                      {new Date(ord.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPaid && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lunas & Selesai</span>
                      </span>
                    )}
                    {isWaiting && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Sedang Dicek Admin</span>
                      </span>
                    )}
                    {isPending && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center gap-1.5">
                        <span>Menunggu Pembayaran</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                        <span>Dibatalkan</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                {ord.items && ord.items.length > 0 && (
                  <div className="divide-y divide-neutral-100">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          {it.image && (
                            <div className="relative w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 shrink-0 overflow-hidden">
                              <Image src={it.image} alt={it.name} fill className="object-contain p-1" />
                            </div>
                          )}
                          <div className="truncate">
                            <span className="font-bold text-neutral-900 block truncate">{it.name}</span>
                            <span className="text-xs text-neutral-500">
                              {it.duration} (x{it.quantity})
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-neutral-950 shrink-0">
                          {formatRupiah(it.price * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-3 border-t border-neutral-100 text-sm font-black text-neutral-950">
                  <span>Total Tagihan</span>
                  <span className="text-base font-mono">{formatRupiah(ord.totalAmount)}</span>
                </div>

                {/* Activation Link for PAID */}
                {isPaid && ord.activationLink && (
                  <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                      <span>Link Lisensi / Aktivasi Resmi Anda:</span>
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px]">
                        Siap Digunakan
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-xs font-mono text-emerald-300">
                      <span className="truncate flex-1">{ord.activationLink}</span>
                      <button
                        onClick={() => copyText(ord.activationLink!, "link", ord.orderId)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white shrink-0"
                        title="Salin Link"
                      >
                        {copiedLink === ord.orderId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <a
                        href={ord.activationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>Buka & Klaim Lisensi Sekarang</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Notice for WAITING */}
                {isWaiting && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2.5">
                    <p className="leading-relaxed">
                      ⏳ <strong>Pembayaran Anda sedang dalam antrean verifikasi Admin.</strong> Begitu admin meng-ACC, link aktivasi akan langsung tampil di sini dan dikirimkan ke email Anda. Cek juga folder Spam jika belum masuk di Inbox.
                    </p>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Halo Admin Lapak Digitara, saya ingin konfirmasi status pesanan Order #${ord.orderId} sebesar ${formatRupiah(ord.totalAmount)}. Terima kasih!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 underline"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Kirim Bukti Pembayaran via WhatsApp Admin</span>
                    </a>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2 text-xs text-neutral-400">
                  <button
                    onClick={async () => {
                      await syncUserOrderWithServer(ord.orderId);
                      loadOrders();
                    }}
                    className="text-neutral-700 hover:text-neutral-950 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Cek Status Sekarang</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Hapus pesanan #${ord.orderId} dari riwayat perangkat ini?`)) {
                        removeUserOrder(ord.orderId);
                      }
                    }}
                    className="text-neutral-400 hover:text-rose-600 flex items-center gap-1 transition-colors font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus dari Riwayat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
